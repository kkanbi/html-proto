// characters.js - 캐릭터 관리 모듈
import { state } from '../core/state.js';
import { autoSaveLocal } from '../core/storage.js';
import { addPresetButtons } from './character-tooltip.js';
import { generateCharacterWithAI } from './character-ai.js';

let els = {};
let editingCharacterIndex = -1;

/**
 * 캐릭터 모듈 초기화
 * @param {Object} elements - DOM 요소 객체
 */
export function initCharacters(elements) {
    els = elements;

    // 이벤트 리스너
    document.getElementById('charModalSave').addEventListener('click', saveCharacter);
    document.getElementById('charModalCancel').addEventListener('click', closeCharacterModal);
    document.getElementById('charModalDelete').addEventListener('click', deleteCharacter);
    document.getElementById('charModalAIGenerate').addEventListener('click', handleAIGenerate);
    els.characterModal.addEventListener('click', (e) => {
        if (e.target === els.characterModal) closeCharacterModal();
    });

    // 이모지 선택기
    setupEmojiPicker();
}

/**
 * AI 자동생성 핸들러
 */
async function handleAIGenerate() {
    const name = document.getElementById('charModalName').value.trim();
    const role = document.getElementById('charModalRole').value;

    // 장르 가져오기
    const genre = document.getElementById('coreGenre')?.value || '판타지';

    const characterData = await generateCharacterWithAI(name, role, genre);

    if (characterData) {
        // 생성된 데이터를 필드에 채우기
        if (characterData.age) document.getElementById('charAge').value = characterData.age;
        if (characterData.job) document.getElementById('charJob').value = characterData.job;
        if (characterData.background) document.getElementById('charBackground').value = characterData.background;
        if (characterData.personality) document.getElementById('charPersonality').value = characterData.personality;
        if (characterData.behavior) document.getElementById('charBehavior').value = characterData.behavior;
        if (characterData.inner) document.getElementById('charInner').value = characterData.inner;
        if (characterData.psychologyChange) document.getElementById('charPsychologyChange').value = characterData.psychologyChange;
        if (characterData.body) document.getElementById('charBody').value = characterData.body;
        if (characterData.face) document.getElementById('charFace').value = characterData.face;
        if (characterData.feature) document.getElementById('charFeature').value = characterData.feature;
        if (characterData.family) document.getElementById('charFamily').value = characterData.family;
        if (characterData.friends) document.getElementById('charFriends').value = characterData.friends;
        if (characterData.enemies) document.getElementById('charEnemies').value = characterData.enemies;
    }
}

/**
 * 캐릭터 안전장치
 */
function ensureCharacters() {
    if (!Array.isArray(state.project.characters)) {
        state.project.characters = [];
    }
}

/**
 * 캐릭터 그리드 렌더링
 */
export function renderCharacterGrid() {
    ensureCharacters();
    els.characterGrid.innerHTML = '';

    state.project.characters.forEach((char, idx) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-avatar">${char.emoji || '🧑'}</div>
            <div class="character-name">${char.name || '이름 없음'}</div>
            <div class="character-role">${char.role || ''}</div>
        `;
        card.addEventListener('click', () => openCharacterModal(idx));
        els.characterGrid.appendChild(card);
    });

    const addCard = document.createElement('div');
    addCard.className = 'character-card add-card';
    addCard.innerHTML = `
        <div class="character-avatar">+</div>
        <div class="character-name">추가</div>
    `;
    addCard.addEventListener('click', () => openCharacterModal(-1));
    els.characterGrid.appendChild(addCard);
}

/**
 * 캐릭터 모달 열기
 * @param {number} index
 */
function openCharacterModal(index) {
    editingCharacterIndex = index;

    // 탭 초기화
    document.querySelectorAll('.character-modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-char-tab="basic"]').classList.add('active');
    document.querySelectorAll('.character-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-char-content="basic"]').classList.add('active');

    if (index === -1) {
        // 새 캐릭터
        document.getElementById('charModalAvatarEmoji').textContent = '🧑';
        document.getElementById('charModalName').value = '';
        document.getElementById('charModalRole').value = '조연';
        document.getElementById('charAge').value = '';
        document.getElementById('charJob').value = '';
        document.getElementById('charBackground').value = '';
        document.getElementById('charPersonality').value = '';
        document.getElementById('charBehavior').value = '';
        document.getElementById('charInner').value = '';
        document.getElementById('charPsychologyChange').value = '';
        document.getElementById('charBody').value = '';
        document.getElementById('charFace').value = '';
        document.getElementById('charFeature').value = '';
        document.getElementById('charFamily').value = '';
        document.getElementById('charFriends').value = '';
        document.getElementById('charEnemies').value = '';
        document.getElementById('charModalDelete').style.display = 'none';
    } else {
        // 기존 캐릭터 수정
        const char = state.project.characters[index];
        document.getElementById('charModalAvatarEmoji').textContent = char.emoji || '🧑';
        document.getElementById('charModalName').value = char.name || '';
        document.getElementById('charModalRole').value = char.role || '조연';
        document.getElementById('charAge').value = char.age || '';
        document.getElementById('charJob').value = char.job || '';
        document.getElementById('charBackground').value = char.background || '';
        document.getElementById('charPersonality').value = char.personality || '';
        document.getElementById('charBehavior').value = char.behavior || '';
        document.getElementById('charInner').value = char.inner || '';
        document.getElementById('charPsychologyChange').value = char.psychologyChange || '';
        document.getElementById('charBody').value = char.body || '';
        document.getElementById('charFace').value = char.face || '';
        document.getElementById('charFeature').value = char.feature || '';
        document.getElementById('charFamily').value = char.family || '';
        document.getElementById('charFriends').value = char.friends || '';
        document.getElementById('charEnemies').value = char.enemies || '';
        document.getElementById('charModalDelete').style.display = 'flex';
    }

    // 프리셋 버튼 추가
    addPresetButtons();

    els.characterModal.classList.add('active');
}

/**
 * 캐릭터 모달 닫기
 */
function closeCharacterModal() {
    els.characterModal.classList.remove('active');
    els.emojiPicker.classList.remove('active');
}

/**
 * 캐릭터 저장
 */
function saveCharacter() {
    ensureCharacters();
    const charData = {
        emoji: document.getElementById('charModalAvatarEmoji').textContent,
        name: document.getElementById('charModalName').value.trim(),
        role: document.getElementById('charModalRole').value,
        age: document.getElementById('charAge').value.trim(),
        job: document.getElementById('charJob').value.trim(),
        background: document.getElementById('charBackground').value.trim(),
        personality: document.getElementById('charPersonality').value.trim(),
        behavior: document.getElementById('charBehavior').value.trim(),
        inner: document.getElementById('charInner').value.trim(),
        psychologyChange: document.getElementById('charPsychologyChange').value.trim(),
        body: document.getElementById('charBody').value.trim(),
        face: document.getElementById('charFace').value.trim(),
        feature: document.getElementById('charFeature').value.trim(),
        family: document.getElementById('charFamily').value.trim(),
        friends: document.getElementById('charFriends').value.trim(),
        enemies: document.getElementById('charEnemies').value.trim()
    };

    if (!charData.name) {
        alert('캐릭터 이름을 입력해주세요.');
        return;
    }

    if (editingCharacterIndex === -1) {
        state.project.characters.push(charData);
    } else {
        state.project.characters[editingCharacterIndex] = charData;
    }

    renderCharacterGrid();
    closeCharacterModal();
    autoSaveLocal();
}

/**
 * 캐릭터 삭제
 */
function deleteCharacter() {
    ensureCharacters();
    if (editingCharacterIndex >= 0) {
        const char = state.project.characters[editingCharacterIndex];
        if (confirm(`'${char.name}' 캐릭터를 삭제할까요?`)) {
            state.project.characters.splice(editingCharacterIndex, 1);
            renderCharacterGrid();
            closeCharacterModal();
            autoSaveLocal();
        }
    }
}

/**
 * 이모지 선택기 설정
 */
function setupEmojiPicker() {
    document.getElementById('charModalAvatar').addEventListener('click', (e) => {
        e.stopPropagation();
        els.emojiPicker.classList.toggle('active');
    });

    els.emojiPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji-item')) {
            document.getElementById('charModalAvatarEmoji').textContent = e.target.textContent;
            els.emojiPicker.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#charModalAvatar')) {
            els.emojiPicker.classList.remove('active');
        }
    });
}

/**
 * 캐릭터를 텍스트로 변환 (AI 검토용)
 * @returns {string}
 */
export function getCharactersText() {
    ensureCharacters();

    if (state.project.characters.length === 0) return '(없음)';

    return state.project.characters.map(char => {
        let text = `[${char.name}] (${char.role})`;
        if (char.age) text += `\n나이: ${char.age}`;
        if (char.job) text += `\n직업: ${char.job}`;
        if (char.personality) text += `\n성격: ${char.personality}`;
        return text;
    }).join('\n\n');
}
