// character-tooltip.js - 캐릭터 툴팁 및 프리셋
import { state } from '../core/state.js';

let tooltip = null;
let editorElement = null;
let currentTimeout = null;

/**
 * 캐릭터 프리셋 데이터
 */
const CHARACTER_PRESETS = {
    '주인공': {
        personality: '정의롭고 책임감이 강하며, 주변 사람들을 보호하려는 성향이 있다.',
        behavior: '위기 상황에서 침착하게 판단하고, 남을 먼저 생각한다.',
        inner: '겉으로는 강해 보이지만 내면의 두려움과 고독을 숨기고 있다.'
    },
    '히로인': {
        personality: '따뜻하고 배려심이 깊으며, 때로는 고집이 세다.',
        behavior: '감정 표현이 솔직하고, 공감 능력이 뛰어나다.',
        inner: '강인한 외면 뒤에 상처받기 쉬운 마음을 가지고 있다.'
    },
    '조력자': {
        personality: '지혜롭고 신뢰할 수 있으며, 주인공에게 조언을 아끼지 않는다.',
        behavior: '냉정하게 상황을 분석하고, 필요할 때 도움의 손길을 내민다.',
        inner: '과거의 경험으로 인해 자신을 낮추는 경향이 있다.'
    },
    '악역': {
        personality: '야심만만하고 목적을 위해 수단을 가리지 않는다.',
        behavior: '교활하고 계산적이며, 감정을 잘 드러내지 않는다.',
        inner: '과거의 상처나 집착이 현재의 행동을 지배한다.'
    },
    '조연': {
        personality: '개성이 뚜렷하고, 이야기에 활력을 불어넣는다.',
        behavior: '상황에 따라 유머를 제공하거나 긴장감을 조성한다.',
        inner: '주변인이지만 나름의 목표와 갈등을 가지고 있다.'
    }
};

export function initCharacterTooltip() {
    editorElement = document.getElementById('episodeContent');
    if (!editorElement) return;

    // 툴팁 요소 생성
    createTooltip();

    // 에디터에서 텍스트 선택 시 이벤트
    editorElement.addEventListener('mouseup', handleTextSelection);
    editorElement.addEventListener('keyup', handleTextSelection);

    // 마우스가 에디터를 벗어나면 툴팁 숨김
    editorElement.addEventListener('mouseleave', hideTooltip);
}

/**
 * 툴팁 요소 생성
 */
function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'character-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    // 툴팁 외부 클릭 시 숨김
    document.addEventListener('click', (e) => {
        if (tooltip && !tooltip.contains(e.target) && e.target !== editorElement) {
            hideTooltip();
        }
    });
}

/**
 * 텍스트 선택 핸들러
 */
function handleTextSelection(e) {
    // 디바운싱
    if (currentTimeout) {
        clearTimeout(currentTimeout);
    }

    currentTimeout = setTimeout(() => {
        const selectedText = editorElement.value.substring(
            editorElement.selectionStart,
            editorElement.selectionEnd
        ).trim();

        // 선택된 텍스트가 있고, 2-10자 사이일 때만
        if (selectedText && selectedText.length >= 2 && selectedText.length <= 10) {
            checkCharacterName(selectedText, e);
        } else {
            hideTooltip();
        }
    }, 300);
}

/**
 * 캐릭터 이름 확인 및 툴팁 표시
 */
function checkCharacterName(name, event) {
    const characters = state.project.characters || [];
    const character = characters.find(c => c.name === name);

    if (character) {
        showTooltip(character, event);
    } else {
        hideTooltip();
    }
}

/**
 * 툴팁 표시
 */
function showTooltip(character, event) {
    if (!tooltip) return;

    // 툴팁 내용 구성
    let html = `
        <div class="character-tooltip-header">
            <span class="character-tooltip-avatar">${character.emoji || character.avatar || '🧑'}</span>
            <div class="character-tooltip-title">
                <div class="character-tooltip-name">${character.name}</div>
                <div class="character-tooltip-role">${character.role || '기타'}</div>
            </div>
        </div>
        <div class="character-tooltip-body">
    `;

    // 기본 정보
    if (character.age || character.job) {
        html += `<div class="character-tooltip-section">`;
        if (character.age) html += `<div class="character-tooltip-field"><strong>나이:</strong> ${character.age}</div>`;
        if (character.job) html += `<div class="character-tooltip-field"><strong>직업:</strong> ${character.job}</div>`;
        html += `</div>`;
    }

    // 성격
    if (character.personality) {
        html += `
            <div class="character-tooltip-section">
                <div class="character-tooltip-label">성격</div>
                <div class="character-tooltip-text">${character.personality}</div>
            </div>
        `;
    }

    // 행동 패턴
    if (character.behavior) {
        html += `
            <div class="character-tooltip-section">
                <div class="character-tooltip-label">행동 패턴</div>
                <div class="character-tooltip-text">${character.behavior}</div>
            </div>
        `;
    }

    html += `</div>`;

    tooltip.innerHTML = html;

    // 위치 계산 (마우스 근처)
    const rect = editorElement.getBoundingClientRect();
    const x = Math.min(event.clientX + 10, window.innerWidth - 320);
    const y = Math.min(event.clientY + 10, window.innerHeight - 200);

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = 'block';
}

/**
 * 툴팁 숨김
 */
function hideTooltip() {
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

/**
 * 캐릭터 프리셋 적용
 */
export function applyCharacterPreset(role) {
    const preset = CHARACTER_PRESETS[role];
    if (!preset) return null;

    return {
        personality: preset.personality,
        behavior: preset.behavior,
        inner: preset.inner
    };
}

/**
 * 캐릭터 모달에 프리셋 버튼 추가
 */
export function addPresetButtons() {
    const personalityTab = document.querySelector('[data-char-content="personality"]');
    if (!personalityTab) return;

    // 이미 프리셋 버튼이 있으면 중복 추가 방지
    if (personalityTab.querySelector('.preset-buttons')) return;

    const presetContainer = document.createElement('div');
    presetContainer.className = 'preset-buttons';
    presetContainer.innerHTML = `
        <div class="preset-label">프리셋 적용</div>
        <div class="preset-button-group">
            <button class="preset-btn" data-role="주인공">주인공형</button>
            <button class="preset-btn" data-role="히로인">히로인형</button>
            <button class="preset-btn" data-role="조력자">조력자형</button>
            <button class="preset-btn" data-role="악역">악역형</button>
            <button class="preset-btn" data-role="조연">조연형</button>
        </div>
    `;

    // 첫 번째 필드 앞에 삽입
    personalityTab.insertBefore(presetContainer, personalityTab.firstChild);

    // 프리셋 버튼 이벤트
    presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const role = btn.dataset.role;
            const preset = applyCharacterPreset(role);

            if (preset) {
                const personalityField = document.getElementById('charPersonality');
                const behaviorField = document.getElementById('charBehavior');
                const innerField = document.getElementById('charInner');

                // 기존 내용이 있으면 확인
                const hasContent = personalityField.value || behaviorField.value || innerField.value;
                if (hasContent) {
                    const confirmed = confirm('기존 내용을 프리셋으로 덮어쓰시겠습니까?');
                    if (!confirmed) return;
                }

                personalityField.value = preset.personality;
                behaviorField.value = preset.behavior;
                innerField.value = preset.inner;

                // 프리셋 적용 알림
                showPresetNotification(`${role} 프리셋 적용 완료`);
            }
        });
    });
}

/**
 * 프리셋 적용 알림
 */
function showPresetNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'preset-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
