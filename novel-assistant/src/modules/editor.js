// editor.js - 에디터 관련 로직
import { state } from '../core/state.js';
import { autoSaveLocal } from '../core/storage.js';
import { calculateStats } from '../utils/helpers.js';
import { renderReviewResult } from './review.js';

let els = {};

/**
 * 에디터 모듈 초기화
 * @param {Object} elements - DOM 요소 객체
 */
export function initEditor(elements) {
    els = elements;

    // 이벤트 리스너 등록
    els.episodeContent.addEventListener('input', handleContentChange);
    els.episodeTitle.addEventListener('input', handleTitleChange);
}

/**
 * 본문 변경 이벤트 핸들러
 */
function handleContentChange() {
    updateStats();
    const ep = getCurrentEpisode();
    if (ep) {
        ep.content = els.episodeContent.value;
        ep.charCount = els.episodeContent.value.replace(/\s/g, '').length;
        ep.lastModified = new Date().toISOString();
        // 회차 목록의 글자수 실시간 업데이트
        const activeChars = document.querySelector('.episode-item.active .episode-chars');
        if (activeChars) {
            activeChars.textContent = `${ep.content.length.toLocaleString()} / ${ep.charCount.toLocaleString()}자`;
        }
    }
}

/**
 * 제목 변경 이벤트 핸들러
 */
function handleTitleChange() {
    const ep = getCurrentEpisode();
    if (ep) {
        ep.title = els.episodeTitle.value;
    }
}

/**
 * 통계 업데이트
 */
export function updateStats() {
    const text = els.episodeContent.value;
    const { withSpaces, withoutSpaces, pages } = calculateStats(text);

    els.charWithSpaces.textContent = withSpaces.toLocaleString();
    els.charWithoutSpaces.textContent = withoutSpaces.toLocaleString();
    els.manuscriptPages.textContent = pages;

    const ep = getCurrentEpisode();
    if (ep) {
        ep.charCount = withoutSpaces;
    }
}

/**
 * 현재 에피소드 로드
 */
export function loadCurrentEpisode() {
    const ep = getCurrentEpisode();
    if (!ep) return;

    els.episodeNumDisplay.textContent = `${ep.number}화`;
    els.episodeTitle.value = ep.title;
    els.episodeContent.value = ep.content;
    updateStats();

    // 검토 결과 로드
    renderReviewResult(els.aiResult, ep.reviewResult || '');
}

/**
 * 현재 에피소드 저장
 */
export function saveCurrentEpisode() {
    const ep = getCurrentEpisode();
    if (!ep) return;

    ep.title = els.episodeTitle.value;
    ep.content = els.episodeContent.value;
    ep.charCount = els.episodeContent.value.replace(/\s/g, '').length;
}

/**
 * 현재 볼륨 가져오기
 */
function getCurrentVolume() {
    return state.project.volumes[state.project.currentVolume];
}

/**
 * 현재 에피소드 가져오기
 */
function getCurrentEpisode() {
    const vol = getCurrentVolume();
    return vol ? vol.episodes[state.currentEpisodeIndex] : null;
}

/**
 * 본문에서 텍스트 교체 후 중앙 스크롤
 */
export function replaceEditorText(original, replacement) {
    const content = els.episodeContent.value;
    const index = content.indexOf(original);
    if (index === -1) return false;

    els.episodeContent.value =
        content.substring(0, index) + replacement + content.substring(index + original.length);

    handleContentChange();
    autoSaveLocal();
    // input 이벤트를 발생시켜 하이라이트 오버레이도 갱신
    els.episodeContent.dispatchEvent(new Event('input'));
    scrollToText(replacement);
    return true;
}


export function scrollToText(searchText) {
    const content = els.episodeContent.value;
    const index = content.indexOf(searchText);

    if (index === -1) return false;

    // 텍스트 선택
    els.episodeContent.focus();
    els.episodeContent.setSelectionRange(index, index + searchText.length);

    // 더미 요소를 사용해 정확한 픽셀 위치 계산
    const textBeforeCursor = content.substring(0, index);

    const dummy = document.createElement('div');
    dummy.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: pre-wrap;
        word-wrap: break-word;
        width: ${els.episodeContent.clientWidth}px;
        font-family: 'Nanum Myeongjo', serif;
        font-size: 17px;
        line-height: 1.9;
        padding: 24px;
    `;
    dummy.textContent = textBeforeCursor;
    document.body.appendChild(dummy);

    const cursorTopPosition = dummy.offsetHeight;
    document.body.removeChild(dummy);

    // 가운데 정렬을 위한 스크롤 위치 계산
    const textareaHeight = els.episodeContent.clientHeight;
    const scrollPosition = Math.max(0, cursorTopPosition - (textareaHeight / 2));

    els.episodeContent.scrollTop = scrollPosition;
    return true;
}
