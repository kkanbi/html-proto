// local-storage.js - 로컬 폴더 저장소 모듈
import { state } from '../core/state.js';
import { normalizeProject } from '../core/data.js';
import { saveCurrentEpisode, loadCurrentEpisode } from './editor.js';
import { updateEpisodesList } from './episodes.js';
import { renderCharacterGrid } from './characters.js';

let directoryHandle = null;
let selectedLocalFileHandle = null;
let els = {};

const DB_NAME = 'novelWriterFS';
const STORE_NAME = 'handles';

/**
 * 로컬 폴더 모듈 초기화
 */
export function initLocalStorage(elements) {
    els = elements;

    document.getElementById('btnSelectLocalFolder').addEventListener('click', selectLocalFolder);
    document.getElementById('btnSaveLocal').addEventListener('click', saveToLocalFolder);
    document.getElementById('btnLoadLocal').addEventListener('click', showLocalFileList);

    // 파일 모달 열기 버튼 - 로컬 모드일 때만 처리
    document.getElementById('btnModalOpen').addEventListener('click', async () => {
        const fileModal = document.getElementById('fileModal');
        if (fileModal.dataset.mode !== 'local') return;
        if (selectedLocalFileHandle) {
            await loadFromLocalHandle(selectedLocalFileHandle);
            closeFileModal();
        }
    });

    restoreDirectoryHandle();
}

function closeFileModal() {
    const fileModal = document.getElementById('fileModal');
    fileModal.classList.remove('active');
    fileModal.dataset.mode = '';
    const title = document.getElementById('fileModalTitle');
    if (title) title.textContent = '📂 Google Drive에서 열기';
    selectedLocalFileHandle = null;
    document.getElementById('btnModalOpen').disabled = true;
}

/**
 * IndexedDB 열기
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = reject;
    });
}

/**
 * 이전에 선택한 폴더 핸들 복원
 */
async function restoreDirectoryHandle() {
    try {
        const db = await openDB();
        const handle = await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get('localFolder');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });

        if (handle) {
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                directoryHandle = handle;
                updateLocalFolderUI(handle.name);
            }
        }
    } catch (e) {
        // IndexedDB 미지원 or 핸들 만료 - 무시
    }
}

/**
 * 로컬 폴더 선택
 */
async function selectLocalFolder() {
    if (!('showDirectoryPicker' in window)) {
        alert('이 브라우저는 로컬 폴더 선택을 지원하지 않습니다.\n크롬 또는 엣지를 사용해주세요.');
        return;
    }

    try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        directoryHandle = handle;

        try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(handle, 'localFolder');
        } catch (e) {
            // IndexedDB 저장 실패 - 세션 중에는 핸들 사용 가능
        }

        updateLocalFolderUI(handle.name);
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('Folder selection error:', e);
        }
    }
}

/**
 * 로컬 폴더 UI 업데이트
 */
function updateLocalFolderUI(folderName) {
    const nameEl = document.getElementById('localFolderName');
    const actionsEl = document.getElementById('localFolderActions');
    if (nameEl) nameEl.textContent = folderName;
    if (actionsEl) actionsEl.style.display = 'flex';
}

/**
 * 폴더 접근 권한 확인/요청
 */
async function ensurePermission() {
    if (!directoryHandle) return false;

    const permission = await directoryHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') return true;

    const newPermission = await directoryHandle.requestPermission({ mode: 'readwrite' });
    return newPermission === 'granted';
}

/**
 * 로컬 폴더에 저장
 */
async function saveToLocalFolder() {
    if (!directoryHandle) {
        alert('먼저 저장할 폴더를 선택해주세요.');
        return;
    }

    if (!await ensurePermission()) {
        alert('폴더 접근 권한이 필요합니다.');
        return;
    }

    saveCurrentEpisode();

    const data = {
        ...state.project,
        savedAt: new Date().toISOString()
    };

    const filename = `${state.project.title || '소설'}_${state.project.currentVolume}권.json`;
    const content = JSON.stringify(data, null, 2);

    try {
        const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        if (els.saveStatus) {
            els.saveStatus.textContent = '로컬 저장됨 ✓';
            els.saveStatus.className = 'save-status saved';
        }
    } catch (e) {
        console.error('Local save error:', e);
        alert('파일 저장에 실패했습니다.');
    }
}

/**
 * 로컬 폴더 파일 목록 표시
 */
async function showLocalFileList() {
    if (!directoryHandle) {
        alert('먼저 폴더를 선택해주세요.');
        return;
    }

    if (!await ensurePermission()) {
        alert('폴더 접근 권한이 필요합니다.');
        return;
    }

    const fileModal = document.getElementById('fileModal');
    const modalFileList = document.getElementById('modalFileList');
    const btnModalOpen = document.getElementById('btnModalOpen');
    const title = document.getElementById('fileModalTitle');

    fileModal.classList.add('active');
    fileModal.dataset.mode = 'local';
    if (title) title.textContent = '📂 로컬 폴더에서 열기';
    modalFileList.innerHTML = '<div class="modal-empty">파일을 불러오는 중...</div>';
    selectedLocalFileHandle = null;
    btnModalOpen.disabled = true;

    try {
        const jsonFiles = [];
        for await (const [name, handle] of directoryHandle.entries()) {
            if (handle.kind === 'file' && name.endsWith('.json')) {
                const file = await handle.getFile();
                jsonFiles.push({ name, handle, modified: file.lastModified });
            }
        }

        jsonFiles.sort((a, b) => b.modified - a.modified);

        if (jsonFiles.length === 0) {
            modalFileList.innerHTML = '<div class="modal-empty">저장된 파일이 없습니다.</div>';
            return;
        }

        modalFileList.innerHTML = '';
        jsonFiles.forEach(({ name, handle, modified }) => {
            const date = new Date(modified).toLocaleString('ko-KR');
            const div = document.createElement('div');
            div.className = 'modal-file-item';
            div.innerHTML = `
                <span class="modal-file-icon">📄</span>
                <div class="modal-file-info">
                    <div class="modal-file-name">${name}</div>
                    <div class="modal-file-date">${date}</div>
                </div>
            `;
            div.addEventListener('click', () => {
                modalFileList.querySelectorAll('.modal-file-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedLocalFileHandle = handle;
                btnModalOpen.disabled = false;
            });
            modalFileList.appendChild(div);
        });
    } catch (e) {
        console.error('Local file list error:', e);
        modalFileList.innerHTML = '<div class="modal-empty">파일 목록을 불러올 수 없습니다.</div>';
    }
}

/**
 * 로컬 파일 핸들에서 불러오기
 */
async function loadFromLocalHandle(fileHandle) {
    try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);

        state.project = normalizeProject(data);
        state.currentEpisodeIndex = 0;

        loadCurrentEpisode();
        updateEpisodesList();
        renderCharacterGrid();

        if (els.saveStatus) {
            els.saveStatus.textContent = '불러옴 ✓';
            els.saveStatus.className = 'save-status saved';
        }
    } catch (e) {
        console.error('Local load error:', e);
        alert('파일을 불러올 수 없습니다.');
    }
}
