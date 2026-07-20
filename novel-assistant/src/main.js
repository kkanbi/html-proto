// main.js - 메인 초기화 파일
import { state } from './core/state.js';
import { loadAutoSave } from './core/storage.js';
import { initAllTabs } from './ui/tabs.js';
import { initEditor, loadCurrentEpisode } from './modules/editor.js';
import { initEpisodes, updateEpisodesList, updateVolumeSelector, createNewVolume } from './modules/episodes.js';
import { initCharacters, renderCharacterGrid } from './modules/characters.js';
import { initGoogleDrive } from './modules/google-drive.js';
import { initLocalStorage } from './modules/local-storage.js';
import { initTheme } from './modules/theme.js';
import { initCoreSettings, loadCoreData } from './modules/core-settings.js';
import { initWorld, renderWorldTags, renderWorldAccordion } from './modules/world.js';
import { initTreatment, renderTreatmentTree } from './modules/treatment.js';
import { initReview } from './modules/review.js';
import { initFocusMode } from './modules/focus-mode.js';
import { initShortcuts } from './modules/shortcuts.js';
import { initSentenceHighlight } from './modules/sentence-highlight.js';
import { initPomodoro } from './modules/pomodoro.js';
import { initDashboard, updateDashboard } from './modules/dashboard.js';
import { initCharacterTooltip } from './modules/character-tooltip.js';

// ============ DOM 요소 ============
const els = {
    googleStatusIcon: document.getElementById('googleStatusIcon'),
    googleStatusText: document.getElementById('googleStatusText'),
    googleEmail: document.getElementById('googleEmail'),
    btnGoogleAuth: document.getElementById('btnGoogleAuth'),
    projectTitle: document.getElementById('projectTitle'),
    currentVolume: document.getElementById('currentVolume'),
    totalVolumes: document.getElementById('totalVolumes'),
    volumeGoal: document.getElementById('volumeGoal'),
    episodesList: document.getElementById('episodesList'),
    episodeCount: document.getElementById('episodeCount'),
    volumeProgress: document.getElementById('volumeProgress'),
    progressFill: document.getElementById('progressFill'),
    episodeNumDisplay: document.getElementById('episodeNumDisplay'),
    episodeTitle: document.getElementById('episodeTitle'),
    episodeContent: document.getElementById('episodeContent'),
    saveStatus: document.getElementById('saveStatus'),
    charWithSpaces: document.getElementById('charWithSpaces'),
    charWithoutSpaces: document.getElementById('charWithoutSpaces'),
    manuscriptPages: document.getElementById('manuscriptPages'),
    apiKey: document.getElementById('apiKey'),
    apiStatus: document.getElementById('apiStatus'),
    aiResult: document.getElementById('aiResult'),
    fileModal: document.getElementById('fileModal'),
    modalFileList: document.getElementById('modalFileList'),
    btnModalOpen: document.getElementById('btnModalOpen'),
    characterGrid: document.getElementById('characterGrid'),
    characterModal: document.getElementById('characterModal'),
    emojiPicker: document.getElementById('emojiPicker'),
    worldTags: document.getElementById('worldTags'),
    worldAccordion: document.getElementById('worldAccordion'),
    treatmentTree: document.getElementById('treatmentTree')
};

// ============ 앱 초기화 ============
function initApp() {
    console.log('🚀 Novel Writer v0.1.0 초기화 중...');

    // 탭 시스템 초기화
    initAllTabs();

    // 각 모듈 초기화
    initEditor(els);
    initEpisodes(els);
    initCharacters(els);
    initGoogleDrive(els);
    initLocalStorage(els);
    initTheme();
    initCoreSettings();
    initWorld(els);
    initTreatment(els);
    initReview(els);
    initFocusMode();
    initShortcuts();
    initSentenceHighlight();
    initPomodoro();
    initDashboard(els);
    initCharacterTooltip();

    // 버튼 이벤트
    document.getElementById('btnNewVolume').addEventListener('click', createNewVolume);
    document.getElementById('btnDownload').addEventListener('click', downloadLocal);
    document.getElementById('btnExportText').addEventListener('click', showExportModal);

    // 텍스트 내보내기 모달 이벤트
    document.getElementById('btnExportCancel').addEventListener('click', closeExportModal);
    document.getElementById('exportModal').addEventListener('click', (e) => {
        if (e.target.id === 'exportModal') closeExportModal();
    });
    document.getElementById('btnExportConfirm').addEventListener('click', exportAsText);
    document.querySelectorAll('input[name="exportScope"]').forEach(radio => {
        radio.addEventListener('change', updateExportEpisodeList);
    });

    // 자동 저장 로드
    loadAutoSave({
        onAfterLoad: () => {
            loadProjectSettings();
            loadCurrentEpisode();
            updateEpisodesList();
            renderCharacterGrid();
            loadCoreData();
            renderWorldTags();
            renderWorldAccordion();
            renderTreatmentTree();
            updateDashboard();
        }
    });

    console.log('✅ 초기화 완료');
}

/**
 * 프로젝트 설정 로드
 */
function loadProjectSettings() {
    els.projectTitle.value = state.project.title || '';
    els.totalVolumes.value = state.project.totalVolumes || 1;
    els.volumeGoal.value = state.project.volumeGoal || 100000;

    updateVolumeSelector();
}

/**
 * 로컬 다운로드 (JSON)
 */
function downloadLocal() {
    const data = {
        ...state.project,
        savedAt: new Date().toISOString()
    };

    const vol = state.project.volumes[state.project.currentVolume];
    const writtenCount = vol ? vol.episodes.filter(ep => ep.content.trim().length > 0).length : 0;
    const today = new Date().toISOString().split('T')[0];
    const filename = `${state.project.title || '소설'}_${today}_${writtenCount}화.json`;

    triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
}

/**
 * 다운로드 트리거 헬퍼
 */
function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 텍스트 내보내기 모달 열기
 */
function showExportModal() {
    document.getElementById('exportModal').classList.add('active');
    document.querySelector('input[name="exportScope"][value="volume"]').checked = true;
    updateExportEpisodeList();
}

/**
 * 텍스트 내보내기 모달 닫기
 */
function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

/**
 * 회차 선택 목록 업데이트
 */
function updateExportEpisodeList() {
    const scope = document.querySelector('input[name="exportScope"]:checked').value;
    const listEl = document.getElementById('exportEpisodeList');

    if (scope !== 'select') {
        listEl.style.display = 'none';
        return;
    }

    const vol = state.project.volumes[state.project.currentVolume];
    if (!vol) return;

    listEl.style.display = 'block';
    listEl.innerHTML = vol.episodes.map((ep, idx) => `
        <label style="display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer; font-size:13px;">
            <input type="checkbox" class="export-ep-checkbox" data-idx="${idx}" checked>
            ${ep.number}화${ep.title ? ' — ' + ep.title : ''}
            <span style="margin-left:auto; color:var(--text-muted); font-size:11px;">${ep.content.replace(/\s/g, '').length.toLocaleString()}자</span>
        </label>
    `).join('');
}

/**
 * 텍스트 내보내기 실행
 */
function exportAsText() {
    const scope = document.querySelector('input[name="exportScope"]:checked').value;
    const vol = state.project.volumes[state.project.currentVolume];
    if (!vol) return;

    const volNum = state.project.currentVolume;
    const title = state.project.title || '소설';

    if (scope === 'volume') {
        // 1권 전체 → 하나의 파일
        const content = vol.episodes
            .filter(ep => ep.content.trim().length > 0)
            .map(ep => `■ ${ep.number}화${ep.title ? ' — ' + ep.title : ''}\n\n${ep.content}`)
            .join('\n\n' + '─'.repeat(40) + '\n\n');
        triggerDownload(content, `${title}_${volNum}권_전체.txt`, 'text/plain;charset=utf-8');

    } else if (scope === 'episodes') {
        // 회차별 개별 파일
        const eps = vol.episodes.filter(ep => ep.content.trim().length > 0);
        eps.forEach((ep, i) => {
            setTimeout(() => {
                const content = `■ ${ep.number}화${ep.title ? ' — ' + ep.title : ''}\n\n${ep.content}`;
                triggerDownload(content, `${title}_${volNum}권_${ep.number}화.txt`, 'text/plain;charset=utf-8');
            }, i * 200);
        });

    } else if (scope === 'select') {
        // 선택한 회차만
        const checked = [...document.querySelectorAll('.export-ep-checkbox:checked')].map(cb => parseInt(cb.dataset.idx));
        if (checked.length === 0) { alert('내보낼 회차를 선택해주세요.'); return; }

        if (checked.length === 1) {
            // 1개 선택 시 단일 파일
            const ep = vol.episodes[checked[0]];
            const content = `■ ${ep.number}화${ep.title ? ' — ' + ep.title : ''}\n\n${ep.content}`;
            triggerDownload(content, `${title}_${volNum}권_${ep.number}화.txt`, 'text/plain;charset=utf-8');
        } else {
            // 여러 개 → 개별 파일로 순차 다운로드
            checked.forEach((idx, i) => {
                const ep = vol.episodes[idx];
                setTimeout(() => {
                    const content = `■ ${ep.number}화${ep.title ? ' — ' + ep.title : ''}\n\n${ep.content}`;
                    triggerDownload(content, `${title}_${volNum}권_${ep.number}화.txt`, 'text/plain;charset=utf-8');
                }, i * 200);
            });
        }
    }

    closeExportModal();
}

// 앱 시작
document.addEventListener('DOMContentLoaded', initApp);
