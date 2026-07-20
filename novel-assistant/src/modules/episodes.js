// episodes.js - 회차 관리 모듈
import { state } from '../core/state.js';
import { saveCurrentEpisode, loadCurrentEpisode } from './editor.js';

let els = {};

/**
 * 회차 모듈 초기화
 * @param {Object} elements - DOM 요소 객체
 */
export function initEpisodes(elements) {
    els = elements;

    // 이벤트 리스너
    document.getElementById('addEpisodeBtn').addEventListener('click', addEpisode);
    els.currentVolume.addEventListener('change', () => {
        switchVolume(parseInt(els.currentVolume.value));
    });
    els.totalVolumes.addEventListener('change', () => {
        state.project.totalVolumes = parseInt(els.totalVolumes.value) || 1;
        updateVolumeSelector();
    });
    els.volumeGoal.addEventListener('change', () => {
        state.project.volumeGoal = parseInt(els.volumeGoal.value) || 100000;
        updateProgress();
    });
}

/**
 * 볼륨 셀렉터 업데이트
 */
export function updateVolumeSelector() {
    els.currentVolume.innerHTML = '';
    for (let i = 1; i <= state.project.totalVolumes; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}권`;
        if (i === state.project.currentVolume) opt.selected = true;
        els.currentVolume.appendChild(opt);
    }
}

/**
 * 회차 목록 업데이트
 */
export function updateEpisodesList() {
    const vol = getCurrentVolume();
    if (!vol) return;

    const doneCount = vol.episodes.filter(ep => ep.content.trim().length > 0).length;
    els.episodeCount.textContent = `${doneCount}/${vol.episodes.length}화`;

    els.episodesList.innerHTML = '';
    vol.episodes.forEach((ep, idx) => {
        const div = document.createElement('div');
        div.className = 'episode-item' + (idx === state.currentEpisodeIndex ? ' active' : '');

        const hasContent = ep.content.trim().length > 0;
        const isWriting = idx === state.currentEpisodeIndex && !hasContent;

        div.innerHTML = `
            <span class="episode-status ${hasContent ? 'done' : (isWriting ? 'writing' : '')}"></span>
            <span class="episode-number">${ep.number}화</span>
            <div class="episode-info">
                <div class="episode-title ${ep.title ? '' : 'empty'}">${ep.title || '제목 없음'}</div>
                <div class="episode-chars">${ep.content.length.toLocaleString()} / ${ep.charCount.toLocaleString()}자</div>
            </div>
            <button class="episode-delete" title="삭제">×</button>
        `;

        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('episode-delete')) {
                if (vol.episodes.length > 1 && confirm(`${ep.number}화를 삭제할까요?`)) {
                    deleteEpisode(idx);
                }
                return;
            }
            saveCurrentEpisode();
            state.currentEpisodeIndex = idx;
            loadCurrentEpisode();
            updateEpisodesList();
        });

        els.episodesList.appendChild(div);
    });

    updateProgress();
}

/**
 * 진행률 업데이트
 */
export function updateProgress() {
    const vol = getCurrentVolume();
    if (!vol) return;

    const totalChars = vol.episodes.reduce((sum, ep) => sum + (ep.content ? ep.content.length : 0), 0);
    const goal = state.project.volumeGoal;
    const percent = Math.min(100, (totalChars / goal) * 100);

    els.volumeProgress.textContent = `${totalChars.toLocaleString()} / ${goal.toLocaleString()}자`;
    els.progressFill.style.width = `${percent}%`;
}

/**
 * 새 회차 추가
 */
function addEpisode() {
    saveCurrentEpisode();
    const vol = getCurrentVolume();
    const newNum = vol.episodes.length + 1;
    vol.episodes.push({
        number: newNum,
        title: '',
        content: '',
        charCount: 0,
        reviewResult: null
    });
    state.currentEpisodeIndex = vol.episodes.length - 1;
    loadCurrentEpisode();
    updateEpisodesList();
}

/**
 * 회차 삭제
 * @param {number} idx
 */
function deleteEpisode(idx) {
    const vol = getCurrentVolume();
    vol.episodes.splice(idx, 1);
    vol.episodes.forEach((ep, i) => ep.number = i + 1);

    if (state.currentEpisodeIndex >= vol.episodes.length) {
        state.currentEpisodeIndex = vol.episodes.length - 1;
    }
    loadCurrentEpisode();
    updateEpisodesList();
}

/**
 * 권 전환
 * @param {number} volNum
 */
function switchVolume(volNum) {
    saveCurrentEpisode();
    saveProjectSettings();

    if (!state.project.volumes[volNum]) {
        state.project.volumes[volNum] = {
            episodes: [{ number: 1, title: '', content: '', charCount: 0, reviewResult: null }]
        };
    }

    state.project.currentVolume = volNum;
    state.currentEpisodeIndex = 0;
    loadCurrentEpisode();
    updateEpisodesList();
}

/**
 * 새 권 만들기
 */
export function createNewVolume() {
    saveCurrentEpisode();
    saveProjectSettings();

    state.project.totalVolumes++;
    els.totalVolumes.value = state.project.totalVolumes;

    const newVolNum = state.project.totalVolumes;
    state.project.volumes[newVolNum] = {
        episodes: [{ number: 1, title: '', content: '', charCount: 0, reviewResult: null }]
    };

    state.project.currentVolume = newVolNum;
    state.currentEpisodeIndex = 0;

    updateVolumeSelector();
    loadCurrentEpisode();
    updateEpisodesList();
}

/**
 * 프로젝트 설정 저장
 */
function saveProjectSettings() {
    state.project.title = els.projectTitle.value;
    state.project.totalVolumes = parseInt(els.totalVolumes.value) || 1;
    state.project.volumeGoal = parseInt(els.volumeGoal.value) || 100000;
}

/**
 * 현재 볼륨 가져오기
 */
function getCurrentVolume() {
    return state.project.volumes[state.project.currentVolume];
}
