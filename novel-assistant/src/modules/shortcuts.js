// shortcuts.js - 단축키 시스템
import { saveCurrentEpisode } from './editor.js';
import { autoSaveLocal } from '../core/storage.js';

export function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd 키 확인
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        // Ctrl+S: 저장
        if (modifier && e.key === 's') {
            e.preventDefault();
            saveCurrentEpisode();
            autoSaveLocal();
            showShortcutNotification('💾 저장 완료');
            return;
        }

        // Ctrl+E: 새 회차 추가
        if (modifier && e.key === 'e') {
            e.preventDefault();
            const addBtn = document.getElementById('addEpisodeBtn');
            if (addBtn) {
                addBtn.click();
                showShortcutNotification('➕ 새 회차 추가');
            }
            return;
        }

        // Ctrl+D: 다운로드
        if (modifier && e.key === 'd') {
            e.preventDefault();
            const downloadBtn = document.getElementById('btnDownload');
            if (downloadBtn) {
                downloadBtn.click();
                showShortcutNotification('📥 다운로드');
            }
            return;
        }

        // Ctrl+/: 단축키 도움말
        if (modifier && e.key === '/') {
            e.preventDefault();
            showShortcutHelp();
            return;
        }

        // ESC: 모달 닫기
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay.active, .character-modal.active');
            modals.forEach(modal => modal.classList.remove('active'));
        }
    });
}

function showShortcutNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'shortcut-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 1500);
}

function showShortcutHelp() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? '⌘' : 'Ctrl';

    const helpText = `
📋 단축키 도움말

${mod}+S    저장
${mod}+E    새 회차 추가
${mod}+D    다운로드
F11         집중 모드 토글
ESC         모달 닫기
${mod}+/    도움말 (이 창)
    `;

    alert(helpText.trim());
}
