// review.js - AI 퇴고 모듈 (간소화 버전)
import { scrollToText, replaceEditorText } from './editor.js';
import { getCoreText } from './core-settings.js';
import { getCharactersText } from './characters.js';
import { getWorldText } from './world.js';
import { GEMINI_CONFIG } from '../utils/constants.js';
import { autoSaveLocal } from '../core/storage.js';
import { addUsage, resetUsage, updateUsageDisplay } from '../utils/api-usage.js';
import {
    getGeminiApiUrl, createGeminiRequestOptions, calculateGeminiCost,
    getApiErrorMessage, extractResponseText, extractUsage
} from '../utils/api-helper.js';
import { state } from '../core/state.js';

let apiKey = '';
let els = {};

export function initReview(elements) {
    els = elements;

    // Gemini API 키 입력
    els.apiKey.addEventListener('input', () => {
        apiKey = els.apiKey.value.trim();
        if (apiKey.startsWith('AIza')) {
            els.apiStatus.textContent = '✓ 설정됨';
            els.apiStatus.className = 'api-status connected';
        } else {
            els.apiStatus.textContent = 'API 키를 입력하세요';
            els.apiStatus.className = 'api-status';
        }
    });

    // AI 검토 버튼
    document.getElementById('btnAiCheck')?.addEventListener('click', async () => {
        if (!apiKey || !apiKey.startsWith('AIza')) {
            alert('먼저 Gemini API 키를 입력해주세요. (AIza... 로 시작)');
            return;
        }

        const content = els.episodeContent.value.trim();
        if (!content) {
            alert('검토할 본문을 입력해주세요.');
            return;
        }

        await performAIReview(content);
    });

    // Reset 버튼
    document.getElementById('btnResetReview')?.addEventListener('click', () => {
        els.aiResult.textContent = '검토 결과가 초기화되었습니다.';
        els.aiResult.className = 'result-content';
    });

    // 사용량 리셋 버튼
    document.getElementById('btnResetUsage')?.addEventListener('click', () => {
        if (confirm('API 사용량 기록을 모두 초기화하시겠습니까?')) {
            resetUsage();
            alert('사용량이 초기화되었습니다.');
        }
    });

    // 초기 사용량 표시
    updateUsageDisplay();

    // 아코디언 토글
    document.getElementById('reviewAccordionToggle')?.addEventListener('click', () => {
        const body = document.getElementById('reviewAccordionBody');
        const icon = document.querySelector('#reviewAccordionToggle .review-accordion-icon');
        if (!body) return;
        const isCollapsed = body.style.display === 'none';
        body.style.display = isCollapsed ? '' : 'none';
        if (icon) icon.style.transform = isCollapsed ? '' : 'rotate(-90deg)';
    });
}

/**
 * AI 검토 수행 (Google Gemini)
 * @param {string} content - 원고 텍스트
 */
async function performAIReview(content) {
    // 자유질문 우선
    const customQuestion = document.getElementById('customQuestion')?.value.trim();

    // 검토 옵션 가져오기
    const checkSpelling = document.getElementById('checkSpelling').checked;
    const checkAwkward = document.getElementById('checkAwkward').checked;
    const checkConsistency = document.getElementById('checkConsistency').checked;
    const checkRepetition = document.getElementById('checkRepetition').checked;
    const checkFlow = document.getElementById('checkFlow').checked;

    const hasChecks = checkSpelling || checkAwkward || checkConsistency || checkRepetition || checkFlow;

    // 자유질문도 없고 체크박스도 없으면 경고
    if (!customQuestion && !hasChecks) {
        alert('최소 하나의 검토 옵션을 선택하거나 자유 질문을 입력해주세요.');
        return;
    }

    // 작품 컨텍스트 수집
    const coreText = getCoreText();
    const charactersText = getCharactersText();
    const worldText = getWorldText();

    // 프롬프트 구성
    let prompt = `당신은 전문 소설 편집자입니다. 다음 소설 원고를 검토해주세요.

**작품 정보:**
${coreText}

**등장인물:**
${charactersText}

**세계관:**
${worldText}

**원고:**
${content}

`;

    if (customQuestion) {
        // 자유질문 모드
        prompt += `**질문/요청사항:**\n${customQuestion}`;
    } else {
        // 체크박스 모드
        const reviewItems = [];
        if (checkSpelling) reviewItems.push('맞춤법 및 띄어쓰기');
        if (checkAwkward) reviewItems.push('어색한 문장 표현');
        if (checkConsistency) reviewItems.push('설정 일관성');
        if (checkRepetition) reviewItems.push('반복되는 표현');
        if (checkFlow) reviewItems.push('문장 흐름 및 연결');

        prompt += `**검토 항목:**
${reviewItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

**검토 요청사항:**
위의 검토 항목들을 중심으로 원고를 분석하고, 구체적인 피드백을 제공해주세요.

**응답 형식:**
각 검토 항목별로 다음과 같이 작성해주세요:

## [검토 항목명]
- '원문 텍스트' → '수정 텍스트': 수정 이유
- '원문 텍스트': 문제 설명 (단순 교체가 어려운 경우)

문제가 없는 항목은 "## [검토 항목명]" 아래에 "양호함"으로 표시해주세요.

**중요**: 원문은 반드시 소설에서 실제로 등장하는 텍스트를 정확히 작은따옴표(')로 인용하고, 수정안도 작은따옴표(')로 표시해주세요.

**형식 준수**: 각 섹션 헤더는 반드시 "## 섹션명" 형식으로 시작해야 합니다. 예: "## 맞춤법 및 띄어쓰기"`;
    }

    // 검토 버튼 비활성화
    const btnAiCheck = document.getElementById('btnAiCheck');
    if (btnAiCheck) btnAiCheck.disabled = true;

    // 타이머 설정
    let elapsedSeconds = 0;
    let timerInterval = null;

    function updateLoadingText(statusMsg = '') {
        const statusLine = statusMsg ? `\n${statusMsg}` : '';
        els.aiResult.textContent = `🤖 AI가 원고를 검토하고 있습니다...\n⏱ ${elapsedSeconds}초 경과${statusLine}`;
    }

    els.aiResult.textContent = '🤖 AI가 원고를 검토하고 있습니다...\n⏱ 0초 경과';
    els.aiResult.className = 'result-content loading';

    timerInterval = setInterval(() => {
        elapsedSeconds++;
        updateLoadingText();
    }, 1000);

    // API 호출 준비
    // 검토 결과는 길어질 수 있으므로 출력 한도를 넉넉히 잡는다.
    const apiUrl = getGeminiApiUrl();
    const requestOptions = createGeminiRequestOptions(
        apiKey,
        prompt,
        GEMINI_CONFIG.MAX_OUTPUT_TOKENS_LONG
    );

    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 120000;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 1) {
                const delayMs = Math.pow(2, attempt - 1) * 1000;
                elapsedSeconds = 0;
                updateLoadingText(`⚠️ ${attempt - 1}번 응답 없음 — ${delayMs / 1000}초 후 재시도 중...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                updateLoadingText(`🔄 ${attempt}번째 시도 중...`);
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            let response;
            try {
                response = await fetch(apiUrl, { ...requestOptions, signal: controller.signal });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);
                const errorMsg = errorData.error?.message || response.statusText;
                throw new Error(`API 오류 (${response.status}): ${errorMsg}`);
            }

            const result = await response.json();

            // 안전 필터 차단 / 출력 잘림도 여기서 구분해 던진다.
            const reviewResult = extractResponseText(result);
            const { inputTokens, outputTokens } = extractUsage(result);
            const cost = calculateGeminiCost(inputTokens, outputTokens);

            addUsage('review', cost, inputTokens, outputTokens);

            // 검토 결과를 현재 에피소드의 state에 저장 (Google Drive 저장 시 포함됨)
            const vol = state.project.currentVolume;
            const epIdx = state.currentEpisodeIndex;
            if (state.project.volumes[vol]?.episodes[epIdx]) {
                state.project.volumes[vol].episodes[epIdx].reviewResult = reviewResult;
                autoSaveLocal();
            }

            clearInterval(timerInterval);
            if (btnAiCheck) btnAiCheck.disabled = false;

            renderReviewResult(els.aiResult, reviewResult);

            document.getElementById('estimatedCost').textContent = `$${cost.toFixed(4)}`;
            return; // 성공 → 루프 종료

        } catch (error) {
            lastError = error;
            const isTimeout = error.name === 'AbortError';
            console.warn(`AI Review 시도 ${attempt} 실패:`, error.message);

            if (!isTimeout || attempt === MAX_RETRIES) {
                // 타임아웃이 아닌 오류이거나 마지막 재시도 실패
                break;
            }
            // 타임아웃이면 루프 계속 (재시도)
        }
    }

    // 모든 시도 실패
    clearInterval(timerInterval);
    if (btnAiCheck) btnAiCheck.disabled = false;

    console.error('AI Review 최종 실패:', lastError);
    const errorMessage = lastError?.name === 'AbortError'
        ? `⏱ ${MAX_RETRIES}회 시도 모두 응답 없음 (각 ${TIMEOUT_MS / 1000}초 초과).\n\n네트워크 상태를 확인하고 다시 시도해주세요.\n\n` + getApiErrorMessage(lastError)
        : getApiErrorMessage(lastError);

    els.aiResult.textContent = errorMessage;
    els.aiResult.className = 'result-content error';
}

/** 섹션 이름 → 타입 변환 */
function getSectionType(name) {
    if (name.includes('맞춤법') || name.includes('띄어쓰기')) return 'spelling';
    if (name.includes('어색') || name.includes('표현')) return 'awkward';
    if (name.includes('일관성') || name.includes('설정')) return 'consistency';
    if (name.includes('반복')) return 'repetition';
    if (name.includes('흐름') || name.includes('연결')) return 'flow';
    return 'default';
}

/**
 * 카드 텍스트에서 원문/수정안 추출
 * 패턴: '원문' → '수정안'  또는  '원문'
 */
function parseCardText(raw) {
    const arrowMatch = raw.match(/'([^']+)'\s*→\s*'([^']+)'/);
    if (arrowMatch) return { original: arrowMatch[1], correction: arrowMatch[2] };
    const quotedMatch = raw.match(/'([^']+)'/);
    if (quotedMatch) return { original: quotedMatch[1], correction: null };
    return null;
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * 검토 결과 마크다운을 HTML로 렌더링
 */
export function renderReviewResult(container, text) {
    if (!text) {
        container.textContent = 'AI 검토 결과가 여기 표시됩니다.';
        container.className = 'result-content';
        return;
    }

    const lines = text.split('\n');
    let html = '';
    let inSection = false;
    let currentType = 'default';

    lines.forEach(line => {
        if (line.startsWith('## ')) {
            // 신형식 섹션 헤더
            if (inSection) html += '</div>';
            currentType = getSectionType(line.slice(3));
            html += `<div class="review-section"><h4 class="type-${currentType}">${escapeHtml(line.slice(3))}</h4>`;
            inSection = true;
        } else if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
            // Gemini 응답 형식: **섹션명** (라인 전체가 bold)
            if (inSection) html += '</div>';
            const sectionName = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
            currentType = getSectionType(sectionName);
            html += `<div class="review-section"><h4 class="type-${currentType}">${escapeHtml(sectionName)}</h4>`;
            inSection = true;
        } else if (line.startsWith('### ') && getSectionType(line.slice(4)) !== 'default') {
            // Gemini 응답 형식: ### 섹션명 (섹션명이 인식되는 경우)
            if (inSection) html += '</div>';
            const sectionName = line.slice(4);
            currentType = getSectionType(sectionName);
            html += `<div class="review-section"><h4 class="type-${currentType}">${escapeHtml(sectionName)}</h4>`;
            inSection = true;
        } else if (/^\[\d+\.\s/.test(line) && line.endsWith(']')) {
            // 구형식 섹션 헤더: [3. 설정 일관성]
            if (inSection) html += '</div>';
            const sectionName = line.replace(/^\[\d+\.\s*/, '').replace(/\]$/, '');
            currentType = getSectionType(sectionName);
            html += `<div class="review-section"><h4 class="type-${currentType}">${escapeHtml(sectionName)}</h4>`;
            inSection = true;
        } else if (line.startsWith('### ')) {
            html += `<div class="review-line" style="font-weight:600;margin:4px 0 2px;">${escapeHtml(line.slice(4))}</div>`;
        } else if (line.startsWith('- ')) {
            const cardText = line.slice(2);
            const parsed = parseCardText(cardText);
            let dataAttrs = ` data-type="${currentType}"`;
            if (parsed?.original) {
                dataAttrs += ` data-original="${escapeAttr(parsed.original)}"`;
                if (parsed.correction) dataAttrs += ` data-correction="${escapeAttr(parsed.correction)}"`;
            }
            html += `<div class="review-card clickable type-${currentType}"${dataAttrs}>${escapeHtml(cardText)}</div>`;
        } else if (line.trim()) {
            // 구형식 본문 라인 — 백틱 인용이 있으면 클릭 가능
            const backtickMatch = line.match(/`([^`]{2,30})`/);
            if (backtickMatch) {
                html += `<div class="review-line legacy-clickable" data-original="${escapeAttr(backtickMatch[1])}" style="cursor:pointer;">${escapeHtml(line)}</div>`;
            } else {
                html += `<div class="review-line">${escapeHtml(line)}</div>`;
            }
        }
    });

    if (inSection) html += '</div>';

    container.innerHTML = html;
    container.className = 'result-content';

    // 구형식 백틱 라인 클릭 → 본문 이동
    container.querySelectorAll('.legacy-clickable').forEach(line => {
        line.addEventListener('click', () => scrollToText(line.dataset.original));
    });

    // 카드 클릭: 매 클릭마다 스크롤 + 처음 클릭 시 자동수정
    container.querySelectorAll('.review-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const original = card.dataset.original;
            const correction = card.dataset.correction;
            const isApplied = card.classList.contains('applied');

            if (!isApplied && original && correction) {
                // 첫 클릭: 자동수정 시도
                const success = replaceEditorText(original, correction);
                if (!success) scrollToText(original); // 이미 수정됐거나 없으면 스크롤만
            } else if (original) {
                // 이후 클릭: 해당 텍스트로 스크롤 (원문 없으면 수정안으로)
                const found = scrollToText(original);
                if (!found && correction) scrollToText(correction);
            }

            card.classList.toggle('applied');
        });
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// estimateCost와 updateUsageDisplay는 api-usage.js로 이동됨
