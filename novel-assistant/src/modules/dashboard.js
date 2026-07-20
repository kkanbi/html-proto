// dashboard.js - 대시보드 통계 및 시각화
import { state } from '../core/state.js';

let els = {};

export function initDashboard(elements) {
    els = elements;

    // 대시보드 요소가 없으면 초기화하지 않음
    if (!document.getElementById('todayWords')) return;

    // 초기 렌더링
    updateDashboard();
}

/**
 * 대시보드 전체 업데이트
 */
export function updateDashboard() {
    updateStats();
    updateWeeklyHeatmap();
    updateEpisodeProgress();
    updateWordCloud();
}

/**
 * 작성 통계 업데이트 (오늘/이번주/이번달)
 */
function updateStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 이번 주의 시작일 (월요일)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // 이번 달 시작일
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;

    // 모든 권의 모든 회차 순회
    Object.keys(state.project.volumes).forEach(volumeKey => {
        const volume = state.project.volumes[volumeKey];
        volume.episodes.forEach(episode => {
            const wordCount = (episode.content || '').replace(/\s/g, '').length;

            if (episode.lastModified) {
                const episodeDateStr = episode.lastModified.split('T')[0];

                if (episodeDateStr === todayStr) {
                    todayCount += wordCount;
                }
                if (episodeDateStr >= weekStartStr) {
                    weekCount += wordCount;
                }
                if (episodeDateStr >= monthStartStr) {
                    monthCount += wordCount;
                }
            }
        });
    });

    // UI 업데이트
    const todayEl = document.getElementById('todayWords');
    const weekEl = document.getElementById('weekWords');
    const monthEl = document.getElementById('monthWords');

    if (todayEl) todayEl.textContent = todayCount.toLocaleString();
    if (weekEl) weekEl.textContent = weekCount.toLocaleString();
    if (monthEl) monthEl.textContent = monthCount.toLocaleString();
}

/**
 * 주간 히트맵 업데이트
 */
function updateWeeklyHeatmap() {
    const heatmapContainer = document.getElementById('weeklyHeatmap');
    if (!heatmapContainer) return;

    const today = new Date();
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

    // 이번 주의 월요일부터 일요일까지
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    let html = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = dateStr === today.toISOString().split('T')[0];

        // 해당 날짜에 작성한 글자 수 계산
        let dayCount = 0;
        Object.keys(state.project.volumes).forEach(volumeKey => {
            const volume = state.project.volumes[volumeKey];
            volume.episodes.forEach(episode => {
                if (episode.lastModified && episode.lastModified.split('T')[0] === dateStr) {
                    dayCount += (episode.content || '').replace(/\s/g, '').length;
                }
            });
        });

        const displayValue = dayCount > 0 ? (dayCount / 1000).toFixed(1) + 'k' : '-';

        html += `
            <div class="heatmap-day ${isToday ? 'active' : ''}" data-date="${dateStr}">
                <div class="heatmap-day-label">${dayNames[i]}</div>
                <div class="heatmap-day-value">${displayValue}</div>
            </div>
        `;
    }

    heatmapContainer.innerHTML = html;
}

/**
 * 회차 완성도 업데이트
 */
function updateEpisodeProgress() {
    const listContainer = document.getElementById('episodeProgressList');
    if (!listContainer) return;

    const currentVolume = state.project.volumes[state.project.currentVolume];
    if (!currentVolume || !currentVolume.episodes) {
        listContainer.innerHTML = '<div class="word-cloud-empty">회차가 없습니다</div>';
        return;
    }

    // 목표 글자수 (회차당 평균 목표)
    const volumeGoal = state.project.volumeGoal || 100000;
    const episodeGoal = Math.floor(volumeGoal / Math.max(currentVolume.episodes.length, 1));

    let html = '';

    currentVolume.episodes.forEach((episode, idx) => {
        const wordCount = (episode.content || '').replace(/\s/g, '').length;
        const percent = Math.min(Math.round((wordCount / episodeGoal) * 100), 100);
        const title = episode.title || `${idx + 1}화`;

        html += `
            <div class="episode-progress-item" data-episode-index="${idx}">
                <div class="episode-progress-header">
                    <div class="episode-progress-title">${title}</div>
                    <div class="episode-progress-percent">${percent}%</div>
                </div>
                <div class="episode-progress-bar">
                    <div class="episode-progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;

    // 클릭 이벤트 추가 (회차 이동)
    listContainer.querySelectorAll('.episode-progress-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.episodeIndex);
            state.project.currentEpisode = index;

            // 에디터 업데이트 이벤트 발생
            const event = new CustomEvent('episodeChanged', { detail: { index } });
            document.dispatchEvent(event);
        });
    });
}

/**
 * 자주 쓴 단어 클라우드 업데이트
 */
function updateWordCloud() {
    const cloudContainer = document.getElementById('wordCloud');
    if (!cloudContainer) return;

    // 현재 권의 모든 회차 내용 수집
    const currentVolume = state.project.volumes[state.project.currentVolume];
    if (!currentVolume || !currentVolume.episodes) {
        cloudContainer.innerHTML = '<div class="word-cloud-empty">내용이 없습니다</div>';
        return;
    }

    let allText = '';
    currentVolume.episodes.forEach(episode => {
        allText += (episode.content || '') + ' ';
    });

    if (!allText.trim()) {
        cloudContainer.innerHTML = '<div class="word-cloud-empty">작성된 내용이 없습니다</div>';
        return;
    }

    // 단어 빈도 계산
    const wordFreq = {};

    // 한글 단어만 추출 (2글자 이상, 조사/어미 제외)
    const words = allText.match(/[가-힣]{2,}/g) || [];

    // 불용어 (조사, 어미 등)
    const stopWords = new Set([
        '있다', '없다', '이다', '아니다', '하다', '되다', '같다', '않다', '많다',
        '그것', '이것', '저것', '무엇', '어떤', '어디', '언제', '누구',
        '그리고', '하지만', '그러나', '또한', '따라서', '그래서',
        '있는', '없는', '하는', '되는', '같은', '않은',
        '이런', '저런', '그런', '어떤'
    ]);

    words.forEach(word => {
        if (!stopWords.has(word)) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });

    // 빈도순 정렬, 상위 20개
    const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    if (sortedWords.length === 0) {
        cloudContainer.innerHTML = '<div class="word-cloud-empty">단어를 추출할 수 없습니다</div>';
        return;
    }

    // 최대 빈도
    const maxFreq = sortedWords[0][1];

    // 단어 클라우드 렌더링
    let html = '';
    sortedWords.forEach(([word, freq]) => {
        // 빈도에 따라 폰트 크기 조절 (10px ~ 18px)
        const fontSize = Math.floor(10 + (freq / maxFreq) * 8);
        html += `<span class="word-cloud-item" style="font-size: ${fontSize}px;">${word} (${freq})</span>`;
    });

    cloudContainer.innerHTML = html;
}
