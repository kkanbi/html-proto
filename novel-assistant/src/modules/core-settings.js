// core-settings.js - 코어 설정 모듈
import { state } from '../core/state.js';
import { autoSaveLocal } from '../core/storage.js';

/**
 * 코어 안전장치
 */
function ensureCore() {
    state.project.core = state.project.core || {};
    state.project.core.logline = state.project.core.logline || '';
    state.project.core.overview = state.project.core.overview || {
        genre: '',
        keywords: '',
        background: '',
        tone: ''
    };
    state.project.core.theme = state.project.core.theme || '';
    state.project.core.fullPlot = state.project.core.fullPlot || '';
    state.project.core.volumePlots = state.project.core.volumePlots || {};
}

/**
 * 코어 모듈 초기화
 */
export function initCoreSettings() {
    ensureCore();

    // 이벤트 리스너
    document.getElementById('coreLogline')?.addEventListener('input', (e) => {
        state.project.core.logline = e.target.value;
    });

    document.getElementById('coreGenre')?.addEventListener('input', (e) => {
        state.project.core.overview.genre = e.target.value;
    });

    document.getElementById('coreKeywords')?.addEventListener('input', (e) => {
        state.project.core.overview.keywords = e.target.value;
    });

    document.getElementById('coreBackground')?.addEventListener('input', (e) => {
        state.project.core.overview.background = e.target.value;
    });

    document.getElementById('coreTone')?.addEventListener('input', (e) => {
        state.project.core.overview.tone = e.target.value;
    });

    document.getElementById('coreTheme')?.addEventListener('input', (e) => {
        state.project.core.theme = e.target.value;
    });

    document.getElementById('coreFullPlot')?.addEventListener('input', (e) => {
        state.project.core.fullPlot = e.target.value;
    });

    // 권별 줄거리
    const volumePlotAccordion = document.getElementById('volumePlotAccordion');

    volumePlotAccordion?.addEventListener('click', (e) => {
        const header = e.target.closest('.accordion-header');
        if (header && !e.target.closest('.accordion-delete')) {
            toggleAccordion(header);
        }

        if (e.target.closest('.accordion-delete')) {
            const item = e.target.closest('.accordion-item');
            const volNum = item.dataset.volumeId;
            if (volNum) {
                if (confirm(`${volNum}권 줄거리를 삭제할까요?`)) {
                    delete state.project.core.volumePlots[volNum];
                    item.remove();
                    autoSaveLocal();
                }
            }
        }
    });

    volumePlotAccordion?.addEventListener('input', (e) => {
        if (e.target.classList.contains('volume-plot-textarea')) {
            const item = e.target.closest('.accordion-item');
            const volNum = item.dataset.volumeId;
            const field = e.target.dataset.field;

            if (volNum && field) {
                if (typeof state.project.core.volumePlots[volNum] !== 'object') {
                    state.project.core.volumePlots[volNum] = {
                        summary: '',
                        relationships: '',
                        keyEvents: '',
                        emotionalArc: '',
                        sexualTension: ''
                    };
                }
                state.project.core.volumePlots[volNum][field] = e.target.value;
            }
        }
    });

    document.getElementById('addVolumePlot')?.addEventListener('click', () => {
        const existingVolumes = Object.keys(state.project.core.volumePlots).map(Number);
        let nextVol = 1;
        while (existingVolumes.includes(nextVol)) {
            nextVol++;
        }

        state.project.core.volumePlots[nextVol] = {
            summary: '',
            relationships: '',
            keyEvents: '',
            emotionalArc: '',
            sexualTension: ''
        };
        addVolumePlotUI(nextVol, state.project.core.volumePlots[nextVol], true);
        autoSaveLocal();
    });
}

/**
 * 아코디언 토글
 */
function toggleAccordion(header) {
    const item = header.closest('.accordion-item');
    item.classList.toggle('open');
}

/**
 * 권별 줄거리 UI 추가
 */
function addVolumePlotUI(volNum, plotData = {}, openByDefault = false) {
    if (typeof plotData === 'string') {
        plotData = {
            summary: plotData,
            relationships: '',
            keyEvents: '',
            emotionalArc: '',
            sexualTension: ''
        };
    }

    const volumePlotAccordion = document.getElementById('volumePlotAccordion');
    const item = document.createElement('div');
    item.className = 'accordion-item' + (openByDefault ? ' open' : '');
    item.dataset.volumeId = volNum;
    item.innerHTML = `
        <div class="accordion-header">
            <span class="accordion-icon">▶</span>
            <span class="accordion-title">${volNum}권 줄거리</span>
            <button class="accordion-delete">삭제</button>
        </div>
        <div class="accordion-content">
            <div class="volume-plot-section">
                <label class="volume-plot-label">줄거리</label>
                <textarea class="volume-plot-textarea" data-field="summary" placeholder="${volNum}권의 줄거리를 작성하세요...">${plotData.summary || ''}</textarea>
            </div>
            <div class="volume-plot-section">
                <label class="volume-plot-label">관계</label>
                <textarea class="volume-plot-textarea" data-field="relationships" placeholder="캐릭터 간 관계 변화를 작성하세요...">${plotData.relationships || ''}</textarea>
            </div>
            <div class="volume-plot-section">
                <label class="volume-plot-label">핵심 사건 (기승전결)</label>
                <textarea class="volume-plot-textarea" data-field="keyEvents" placeholder="기승전결 구조로 핵심 사건을 작성하세요...">${plotData.keyEvents || ''}</textarea>
            </div>
            <div class="volume-plot-section">
                <label class="volume-plot-label">감정선</label>
                <textarea class="volume-plot-textarea" data-field="emotionalArc" placeholder="캐릭터의 감정 변화를 작성하세요...">${plotData.emotionalArc || ''}</textarea>
            </div>
            <div class="volume-plot-section">
                <label class="volume-plot-label">섹슈얼 텐션</label>
                <textarea class="volume-plot-textarea" data-field="sexualTension" placeholder="로맨스/긴장감 요소를 작성하세요...">${plotData.sexualTension || ''}</textarea>
            </div>
        </div>
    `;
    volumePlotAccordion.appendChild(item);
}

/**
 * 권별 줄거리 렌더링
 */
export function renderVolumePlotAccordion() {
    const volumePlotAccordion = document.getElementById('volumePlotAccordion');
    volumePlotAccordion.innerHTML = '';

    const volumes = Object.keys(state.project.core.volumePlots || {}).map(Number).sort((a, b) => a - b);
    volumes.forEach(vol => {
        addVolumePlotUI(vol, state.project.core.volumePlots[vol]);
    });
}

/**
 * 코어 데이터 로드
 */
export function loadCoreData() {
    ensureCore();

    document.getElementById('coreLogline').value = state.project.core.logline || '';
    document.getElementById('coreGenre').value = state.project.core.overview.genre || '';
    document.getElementById('coreKeywords').value = state.project.core.overview.keywords || '';
    document.getElementById('coreBackground').value = state.project.core.overview.background || '';
    document.getElementById('coreTone').value = state.project.core.overview.tone || '';
    document.getElementById('coreTheme').value = state.project.core.theme || '';
    document.getElementById('coreFullPlot').value = state.project.core.fullPlot || '';
    renderVolumePlotAccordion();
}

/**
 * 코어 텍스트 변환 (AI 검토용)
 */
export function getCoreText() {
    ensureCore();

    let text = '';
    if (state.project.core.logline) text += `[로그라인]\n${state.project.core.logline}\n\n`;
    if (state.project.core.overview.genre) text += `장르: ${state.project.core.overview.genre}\n`;
    if (state.project.core.overview.keywords) text += `키워드: ${state.project.core.overview.keywords}\n`;
    if (state.project.core.overview.background) text += `\n[배경]\n${state.project.core.overview.background}\n\n`;
    if (state.project.core.overview.tone) text += `[톤앤매너]\n${state.project.core.overview.tone}\n\n`;
    if (state.project.core.theme) text += `[주제/기획의도]\n${state.project.core.theme}\n\n`;
    if (state.project.core.fullPlot) text += `[전권 줄거리]\n${state.project.core.fullPlot}\n\n`;

    Object.keys(state.project.core.volumePlots || {}).forEach(vol => {
        if (state.project.core.volumePlots[vol]) {
            text += `[${vol}권]\n${state.project.core.volumePlots[vol]}\n\n`;
        }
    });

    return text.trim() || '(없음)';
}
