// world.js - 세계관 시스템 모듈
import { state } from '../core/state.js';
import { autoSaveLocal } from '../core/storage.js';

let els = {};

/**
 * 세계관 안전장치
 */
function ensureWorld() {
    if (!state.project || typeof state.project !== 'object') return;

    if (!state.project.world || typeof state.project.world !== 'object') {
        state.project.world = {
            genre: '',
            tags: [],
            sections: { basic: { title: '기본 세계 설정', content: '' } }
        };
    }
    if (!Array.isArray(state.project.world.tags)) state.project.world.tags = [];
    if (!state.project.world.sections || typeof state.project.world.sections !== 'object') {
        state.project.world.sections = { basic: { title: '기본 세계 설정', content: '' } };
    }
    if (!state.project.world.sections.basic) {
        state.project.world.sections.basic = { title: '기본 세계 설정', content: '' };
    }
}

/**
 * 세계관 모듈 초기화
 */
export function initWorld(elements) {
    els = elements;
    ensureWorld();

    // 이벤트 리스너
    els.worldTags.addEventListener('click', (e) => {
        if (e.target.classList.contains('world-tag-remove')) {
            const idx = parseInt(e.target.dataset.idx);
            state.project.world.tags.splice(idx, 1);
            renderWorldTags();
            autoSaveLocal();
        }
    });

    els.worldAccordion.addEventListener('click', (e) => {
        const header = e.target.closest('.accordion-header');
        if (header && !e.target.closest('.accordion-delete')) {
            const item = header.closest('.accordion-item');
            item.classList.toggle('open');
        }

        if (e.target.closest('.accordion-delete')) {
            const item = e.target.closest('.accordion-item');
            const key = item.dataset.worldKey;
            if (key && key !== 'basic') {
                const section = state.project.world.sections[key];
                if (confirm(`'${section.title}' 항목을 삭제할까요?`)) {
                    delete state.project.world.sections[key];
                    item.remove();
                    autoSaveLocal();
                }
            }
        }
    });

    els.worldAccordion.addEventListener('input', (e) => {
        if (e.target.classList.contains('accordion-textarea')) {
            const item = e.target.closest('.accordion-item');
            const key = item.dataset.worldKey;
            if (key && state.project.world.sections[key]) {
                state.project.world.sections[key].content = e.target.value;
            }
        }
    });

    document.getElementById('addWorldSection').addEventListener('click', () => {
        const title = prompt('새 항목 이름을 입력하세요:', '');
        if (!title || !title.trim()) return;

        const key = 'section_' + Date.now();
        state.project.world.sections[key] = { title: title.trim(), content: '' };
        addWorldSectionUI(key, title.trim(), '', true);
        autoSaveLocal();
    });
}

/**
 * 세계관 태그 렌더링
 */
export function renderWorldTags() {
    ensureWorld();
    els.worldTags.innerHTML = '';

    (state.project.world.tags || []).forEach((tag, idx) => {
        const tagEl = document.createElement('span');
        tagEl.className = 'world-tag';
        tagEl.innerHTML = `${tag}<button class="world-tag-remove" data-idx="${idx}">×</button>`;
        els.worldTags.appendChild(tagEl);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'world-tag-add';
    addBtn.textContent = '+ 태그';
    addBtn.addEventListener('click', showTagInput);
    els.worldTags.appendChild(addBtn);
}

/**
 * 태그 입력 표시
 */
function showTagInput() {
    const existing = els.worldTags.querySelector('.world-tag-input');
    if (existing) return;

    const addBtn = els.worldTags.querySelector('.world-tag-add');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'world-tag-input';
    input.placeholder = '태그 입력';

    let committed = false;

    function commitTag() {
        if (committed) return;

        const v = input.value.trim();
        if (!v) {
            committed = true;
            renderWorldTags();
            return;
        }

        state.project.world.tags = Array.isArray(state.project.world.tags) ? state.project.world.tags : [];

        if (!state.project.world.tags.includes(v)) {
            state.project.world.tags.push(v);
        }

        committed = true;
        renderWorldTags();
        autoSaveLocal();
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitTag();
        } else if (e.key === 'Escape') {
            committed = true;
            renderWorldTags();
        }
    });

    input.addEventListener('blur', () => {
        commitTag();
    });

    addBtn.replaceWith(input);
    input.focus();
}

/**
 * 세계관 아코디언 렌더링
 */
export function renderWorldAccordion() {
    ensureWorld();
    els.worldAccordion.innerHTML = '';

    const sections = state.project.world.sections || {};
    Object.keys(sections).forEach((key, idx) => {
        const section = sections[key];
        addWorldSectionUI(key, section.title, section.content, idx === 0);
    });

    if (Object.keys(sections).length === 0) {
        state.project.world.sections = { basic: { title: '기본 세계 설정', content: '' } };
        addWorldSectionUI('basic', '기본 세계 설정', '', true);
    }
}

/**
 * 세계관 섹션 UI 추가
 */
function addWorldSectionUI(key, title, content = '', openByDefault = false) {
    const item = document.createElement('div');
    item.className = 'accordion-item' + (openByDefault ? ' open' : '');
    item.dataset.worldKey = key;

    const isBasic = key === 'basic';
    item.innerHTML = `
        <div class="accordion-header">
            <span class="accordion-icon">▶</span>
            <span class="accordion-title">${title}</span>
            ${!isBasic ? '<button class="accordion-delete">삭제</button>' : ''}
        </div>
        <div class="accordion-content">
            <textarea class="accordion-textarea" placeholder="${title}에 대해 작성하세요...">${content}</textarea>
        </div>
    `;
    els.worldAccordion.appendChild(item);
}

/**
 * 세계관 텍스트 변환 (AI 검토용)
 */
export function getWorldText() {
    ensureWorld();

    const world = state.project.world;
    let text = '';

    if (world.tags.length > 0) {
        text += `키워드: ${world.tags.join(', ')}\n\n`;
    }

    Object.values(world.sections).forEach(section => {
        if (section?.content) {
            text += `[${section.title}]\n${section.content}\n\n`;
        }
    });

    return text.trim() || '(없음)';
}
