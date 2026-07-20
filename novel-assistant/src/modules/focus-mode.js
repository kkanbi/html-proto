// focus-mode.js - 집중 모드
import { showPomodoro, hidePomodoro } from './pomodoro.js';

let isFocusMode = false;

export function initFocusMode() {
    // F11 또는 버튼으로 토글
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFocusMode();
        }
    });

    // 집중 모드 버튼 추가
    const btnFocus = document.getElementById('btnFocusMode');
    if (btnFocus) {
        btnFocus.addEventListener('click', toggleFocusMode);
    }
}

export function toggleFocusMode() {
    isFocusMode = !isFocusMode;

    const container = document.querySelector('.container');
    const episodesSection = document.querySelector('.episodes-section');
    const rightSection = document.querySelector('.right-section');
    const editorSection = document.querySelector('.editor-section');

    if (isFocusMode) {
        // 집중 모드 ON
        container.classList.add('focus-mode');
        episodesSection.style.display = 'none';
        rightSection.style.display = 'none';
        editorSection.style.maxWidth = '900px';
        editorSection.style.margin = '0 auto';

        // 알림 표시
        showNotification('집중 모드 활성화 (F11로 해제)');

        // 포모도로 타이머 표시
        showPomodoro();
    } else {
        // 집중 모드 OFF
        container.classList.remove('focus-mode');
        episodesSection.style.display = '';
        rightSection.style.display = '';
        editorSection.style.maxWidth = '';
        editorSection.style.margin = '';

        showNotification('집중 모드 해제');

        // 포모도로 타이머 숨김
        hidePomodoro();
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'focus-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

export function isFocusModeActive() {
    return isFocusMode;
}
