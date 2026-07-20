// treatment.js - 트리트먼트 트리뷰 모듈
import { state } from '../core/state.js';
import { autoSaveLocal } from '../core/storage.js';

let els = {};

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

/**
 * 트리 열림/닫힘 상태 저장
 */
function saveTreeState() {
    const openItems = new Set();
    els.treatmentTree.querySelectorAll('.tree-item.open').forEach(item => {
        const key = [item.dataset.partId, item.dataset.sectionId, item.dataset.episodeId].filter(Boolean).join('/');
        if (key) openItems.add(key);
    });

    const openScenes = new Set();
    els.treatmentTree.querySelectorAll('.scene-item.open').forEach(item => {
        if (item.dataset.sceneId) openScenes.add(item.dataset.sceneId);
    });

    const closedEpSections = new Set();
    els.treatmentTree.querySelectorAll('.ep-section').forEach(sec => {
        if (!sec.classList.contains('open')) {
            const epId = sec.closest('.tree-item')?.dataset.episodeId;
            const title = sec.querySelector('.ep-section-title')?.textContent;
            if (epId && title) closedEpSections.add(epId + '/' + title);
        }
    });

    const container = els.treatmentTree.closest('.sub-tab-content') || els.treatmentTree.parentElement;
    const scrollTop = container ? container.scrollTop : 0;

    return { openItems, openScenes, closedEpSections, scrollTop };
}

/**
 * 트리 열림/닫힘 상태 복원
 */
function restoreTreeState(saved) {
    if (!saved || saved.openItems.size === 0) return; // 저장된 상태 없으면 기본값 유지

    els.treatmentTree.querySelectorAll('.tree-item').forEach(item => {
        const key = [item.dataset.partId, item.dataset.sectionId, item.dataset.episodeId].filter(Boolean).join('/');
        if (saved.openItems.has(key)) {
            item.classList.add('open');
        } else {
            item.classList.remove('open');
        }
    });

    els.treatmentTree.querySelectorAll('.scene-item').forEach(item => {
        if (saved.openScenes.has(item.dataset.sceneId)) {
            item.classList.add('open');
        } else {
            item.classList.remove('open');
        }
    });

    els.treatmentTree.querySelectorAll('.ep-section').forEach(sec => {
        const epId = sec.closest('.tree-item')?.dataset.episodeId;
        const title = sec.querySelector('.ep-section-title')?.textContent;
        if (epId && title && saved.closedEpSections.has(epId + '/' + title)) {
            sec.classList.remove('open');
        }
    });

    const container = els.treatmentTree.closest('.sub-tab-content') || els.treatmentTree.parentElement;
    if (container) container.scrollTop = saved.scrollTop;

    requestAnimationFrame(() => {
        els.treatmentTree.querySelectorAll('.tree-item.open.leaf .tree-textarea').forEach(autoResizeTextarea);
        els.treatmentTree.querySelectorAll('.scene-item.open .scene-textarea').forEach(autoResizeTextarea);
    });
}

/**
 * 트리 아이템(부/섹션/에피소드) 인라인 이름 편집
 */
function inlineRename(item) {
    const label = item.querySelector(':scope > .tree-header .tree-label');
    if (!label || label.querySelector('input')) return;

    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;
    const original = label.textContent;

    const input = document.createElement('input');
    input.className = 'inline-rename-input';
    input.value = original;
    label.textContent = '';
    label.appendChild(input);
    input.focus();
    input.select();

    const save = () => {
        const name = input.value.trim() || original;
        label.textContent = name;
        const part = state.project.treatment.parts.find(p => p.id === partId);
        if (!part) return;
        if (episodeId) {
            const ep = part.sections.find(s => s.id === sectionId)?.episodes.find(e => e.id === episodeId);
            if (ep) ep.title = name;
        } else if (sectionId) {
            const sec = part.sections.find(s => s.id === sectionId);
            if (sec) sec.title = name;
        } else {
            part.title = name;
        }
        autoSaveLocal();
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { label.textContent = original; }
    });
}

/**
 * 씬 아이템 인라인 이름 편집
 */
function inlineRenameScene(treeItem, sceneItem) {
    const titleEl = sceneItem.querySelector('.scene-item-title');
    if (!titleEl || titleEl.querySelector('input')) return;

    const original = titleEl.textContent;
    const input = document.createElement('input');
    input.className = 'inline-rename-input';
    input.value = original;
    titleEl.textContent = '';
    titleEl.appendChild(input);
    input.focus();
    input.select();

    const save = () => {
        const name = input.value.trim() || original;
        titleEl.textContent = name;
        const part = state.project.treatment.parts.find(p => p.id === treeItem.dataset.partId);
        const section = part?.sections.find(s => s.id === treeItem.dataset.sectionId);
        const episode = section?.episodes.find(ep => ep.id === treeItem.dataset.episodeId);
        const scene = episode?.scenes?.find(sc => sc.id === sceneItem.dataset.sceneId);
        if (scene) { scene.title = name; autoSaveLocal(); }
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { titleEl.textContent = original; }
    });
}

function ensureTreatment() {
    if (!state.project || typeof state.project !== 'object') return;
    if (!state.project.treatment || typeof state.project.treatment !== 'object') {
        state.project.treatment = { parts: [] };
    }
    if (!Array.isArray(state.project.treatment.parts)) {
        state.project.treatment.parts = [];
    }
}

export function initTreatment(elements) {
    els = elements;
    ensureTreatment();

    // 트리 클릭 이벤트
    els.treatmentTree.addEventListener('click', (e) => {
        // 씬 액션 버튼 (tree-action-btn보다 먼저 체크)
        const sceneActionBtn = e.target.closest('.scene-action-btn');
        if (sceneActionBtn) {
            e.stopPropagation();
            handleSceneAction(sceneActionBtn.dataset.action,
                sceneActionBtn.closest('.tree-item'),
                sceneActionBtn.closest('.scene-item'));
            return;
        }

        // 트리 액션 버튼 (저장, 히스토리, 이름변경, 삭제)
        const actionBtn = e.target.closest('.tree-action-btn');
        if (actionBtn) {
            e.stopPropagation();
            handleTreeAction(actionBtn.dataset.action, actionBtn.closest('.tree-item'));
            return;
        }

        // 에피소드 내 섹션 헤더 (갈색 제목) 접기/펼치기
        const epSectionHeader = e.target.closest('.ep-section-header');
        if (epSectionHeader) {
            e.stopPropagation();
            epSectionHeader.closest('.ep-section').classList.toggle('open');
            return;
        }

        // 씬 아이템 헤더 접기/펼치기
        const sceneHeader = e.target.closest('.scene-item-header');
        if (sceneHeader) {
            e.stopPropagation();
            const sceneItem = sceneHeader.closest('.scene-item');
            sceneItem.classList.toggle('open');
            if (sceneItem.classList.contains('open')) {
                requestAnimationFrame(() => {
                    sceneItem.querySelectorAll('.scene-textarea').forEach(autoResizeTextarea);
                });
            }
            return;
        }

        // 씬 추가 버튼
        if (e.target.classList.contains('scene-add-btn')) {
            e.stopPropagation();
            addScene(e.target.closest('.tree-item'));
            return;
        }

        // tree-header 클릭 (에피소드/섹션/부 펼치기·접기)
        const header = e.target.closest('.tree-header');
        if (header) {
            const item = header.closest('.tree-item');
            item.classList.toggle('open');
            if (item.classList.contains('open') && item.classList.contains('leaf')) {
                requestAnimationFrame(() => {
                    item.querySelectorAll('.tree-textarea').forEach(autoResizeTextarea);
                });
            }
        }
    });

    // 입력 이벤트 + 자동 높이 조절
    els.treatmentTree.addEventListener('input', (e) => {
        if (e.target.classList.contains('tree-textarea')) {
            const item = e.target.closest('.tree-item');
            updateEpisodeField(item, e.target.dataset.episodeField, e.target.value);
            autoResizeTextarea(e.target);
        }
        if (e.target.classList.contains('scene-textarea')) {
            updateSceneField(
                e.target.closest('.tree-item'),
                e.target.closest('.scene-item'),
                e.target.dataset.sceneField,
                e.target.value
            );
            autoResizeTextarea(e.target);
        }
    });

    // 태그 관련 이벤트
    els.treatmentTree.addEventListener('click', (e) => {
        // 태그 추가 버튼
        if (e.target.classList.contains('episode-tag-add')) {
            e.stopPropagation();
            const item = e.target.closest('.tree-item');
            addEpisodeTag(item);
        }
        // 태그 제거 버튼
        else if (e.target.classList.contains('episode-tag-remove')) {
            e.stopPropagation();
            const tag = e.target.parentElement.dataset.tag;
            const item = e.target.closest('.tree-item');
            removeEpisodeTag(item, tag);
        }
    });

    // 부 추가 버튼
    document.getElementById('addTreatmentPart')?.addEventListener('click', () => {
        ensureTreatment();
        const partNum = state.project.treatment.parts.length + 1;
        const newId = 'part_' + Date.now();
        state.project.treatment.parts.push({ id: newId, title: partNum + '부', sections: [] });
        renderTreatmentTree();
        autoSaveLocal();
        requestAnimationFrame(() => {
            const el = els.treatmentTree.querySelector(`[data-part-id="${newId}"]:not([data-section-id])`);
            if (el) inlineRename(el);
        });
    });
}

export function renderTreatmentTree() {
    ensureTreatment();
    const saved = saveTreeState();
    els.treatmentTree.innerHTML = '';

    if (state.project.treatment.parts.length === 0) {
        state.project.treatment.parts = [{
            id: 'part_' + Date.now(),
            title: '1부',
            sections: [{ id: 'sec_' + Date.now(), title: '기', episodes: [] }]
        }];
    }

    const counter = { n: 0 };
    state.project.treatment.parts.forEach(part => {
        els.treatmentTree.appendChild(createPartElement(part, counter));
    });

    restoreTreeState(saved);
}

function createPartElement(part, counter) {
    const item = document.createElement('div');
    item.className = 'tree-item open';
    item.dataset.partId = part.id;

    item.innerHTML = `
        <div class="tree-header">
            <span class="tree-toggle">▶</span>
            <span class="tree-icon">📁</span>
            <span class="tree-label">${part.title}</span>
            <div class="tree-actions">
                <button class="tree-action-btn" data-action="add-section" title="섹션 추가">+📁</button>
                <button class="tree-action-btn" data-action="rename" title="이름 변경">✏️</button>
                <button class="tree-action-btn delete" data-action="delete" title="삭제">🗑️</button>
            </div>
        </div>
        <div class="tree-children"></div>
    `;

    const children = item.querySelector('.tree-children');
    (part.sections || []).forEach(section => {
        children.appendChild(createSectionElement(part.id, section, counter));
    });

    return item;
}

function createSectionElement(partId, section, counter) {
    const item = document.createElement('div');
    item.className = 'tree-item open';
    item.dataset.partId = partId;
    item.dataset.sectionId = section.id;

    item.innerHTML = `
        <div class="tree-header">
            <span class="tree-toggle">▶</span>
            <span class="tree-icon">📂</span>
            <span class="tree-label">${section.title}</span>
            <div class="tree-actions">
                <button class="tree-action-btn" data-action="add-episode" title="회차 추가">+📄</button>
                <button class="tree-action-btn" data-action="rename" title="이름 변경">✏️</button>
                <button class="tree-action-btn delete" data-action="delete" title="삭제">🗑️</button>
            </div>
        </div>
        <div class="tree-children"></div>
    `;

    const children = item.querySelector('.tree-children');
    (section.episodes || []).forEach(episode => {
        counter.n++;
        children.appendChild(createEpisodeElement(partId, section.id, episode, counter.n));
    });

    return item;
}

function createEpisodeElement(partId, sectionId, episode, epNum) {
    const item = document.createElement('div');
    item.className = 'tree-item leaf';
    item.dataset.partId = partId;
    item.dataset.sectionId = sectionId;
    item.dataset.episodeId = episode.id;

    const tags = episode.tags || [];
    const scenes = episode.scenes || [];

    const headerTagsHtml = tags.map(tag =>
        `<span class="scene-header-tag">${escapeHtml(tag)}</span>`
    ).join('');

    const bodyTagsHtml = tags.map(tag =>
        `<span class="episode-tag" data-tag="${tag}">${tag} <button class="episode-tag-remove">×</button></span>`
    ).join('');

    const scenesHtml = scenes.map((scene, idx) => `
        <div class="scene-item" data-scene-id="${scene.id}">
            <div class="scene-item-header">
                <span class="scene-item-toggle">▶</span>
                <span class="scene-item-num">${idx + 1}</span>
                <span class="scene-item-title">${escapeHtml(scene.title || ('씬 ' + (idx + 1)))}</span>
                <div class="scene-item-actions">
                    <button class="scene-action-btn" data-action="rename-scene">✏️</button>
                    <button class="scene-action-btn" data-action="delete-scene">🗑️</button>
                </div>
            </div>
            <div class="scene-item-body">
                <div class="scene-field">
                    <label class="scene-field-label">기능</label>
                    <textarea class="scene-textarea" data-scene-field="sceneFunction" placeholder="이 씬의 서사적 기능...">${escapeHtml(scene.sceneFunction || '')}</textarea>
                </div>
                <div class="scene-field">
                    <label class="scene-field-label">사건</label>
                    <textarea class="scene-textarea" data-scene-field="events" placeholder="이 씬의 주요 사건...">${escapeHtml(scene.events || '')}</textarea>
                </div>
                <div class="scene-field">
                    <label class="scene-field-label">핵심 대사</label>
                    <textarea class="scene-textarea" data-scene-field="dialogue" placeholder="핵심 대사나 문장...">${escapeHtml(scene.dialogue || '')}</textarea>
                </div>
            </div>
        </div>
    `).join('');

    item.innerHTML = `
        <div class="tree-header">
            <span class="tree-toggle">▶</span>
            <span class="scene-ep-num">${epNum}</span>
            <span class="tree-label">${episode.title}</span>
            <div class="scene-header-tags">${headerTagsHtml}</div>
            <div class="tree-actions">
                <button class="tree-action-btn" data-action="save-checkpoint" title="체크포인트 저장">💾</button>
                <button class="tree-action-btn" data-action="view-history" title="버전 히스토리">📋</button>
                <button class="tree-action-btn" data-action="rename" title="이름 변경">✏️</button>
                <button class="tree-action-btn delete" data-action="delete" title="삭제">🗑️</button>
            </div>
        </div>
        <div class="tree-content">
            <div class="treatment-episode-section">
                <label class="treatment-episode-label">태그</label>
                <div class="episode-tags-container">
                    ${bodyTagsHtml}
                    <button class="episode-tag-add">+ 태그 추가</button>
                </div>
            </div>

            <div class="ep-section open">
                <div class="ep-section-header">
                    <span class="ep-section-toggle">▶</span>
                    <span class="ep-section-title">씬 구성</span>
                </div>
                <div class="ep-section-body">
                    <div class="scene-list">${scenesHtml}</div>
                    <button class="scene-add-btn">+ 씬 추가</button>
                </div>
            </div>

            <div class="ep-section open">
                <div class="ep-section-header">
                    <span class="ep-section-toggle">▶</span>
                    <span class="ep-section-title">연출 가이드</span>
                </div>
                <div class="ep-section-body">
                    <textarea class="tree-textarea" data-episode-field="direction" placeholder="묘사 가이드...">${episode.direction || ''}</textarea>
                </div>
            </div>

            <div class="ep-section open">
                <div class="ep-section-header">
                    <span class="ep-section-toggle">▶</span>
                    <span class="ep-section-title">메모</span>
                </div>
                <div class="ep-section-body">
                    <textarea class="tree-textarea" data-episode-field="memo" placeholder="이 회차에 대한 메모...">${episode.memo || ''}</textarea>
                </div>
            </div>
        </div>
    `;

    return item;
}

function handleTreeAction(action, item) {
    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;

    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    if (action === 'add-section') {
        part.sections = part.sections || [];
        const defaultTitles = ['기', '승', '전', '결'];
        const defaultTitle = defaultTitles[part.sections.length] || ('섹션 ' + (part.sections.length + 1));
        const newId = 'sec_' + Date.now();
        part.sections.push({ id: newId, title: defaultTitle, episodes: [] });
        renderTreatmentTree();
        autoSaveLocal();
        requestAnimationFrame(() => {
            const el = els.treatmentTree.querySelector(`[data-section-id="${newId}"]:not([data-episode-id])`);
            if (el) inlineRename(el);
        });
    } else if (action === 'add-episode') {
        const section = part.sections.find(s => s.id === sectionId);
        if (section) {
            const epNum = section.episodes.length + 1;
            const newId = 'ep_' + Date.now();
            section.episodes = section.episodes || [];
            section.episodes.push({
                id: newId, title: epNum + '화',
                tags: [], memo: '', summary: '', setting: '',
                events: '', characterChange: '', direction: '', scenes: []
            });
            renderTreatmentTree();
            autoSaveLocal();
            requestAnimationFrame(() => {
                const el = els.treatmentTree.querySelector(`[data-episode-id="${newId}"]`);
                if (el) inlineRename(el);
            });
        }
    } else if (action === 'rename') {
        inlineRename(item);
    } else if (action === 'delete') {
        if (confirm('삭제할까요?')) {
            if (episodeId) {
                const section = part.sections.find(s => s.id === sectionId);
                section.episodes = section.episodes.filter(ep => ep.id !== episodeId);
            } else if (sectionId) {
                part.sections = part.sections.filter(s => s.id !== sectionId);
            } else {
                state.project.treatment.parts = state.project.treatment.parts.filter(p => p.id !== partId);
            }
            renderTreatmentTree();
            autoSaveLocal();
        }
    } else if (action === 'save-checkpoint') {
        if (episodeId) {
            saveCheckpoint(partId, sectionId, episodeId);
        }
    } else if (action === 'view-history') {
        if (episodeId) {
            showCheckpointHistory(partId, sectionId, episodeId);
        }
    } else if (action === 'compare') {
        if (episodeId) {
            const section = part.sections.find(s => s.id === sectionId);
            const episode = section.episodes.find(ep => ep.id === episodeId);
            showVersionCompare(episode);
        }
    }
}

function updateEpisodeField(item, field, value) {
    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;

    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;

    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode || !field) return;

    episode[field] = value;
}

/**
 * 태그 추가
 */
function addEpisodeTag(item) {
    const tagName = prompt('태그 이름 (예: 핵심 장면, 복선, 감정선):', '');
    if (!tagName || !tagName.trim()) return;

    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;

    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;

    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode) return;

    if (!episode.tags) episode.tags = [];
    if (!episode.tags.includes(tagName.trim())) {
        episode.tags.push(tagName.trim());
        renderTreatmentTree();
        autoSaveLocal();
    }
}

/**
 * 태그 제거
 */
function removeEpisodeTag(item, tag) {
    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;

    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;

    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode || !episode.tags) return;

    episode.tags = episode.tags.filter(t => t !== tag);
    renderTreatmentTree();
    autoSaveLocal();
}

/**
 * 씬 추가
 */
function addScene(item) {
    const partId = item.dataset.partId;
    const sectionId = item.dataset.sectionId;
    const episodeId = item.dataset.episodeId;
    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;
    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;
    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode) return;
    if (!episode.scenes) episode.scenes = [];
    const sceneNum = episode.scenes.length + 1;
    const newSceneId = 'scene_' + Date.now();
    episode.scenes.push({
        id: newSceneId,
        title: '씬 ' + sceneNum,
        events: '',
        dialogue: '',
        sceneFunction: ''
    });
    renderTreatmentTree();
    autoSaveLocal();
    requestAnimationFrame(() => {
        const treeItem = els.treatmentTree.querySelector(`[data-episode-id="${episodeId}"]`);
        const sceneItem = treeItem?.querySelector(`[data-scene-id="${newSceneId}"]`);
        if (treeItem && sceneItem) inlineRenameScene(treeItem, sceneItem);
    });
}

/**
 * 씬 필드 업데이트
 */
function updateSceneField(treeItem, sceneItem, field, value) {
    if (!treeItem || !sceneItem || !field) return;
    const part = state.project.treatment.parts.find(p => p.id === treeItem.dataset.partId);
    if (!part) return;
    const section = part.sections.find(s => s.id === treeItem.dataset.sectionId);
    if (!section) return;
    const episode = section.episodes.find(ep => ep.id === treeItem.dataset.episodeId);
    if (!episode) return;
    const scene = (episode.scenes || []).find(sc => sc.id === sceneItem.dataset.sceneId);
    if (scene) scene[field] = value;
}

/**
 * 씬 액션 처리 (이름변경, 삭제)
 */
function handleSceneAction(action, treeItem, sceneItem) {
    if (!treeItem || !sceneItem) return;
    const part = state.project.treatment.parts.find(p => p.id === treeItem.dataset.partId);
    if (!part) return;
    const section = part.sections.find(s => s.id === treeItem.dataset.sectionId);
    if (!section) return;
    const episode = section.episodes.find(ep => ep.id === treeItem.dataset.episodeId);
    if (!episode) return;
    if (action === 'rename-scene') {
        inlineRenameScene(treeItem, sceneItem);
    } else if (action === 'delete-scene') {
        if (confirm('이 씬을 삭제할까요?')) {
            episode.scenes = (episode.scenes || []).filter(sc => sc.id !== sceneItem.dataset.sceneId);
            renderTreatmentTree();
            autoSaveLocal();
        }
    }
}

/**
 * 트리트먼트 회차 제목으로 소설 회차 인덱스 매칭
 * "2화", "2화 - 제목", "2" 등에서 숫자 추출 후 ep.number로 매칭
 */
function findNovelEpisodeIndex(treatmentTitle, vol) {
    if (!vol || !vol.episodes.length) return -1;
    const match = treatmentTitle.match(/(\d+)/);
    if (match) {
        const num = parseInt(match[1]);
        const idx = vol.episodes.findIndex(ep => ep.number === num);
        if (idx !== -1) return idx;
    }
    // 번호 매칭 실패 시 제목으로 시도
    return vol.episodes.findIndex(ep => ep.title === treatmentTitle);
}

/**
 * 체크포인트 저장
 */
function saveCheckpoint(partId, sectionId, episodeId) {
    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;

    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode) return;

    const message = prompt('체크포인트 메모 (선택사항):', '');
    if (message === null) return; // 취소

    // 체크포인트 배열 초기화
    if (!episode.checkpoints) {
        episode.checkpoints = [];
    }

    // 트리트먼트 제목으로 소설 회차 매칭해서 본문 가져오기
    const vol = state.project.volumes[state.project.currentVolume];
    const matchedIndex = findNovelEpisodeIndex(episode.title, vol);
    const episodeIndex = matchedIndex !== -1 ? matchedIndex : state.currentEpisodeIndex;
    const currentContent = vol ? (vol.episodes[episodeIndex]?.content || '') : '';

    // 현재 상태 스냅샷 생성
    const checkpoint = {
        id: 'cp_' + Date.now(),
        timestamp: new Date().toISOString(),
        message: message.trim() || '체크포인트',
        data: {
            title: episode.title,
            tags: [...(episode.tags || [])],
            memo: episode.memo || '',
            summary: episode.summary || '',
            setting: episode.setting || '',
            events: episode.events || '',
            characterChange: episode.characterChange || '',
            direction: episode.direction || '',
            episodeContent: currentContent
        }
    };

    episode.checkpoints.push(checkpoint);
    autoSaveLocal();
    alert('체크포인트가 저장되었습니다!');
}

/**
 * 체크포인트 히스토리 보기
 */
function showCheckpointHistory(partId, sectionId, episodeId) {
    const part = state.project.treatment.parts.find(p => p.id === partId);
    if (!part) return;

    const section = part.sections.find(s => s.id === sectionId);
    if (!section) return;

    const episode = section.episodes.find(ep => ep.id === episodeId);
    if (!episode) return;

    if (!episode.checkpoints || episode.checkpoints.length === 0) {
        alert('저장된 체크포인트가 없습니다.');
        return;
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'checkpoint-modal';
    modal.innerHTML = `
        <div class="checkpoint-modal-content">
            <div class="checkpoint-modal-header">
                <h3>버전 히스토리 - ${episode.title}</h3>
                <button class="checkpoint-modal-close">×</button>
            </div>
            <div class="checkpoint-modal-body">
                <div class="checkpoint-list"></div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const listContainer = modal.querySelector('.checkpoint-list');

    // 최신순으로 정렬
    const sortedCheckpoints = [...episode.checkpoints].reverse();

    sortedCheckpoints.forEach((cp, index) => {
        const item = document.createElement('div');
        item.className = 'checkpoint-item';

        const date = new Date(cp.timestamp);
        const timeStr = date.toLocaleString('ko-KR');

        item.innerHTML = `
            <div class="checkpoint-header">
                <span class="checkpoint-time">${timeStr}</span>
                <span class="checkpoint-message">${cp.message}</span>
            </div>
            <div class="checkpoint-actions">
                <button class="checkpoint-btn" data-action="compare" data-checkpoint-id="${cp.id}">비교하기</button>
                <button class="checkpoint-btn" data-action="restore" data-checkpoint-id="${cp.id}">복원하기</button>
                <button class="checkpoint-btn delete" data-action="delete" data-checkpoint-id="${cp.id}">삭제</button>
            </div>
        `;

        listContainer.appendChild(item);
    });

    // 이벤트 핸들러
    modal.querySelector('.checkpoint-modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    listContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.checkpoint-btn');
        if (!btn) return;

        const checkpointId = btn.dataset.checkpointId;
        const action = btn.dataset.action;

        if (action === 'compare') {
            compareCheckpoint(episode, checkpointId);
        } else if (action === 'restore') {
            restoreCheckpoint(episode, checkpointId, modal);
        } else if (action === 'delete') {
            deleteCheckpoint(episode, checkpointId, modal);
        }
    });
}

/**
 * LCS 기반 라인 diff 계산
 * 반환값: [{type: 'same'|'deleted'|'added', text: string}, ...]
 */
function computeLineDiff(oldLines, newLines) {
    const m = oldLines.length, n = newLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.unshift({ type: 'same', text: oldLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'added', text: newLines[j - 1] });
            j--;
        } else {
            result.unshift({ type: 'deleted', text: oldLines[i - 1] });
            i--;
        }
    }
    return result;
}

/**
 * 텍스트를 diff용으로 정규화 (앞뒤 공백 제거, 빈 줄 제거)
 */
function normalizeForDiff(text) {
    return text
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);
}

/**
 * 체크포인트 비교 (본문 텍스트 diff 뷰, 문단 단위 복원 지원)
 */
function compareCheckpoint(episode, checkpointId) {
    const checkpoint = episode.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    const rawOld = checkpoint.data.episodeContent || '';
    const vol = state.project.volumes[state.project.currentVolume];
    const matchedIndex = findNovelEpisodeIndex(episode.title, vol);
    const targetIndex = matchedIndex !== -1 ? matchedIndex : state.currentEpisodeIndex;
    const rawNew = vol ? (vol.episodes[targetIndex]?.content || '') : '';

    if (!rawOld && !rawNew) {
        alert('비교할 본문 내용이 없습니다.\n체크포인트 저장 시 편집기에 해당 화차 본문이 열려 있어야 합니다.');
        return;
    }

    // 공백/줄바꿈 정규화 후 diff
    const oldLines = normalizeForDiff(rawOld);
    const newLines = normalizeForDiff(rawNew);
    const diff = computeLineDiff(oldLines, newLines);

    // diff를 청크로 묶기 (같은 type 연속 → 하나의 청크)
    const chunks = [];
    let prevSameLines = [];
    let i = 0;
    while (i < diff.length) {
        const type = diff[i].type;
        const lines = [];
        while (i < diff.length && diff[i].type === type) {
            lines.push(diff[i].text);
            i++;
        }
        if (type === 'deleted') {
            chunks.push({ type, lines, anchorLines: [...prevSameLines] });
        } else {
            chunks.push({ type, lines });
            if (type === 'same') {
                prevSameLines = [...prevSameLines, ...lines].slice(-5);
            }
        }
    }

    // 청크 → HTML 생성
    let leftHTML = '', rightHTML = '';
    chunks.forEach((chunk, idx) => {
        const linesHTML = chunk.lines.map(l => `<div class="diff-line">${escapeHtml(l)}</div>`).join('');
        if (chunk.type === 'same') {
            leftHTML += linesHTML;
            rightHTML += linesHTML;
        } else if (chunk.type === 'deleted') {
            leftHTML += `<div class="diff-chunk-deleted" data-chunk-idx="${idx}">
                <div class="diff-restore-bar">
                    <button class="diff-restore-btn" data-chunk-idx="${idx}">↩ 이 부분 복원</button>
                </div>
                ${chunk.lines.map(l => `<div class="diff-line diff-deleted">${escapeHtml(l)}</div>`).join('')}
            </div>`;
        } else {
            rightHTML += `<div class="diff-chunk-added">
                ${chunk.lines.map(l => `<div class="diff-line diff-added">${escapeHtml(l)}</div>`).join('')}
            </div>`;
        }
    });

    const compareModal = document.createElement('div');
    compareModal.className = 'checkpoint-modal';
    compareModal.innerHTML = `
        <div class="checkpoint-modal-content checkpoint-compare-modal">
            <div class="checkpoint-modal-header">
                <h3>본문 비교 — ${escapeHtml(checkpoint.message)}</h3>
                <span class="checkpoint-time" style="font-size:12px; font-weight:400;">${new Date(checkpoint.timestamp).toLocaleString('ko-KR')}</span>
                <button class="checkpoint-modal-close">×</button>
            </div>
            <div class="checkpoint-modal-body">
                <div class="diff-panel-wrap">
                    <div class="diff-panel diff-panel-old">
                        <div class="diff-panel-header">이전 버전 (체크포인트) — 빨간 줄: 현재 없어진 내용</div>
                        <div class="diff-panel-body">${leftHTML || '<em class="diff-empty">내용 없음</em>'}</div>
                    </div>
                    <div class="diff-panel diff-panel-new">
                        <div class="diff-panel-header">현재 버전 — 초록 줄: 새로 추가된 내용</div>
                        <div class="diff-panel-body">${rightHTML || '<em class="diff-empty">내용 없음</em>'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(compareModal);
    compareModal.querySelector('.checkpoint-modal-close').addEventListener('click', () => compareModal.remove());
    compareModal.addEventListener('click', (e) => { if (e.target === compareModal) compareModal.remove(); });

    // 복원 버튼 이벤트
    compareModal.querySelectorAll('.diff-restore-btn').forEach(btn => {
        const chunkIdx = parseInt(btn.dataset.chunkIdx);
        const chunk = chunks[chunkIdx];
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const preview = chunk.lines.join(' ').substring(0, 80);
            if (confirm(`이 부분을 현재 본문에 복원할까요?\n\n"${preview}${chunk.lines.join('').length > 80 ? '...' : ''}"`)) {
                restoreDeletedChunk(episode, chunk.lines, chunk.anchorLines, targetIndex, compareModal, checkpointId);
            }
        });
    });
}

/**
 * 삭제된 청크를 현재 본문에 복원
 */
function restoreDeletedChunk(episode, deletedLines, anchorLines, targetIndex, modal, checkpointId) {
    const vol = state.project.volumes[state.project.currentVolume];
    if (!vol) return;
    const novelEp = vol.episodes[targetIndex];
    if (!novelEp) return;

    const current = novelEp.content;
    const insertText = deletedLines.join('\n');
    let newContent;

    // 앵커(바로 앞의 same 라인)를 현재 본문에서 찾아 그 뒤에 삽입
    let insertPos = -1;
    for (let i = anchorLines.length - 1; i >= 0 && insertPos === -1; i--) {
        const anchor = anchorLines[i].trim();
        if (!anchor) continue;
        const pos = current.lastIndexOf(anchor);
        if (pos !== -1) insertPos = pos + anchor.length;
    }

    if (insertPos === -1) {
        newContent = insertText + '\n\n' + current;
    } else {
        newContent = current.slice(0, insertPos) + '\n' + insertText + current.slice(insertPos);
    }

    novelEp.content = newContent;
    novelEp.charCount = newContent.replace(/\s/g, '').length;

    // 에디터가 이 회차를 보여주고 있으면 텍스트 갱신
    const editorEl = document.getElementById('episodeContent');
    if (editorEl && state.currentEpisodeIndex === targetIndex) {
        editorEl.value = newContent;
        editorEl.dispatchEvent(new Event('input'));
    }
    const activeCharsEl = document.querySelector('.episode-item.active .episode-chars');
    if (activeCharsEl && state.currentEpisodeIndex === targetIndex) {
        activeCharsEl.textContent = `${newContent.length.toLocaleString()} / ${novelEp.charCount.toLocaleString()}자`;
    }

    autoSaveLocal();
    modal.remove();
    compareCheckpoint(episode, checkpointId); // 비교창 다시 열기
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 체크포인트 복원
 */
function restoreCheckpoint(episode, checkpointId, historyModal) {
    const checkpoint = episode.checkpoints.find(cp => cp.id === checkpointId);
    if (!checkpoint) return;

    if (!confirm('이 버전으로 복원하시겠습니까? 현재 내용은 덮어씌워집니다.')) {
        return;
    }

    // 트리트먼트 메타데이터 복원
    episode.title = checkpoint.data.title;
    episode.tags = [...checkpoint.data.tags];
    episode.memo = checkpoint.data.memo;
    episode.summary = checkpoint.data.summary;
    episode.setting = checkpoint.data.setting;
    episode.events = checkpoint.data.events;
    episode.characterChange = checkpoint.data.characterChange;
    episode.direction = checkpoint.data.direction;

    // 소설 본문 복원
    const restoredContent = checkpoint.data.episodeContent;
    if (restoredContent !== undefined) {
        const vol = state.project.volumes[state.project.currentVolume];
        const matchedIndex = findNovelEpisodeIndex(episode.title, vol);
        const targetIndex = matchedIndex !== -1 ? matchedIndex : state.currentEpisodeIndex;
        const novelEp = vol ? vol.episodes[targetIndex] : null;
        if (novelEp) {
            novelEp.content = restoredContent;
            novelEp.charCount = restoredContent.replace(/\s/g, '').length;

            // 에디터가 이 회차를 보여주고 있으면 텍스트 갱신
            const editorEl = document.getElementById('episodeContent');
            if (editorEl && state.currentEpisodeIndex === targetIndex) {
                editorEl.value = restoredContent;
            }
            const activeCharsEl = document.querySelector('.episode-item.active .episode-chars');
            if (activeCharsEl && state.currentEpisodeIndex === targetIndex) {
                activeCharsEl.textContent = `${restoredContent.length.toLocaleString()} / ${novelEp.charCount.toLocaleString()}자`;
            }
        }
    }

    renderTreatmentTree();
    autoSaveLocal();
    historyModal.remove();
    alert('체크포인트가 복원되었습니다!');
}

/**
 * 체크포인트 삭제
 */
function deleteCheckpoint(episode, checkpointId, historyModal) {
    if (!confirm('이 체크포인트를 삭제하시겠습니까?')) {
        return;
    }

    episode.checkpoints = episode.checkpoints.filter(cp => cp.id !== checkpointId);
    autoSaveLocal();
    historyModal.remove();
    alert('체크포인트가 삭제되었습니다.');
}

/**
 * 간단한 버전 비교 (LocalStorage 기반)
 */
function showVersionCompare(episode) {
    const savedData = localStorage.getItem('novelWriter_project');
    if (!savedData) {
        alert('저장된 이전 버전이 없습니다.');
        return;
    }

    try {
        const savedProject = JSON.parse(savedData);
        let savedEpisode = null;

        // 저장된 프로젝트에서 같은 ID의 에피소드 찾기
        if (savedProject.treatment && savedProject.treatment.parts) {
            outerLoop:
            for (const part of savedProject.treatment.parts) {
                for (const section of (part.sections || [])) {
                    for (const ep of (section.episodes || [])) {
                        if (ep.id === episode.id) {
                            savedEpisode = ep;
                            break outerLoop;
                        }
                    }
                }
            }
        }

        if (!savedEpisode) {
            alert('이전 저장 버전에서 이 회차를 찾을 수 없습니다.\n(새로 추가된 회차일 수 있습니다)');
            return;
        }

        // 비교 모달 생성
        const compareModal = document.createElement('div');
        compareModal.className = 'version-compare-modal';
        compareModal.innerHTML = `
            <div class="version-compare-content">
                <div class="version-compare-header">
                    <h3>📋 버전 비교 - ${episode.title}</h3>
                    <button class="version-compare-close">×</button>
                </div>
                <div class="version-compare-body">
                    <div class="version-compare-info">마지막 저장된 버전과 현재 작성 중인 내용을 비교합니다.</div>
                    ${generateSimpleComparisonHTML('메모', savedEpisode.memo, episode.memo)}
                    ${generateSimpleComparisonHTML('전개 요약', savedEpisode.summary, episode.summary)}
                    ${generateSimpleComparisonHTML('배경', savedEpisode.setting, episode.setting)}
                    ${generateSimpleComparisonHTML('사건', savedEpisode.events, episode.events)}
                    ${generateSimpleComparisonHTML('캐릭터 심리 변화', savedEpisode.characterChange, episode.characterChange)}
                    ${generateSimpleComparisonHTML('연출 가이드', savedEpisode.direction, episode.direction)}
                </div>
            </div>
        `;

        document.body.appendChild(compareModal);

        compareModal.querySelector('.version-compare-close').addEventListener('click', () => {
            compareModal.remove();
        });

        compareModal.addEventListener('click', (e) => {
            if (e.target === compareModal) {
                compareModal.remove();
            }
        });

    } catch (error) {
        console.error('Version compare error:', error);
        alert('버전 비교 중 오류가 발생했습니다.');
    }
}

/**
 * 간단한 비교 HTML 생성
 */
function generateSimpleComparisonHTML(label, oldValue, newValue) {
    oldValue = oldValue || '';
    newValue = newValue || '';

    if (oldValue === newValue) {
        if (!newValue) return ''; // 둘 다 비어있으면 표시 안 함
        return `
            <div class="version-compare-section">
                <h4>${label}</h4>
                <div class="version-compare-unchanged">변경사항 없음</div>
            </div>
        `;
    }

    return `
        <div class="version-compare-section">
            <h4>${label}</h4>
            <div class="version-compare-columns">
                <div class="version-compare-column">
                    <div class="version-compare-label">이전 저장 버전</div>
                    <pre class="version-compare-text version-old">${escapeHtml(oldValue) || '<em class="empty">비어있음</em>'}</pre>
                </div>
                <div class="version-compare-column">
                    <div class="version-compare-label">현재 작성 중</div>
                    <pre class="version-compare-text version-new">${escapeHtml(newValue) || '<em class="empty">비어있음</em>'}</pre>
                </div>
            </div>
        </div>
    `;
}

export function getTreatmentText() {
    ensureTreatment();
    let text = '';
    (state.project.treatment.parts || []).forEach(part => {
        text += '[' + part.title + ']\n';
        (part.sections || []).forEach(section => {
            text += '  ' + section.title + ':\n';
            (section.episodes || []).forEach(episode => {
                text += '    - ' + episode.title + '\n';
            });
        });
    });
    return text.trim() || '(없음)';
}
