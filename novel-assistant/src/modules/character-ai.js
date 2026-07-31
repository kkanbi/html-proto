// character-ai.js - AI 캐릭터 자동생성
import { addUsage, estimateTokens } from '../utils/api-usage.js';
import {
    getGeminiApiUrl,
    createGeminiRequestOptions,
    getApiErrorMessage,
    extractResponseText,
    extractUsage,
    calculateGeminiCost
} from '../utils/api-helper.js';

/**
 * AI로 캐릭터 정보 자동 생성
 */
export async function generateCharacterWithAI(characterName, role, genre) {
    const apiKey = document.getElementById('apiKey').value;

    if (!apiKey || !apiKey.startsWith('AIza')) {
        alert('먼저 퇴고 탭에서 Gemini API 키를 입력해주세요. (AIza... 로 시작)');
        return null;
    }

    if (!characterName || !characterName.trim()) {
        alert('캐릭터 이름을 먼저 입력해주세요.');
        return null;
    }

    const genreText = genre || '판타지';
    const roleText = role || '조연';

    const prompt = `당신은 소설 작가의 어시스턴트입니다. 다음 조건에 맞는 캐릭터를 창작해주세요.

**캐릭터 정보:**
- 이름: ${characterName}
- 역할: ${roleText}
- 장르: ${genreText}

**다음 항목들을 JSON 형식으로 작성해주세요:**

{
  "age": "나이 (예: 25세)",
  "job": "직업/신분",
  "background": "캐릭터의 배경 (2-3문장)",
  "personality": "성격/성향/특징 (2-3문장)",
  "behavior": "행동 패턴 (2-3문장)",
  "inner": "속내/비밀 (2-3문장)",
  "psychologyChange": "심리/의도 변화 (스토리 진행에 따른 성장)",
  "body": "신체 특징 (예: 키 175cm, 마른 체형)",
  "face": "얼굴/인상 (2-3문장)",
  "feature": "특징적인 외형 요소",
  "family": "가족 관계",
  "friends": "친구/동료 관계",
  "enemies": "적대 관계"
}

**주의사항:**
- ${genreText} 장르에 어울리는 설정으로 작성
- ${roleText} 역할에 맞는 성격과 배경 설정
- 구체적이고 생생한 묘사
- JSON 형식 외에 다른 텍스트는 포함하지 말 것`;

    try {
        // 로딩 표시
        showGeneratingMessage();

        const apiUrl = getGeminiApiUrl();
        const requestOptions = createGeminiRequestOptions(apiKey, prompt);

        const response = await fetch(apiUrl, requestOptions);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText;
            throw new Error(`API 오류 (${response.status}): ${errorMsg}`);
        }

        const result = await response.json();
        const generatedText = extractResponseText(result);

        // 토큰 사용량 및 비용 계산
        const { inputTokens, outputTokens } = extractUsage(result);
        const cost = calculateGeminiCost(inputTokens, outputTokens);

        // 사용량 기록
        addUsage('character-gen', cost, inputTokens, outputTokens);

        // JSON 파싱
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('JSON 형식을 찾을 수 없습니다.');
        }

        const characterData = JSON.parse(jsonMatch[0]);

        hideGeneratingMessage();
        showSuccessMessage(`캐릭터 생성 완료! (비용: $${cost.toFixed(4)})`);

        return characterData;

    } catch (error) {
        hideGeneratingMessage();
        console.error('AI Generation Error:', error);

        // 헬퍼 함수로 일관된 에러 메시지 생성
        const errorMessage = getApiErrorMessage(error);
        alert(errorMessage);

        return null;
    }
}

/**
 * 생성 중 메시지 표시
 */
function showGeneratingMessage() {
    const modal = document.querySelector('.character-modal-content');
    if (!modal) return;

    const overlay = document.createElement('div');
    overlay.id = 'aiGeneratingOverlay';
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        background: rgba(26, 26, 31, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        border-radius: 16px;
    `;

    overlay.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🤖</div>
        <div style="font-size: 16px; font-weight: 600; color: var(--accent);">AI가 캐릭터를 생성하고 있습니다...</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">잠시만 기다려주세요</div>
    `;

    modal.appendChild(overlay);
}

/**
 * 생성 중 메시지 숨김
 */
function hideGeneratingMessage() {
    const overlay = document.getElementById('aiGeneratingOverlay');
    if (overlay) overlay.remove();
}

/**
 * 성공 메시지 표시
 */
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'ai-success-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
