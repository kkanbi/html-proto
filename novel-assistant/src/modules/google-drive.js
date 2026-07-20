// google-drive.js - Google Drive 연동 모듈
import { state } from '../core/state.js';
import { normalizeProject } from '../core/data.js';
import { GOOGLE_CONFIG } from '../utils/constants.js';
import { saveCurrentEpisode, loadCurrentEpisode } from './editor.js';
import { updateEpisodesList } from './episodes.js';
import { renderCharacterGrid } from './characters.js';

let tokenClient;
let accessToken = null;
let folderId = null;
let currentFileId = null;
let selectedModalFileId = null;
let driveFolderName = null;
let folderPickerSelectedId = null;
let folderPickerSelectedName = null;
let els = {};

/**
 * Google Drive 모듈 초기화
 * @param {Object} elements - DOM 요소 객체
 */
export function initGoogleDrive(elements) {
    els = elements;

    els.btnGoogleAuth.addEventListener('click', () => {
        if (accessToken) {
            logout();
        } else {
            login();
        }
    });

    document.getElementById('btnSaveDrive').addEventListener('click', saveToDrive);
    document.getElementById('btnLoadDrive').addEventListener('click', showFileList);

    document.getElementById('btnModalCancel').addEventListener('click', closeFileModal);
    els.btnModalOpen.addEventListener('click', () => {
        if (els.fileModal.dataset.mode === 'local') return;
        if (selectedModalFileId) {
            loadFromDrive(selectedModalFileId);
            closeFileModal();
        }
    });
    els.fileModal.addEventListener('click', (e) => {
        if (e.target === els.fileModal) closeFileModal();
    });

    // 폴더 선택 모달 이벤트
    document.getElementById('btnChangeDriveFolder').addEventListener('click', showDriveFolderPicker);
    document.getElementById('btnFolderCancel').addEventListener('click', () => {
        document.getElementById('folderPickerModal').classList.remove('active');
    });
    document.getElementById('btnFolderNew').addEventListener('click', createNewDriveFolder);
    document.getElementById('btnFolderSelect').addEventListener('click', confirmFolderSelection);
    document.getElementById('folderPickerModal').addEventListener('click', (e) => {
        // 이미 폴더가 설정된 경우에만 외부 클릭으로 닫기
        if (e.target === document.getElementById('folderPickerModal') && folderId) {
            document.getElementById('folderPickerModal').classList.remove('active');
        }
    });

    loadGoogleAPI();
}

function closeFileModal() {
    els.fileModal.classList.remove('active');
    els.fileModal.dataset.mode = '';
    const title = document.getElementById('fileModalTitle');
    if (title) title.textContent = '📂 Google Drive에서 열기';
    selectedModalFileId = null;
    els.btnModalOpen.disabled = true;
}

/**
 * Google API 로드
 */
function loadGoogleAPI() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CONFIG.CLIENT_ID,
            scope: GOOGLE_CONFIG.SCOPES,
            callback: handleAuthCallback
        });

        const savedToken = localStorage.getItem('novelWriter_gtoken');
        if (savedToken) {
            accessToken = savedToken;
            validateToken();
        }
    };
    document.head.appendChild(script);

    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
        gapi.load('client', async () => {
            await gapi.client.init({
                apiKey: GOOGLE_CONFIG.API_KEY,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });
        });
    };
    document.head.appendChild(gapiScript);
}

/**
 * 토큰 검증
 */
async function validateToken() {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
        if (response.ok) {
            const info = await response.json();
            updateGoogleUI(true, info.email);
            gapi.client.setToken({ access_token: accessToken });
            await setupFolder();
        } else {
            logout();
        }
    } catch (e) {
        logout();
    }
}

/**
 * 인증 콜백
 */
function handleAuthCallback(response) {
    if (response.error) {
        console.error('Auth error:', response.error);
        return;
    }
    accessToken = response.access_token;
    localStorage.setItem('novelWriter_gtoken', accessToken);
    gapi.client.setToken({ access_token: accessToken });

    fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + accessToken)
        .then(res => res.json())
        .then(async user => {
            updateGoogleUI(true, user.email);
            await setupFolder();
        });
}

/**
 * Google UI 업데이트
 */
function updateGoogleUI(connected, email = '') {
    if (connected) {
        els.googleStatusIcon.classList.add('connected');
        els.googleStatusText.textContent = '연결됨';
        els.googleStatusText.classList.add('connected');
        els.googleEmail.textContent = email;
        els.btnGoogleAuth.textContent = '로그아웃';
        els.btnGoogleAuth.classList.add('disconnect');
    } else {
        els.googleStatusIcon.classList.remove('connected');
        els.googleStatusText.textContent = '연결되지 않음';
        els.googleStatusText.classList.remove('connected');
        els.googleEmail.textContent = '';
        els.btnGoogleAuth.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google 로그인
        `;
        els.btnGoogleAuth.classList.remove('disconnect');

        const folderRow = document.getElementById('driveFolderRow');
        if (folderRow) folderRow.style.display = 'none';
    }
}

/**
 * 로그인
 */
function login() {
    if (GOOGLE_CONFIG.CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
        alert('⚠️ CLIENT_ID를 설정해주세요!');
        return;
    }
    tokenClient.requestAccessToken();
}

/**
 * 로그아웃
 */
function logout() {
    const tokenToRevoke = accessToken;
    accessToken = null;
    folderId = null;
    currentFileId = null;
    driveFolderName = null;
    localStorage.removeItem('novelWriter_gtoken');
    localStorage.removeItem('novelWriter_driveFolderId');
    localStorage.removeItem('novelWriter_driveFolderName');

    if (tokenToRevoke && google?.accounts?.oauth2) {
        google.accounts.oauth2.revoke(tokenToRevoke);
    }
    updateGoogleUI(false);
}

/**
 * 로그인 후 폴더 설정 (저장된 폴더 사용 또는 폴더 선택 모달 표시)
 */
async function setupFolder() {
    const savedFolderId = localStorage.getItem('novelWriter_driveFolderId');
    const savedFolderName = localStorage.getItem('novelWriter_driveFolderName');

    if (savedFolderId) {
        folderId = savedFolderId;
        driveFolderName = savedFolderName || GOOGLE_CONFIG.FOLDER_NAME;
        updateFolderDisplay(driveFolderName);
    } else {
        await showDriveFolderPicker();
    }
}

/**
 * 폴더 표시 업데이트
 */
function updateFolderDisplay(name) {
    const folderRow = document.getElementById('driveFolderRow');
    const folderNameEl = document.getElementById('driveFolderName');
    if (folderRow) folderRow.style.display = 'flex';
    if (folderNameEl) folderNameEl.textContent = name || GOOGLE_CONFIG.FOLDER_NAME;
}

/**
 * Drive 폴더 선택 모달 표시
 */
async function showDriveFolderPicker() {
    const modal = document.getElementById('folderPickerModal');
    const list = document.getElementById('folderPickerList');
    const btnSelect = document.getElementById('btnFolderSelect');

    modal.classList.add('active');
    list.innerHTML = '<div class="modal-empty">폴더를 불러오는 중...</div>';
    folderPickerSelectedId = null;
    folderPickerSelectedName = null;
    btnSelect.disabled = true;

    try {
        const response = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            orderBy: 'name',
            pageSize: 100
        });

        const folders = response.result.files || [];

        if (folders.length === 0) {
            list.innerHTML = '<div class="modal-empty">폴더가 없습니다.<br>새 폴더를 만들어주세요.</div>';
            return;
        }

        list.innerHTML = '';
        folders.forEach(folder => {
            const div = document.createElement('div');
            div.className = 'modal-file-item';
            div.innerHTML = `
                <span class="modal-file-icon">📁</span>
                <div class="modal-file-info">
                    <div class="modal-file-name">${folder.name}</div>
                </div>
            `;
            div.addEventListener('click', () => {
                list.querySelectorAll('.modal-file-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                folderPickerSelectedId = folder.id;
                folderPickerSelectedName = folder.name;
                btnSelect.disabled = false;
            });
            list.appendChild(div);
        });
    } catch (e) {
        console.error('Folder list error:', e);
        list.innerHTML = '<div class="modal-empty">폴더 목록을 불러올 수 없습니다.</div>';
    }
}

/**
 * 새 Drive 폴더 만들기
 */
async function createNewDriveFolder() {
    const name = prompt('새 폴더 이름을 입력하세요:', GOOGLE_CONFIG.FOLDER_NAME);
    if (!name) return;

    try {
        const createResponse = await gapi.client.drive.files.create({
            resource: {
                name: name,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id, name'
        });

        folderId = createResponse.result.id;
        driveFolderName = createResponse.result.name;
        localStorage.setItem('novelWriter_driveFolderId', folderId);
        localStorage.setItem('novelWriter_driveFolderName', driveFolderName);
        currentFileId = null;

        document.getElementById('folderPickerModal').classList.remove('active');
        updateFolderDisplay(driveFolderName);
    } catch (e) {
        console.error('Create folder error:', e);
        alert('폴더 생성에 실패했습니다.');
    }
}

/**
 * 폴더 선택 확인
 */
function confirmFolderSelection() {
    if (!folderPickerSelectedId) return;

    folderId = folderPickerSelectedId;
    driveFolderName = folderPickerSelectedName;
    localStorage.setItem('novelWriter_driveFolderId', folderId);
    localStorage.setItem('novelWriter_driveFolderName', driveFolderName);
    currentFileId = null;

    document.getElementById('folderPickerModal').classList.remove('active');
    updateFolderDisplay(driveFolderName);
}

/**
 * 폴더 확인/생성 (fallback용)
 */
async function ensureFolder() {
    if (folderId) return;

    try {
        const response = await gapi.client.drive.files.list({
            q: `name='${GOOGLE_CONFIG.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (response.result?.files?.length > 0) {
            folderId = response.result.files[0].id;
            driveFolderName = GOOGLE_CONFIG.FOLDER_NAME;
        } else {
            const createResponse = await gapi.client.drive.files.create({
                resource: {
                    name: GOOGLE_CONFIG.FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });
            folderId = createResponse.result.id;
            driveFolderName = GOOGLE_CONFIG.FOLDER_NAME;
        }

        localStorage.setItem('novelWriter_driveFolderId', folderId);
        localStorage.setItem('novelWriter_driveFolderName', driveFolderName);
        updateFolderDisplay(driveFolderName);
    } catch (e) {
        console.error('Folder error:', e);
    }
}

/**
 * Drive에 저장
 */
async function saveToDrive() {
    if (!accessToken) {
        alert('먼저 Google에 로그인해주세요.');
        return;
    }

    saveCurrentEpisode();

    const data = {
        ...state.project,
        savedAt: new Date().toISOString()
    };

    const filename = `${state.project.title || '소설'}_${state.project.currentVolume}권.json`;
    const content = JSON.stringify(data, null, 2);

    els.saveStatus.textContent = '저장 중...';
    els.saveStatus.className = 'save-status saving';

    try {
        await ensureFolder();

        if (!currentFileId) {
            const searchResponse = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and name='${filename}' and mimeType='application/json' and trashed=false`,
                fields: 'files(id)',
                orderBy: 'modifiedTime desc'
            });

            if (searchResponse.result.files.length > 0) {
                currentFileId = searchResponse.result.files[0].id;
            }
        }

        const boundary = '-------314159265358979323846';
        const metadata = {
            name: filename,
            mimeType: 'application/json'
        };

        if (!currentFileId) {
            metadata.parents = [folderId];
        }

        const multipartBody =
            `--${boundary}\r\n` +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            JSON.stringify(metadata) + '\r\n' +
            `--${boundary}\r\n` +
            `Content-Type: application/json\r\n\r\n` +
            content + '\r\n' +
            `--${boundary}--`;

        const url = currentFileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${currentFileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        const response = await fetch(url, {
            method: currentFileId ? 'PATCH' : 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        if (response.ok) {
            const result = await response.json();
            currentFileId = result.id;
            els.saveStatus.textContent = '저장됨 ✓';
            els.saveStatus.className = 'save-status saved';
        } else {
            throw new Error('저장 실패');
        }
    } catch (e) {
        console.error('Save error:', e);
        els.saveStatus.textContent = '저장 실패';
        els.saveStatus.className = 'save-status error';
    }
}

/**
 * 파일 목록 표시
 */
async function showFileList() {
    if (!accessToken) {
        alert('먼저 Google에 로그인해주세요.');
        return;
    }

    const title = document.getElementById('fileModalTitle');
    if (title) title.textContent = '📂 Google Drive에서 열기';
    els.fileModal.dataset.mode = 'drive';
    els.fileModal.classList.add('active');
    els.modalFileList.innerHTML = '<div class="modal-empty">파일을 불러오는 중...</div>';
    selectedModalFileId = null;
    els.btnModalOpen.disabled = true;

    try {
        await ensureFolder();

        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
            fields: 'files(id, name, modifiedTime)',
            orderBy: 'modifiedTime desc'
        });

        const files = response.result.files;

        if (files.length === 0) {
            els.modalFileList.innerHTML = '<div class="modal-empty">저장된 파일이 없습니다.</div>';
            return;
        }

        els.modalFileList.innerHTML = '';
        files.forEach(file => {
            const date = new Date(file.modifiedTime).toLocaleString('ko-KR');
            const div = document.createElement('div');
            div.className = 'modal-file-item';
            div.innerHTML = `
                <span class="modal-file-icon">📄</span>
                <div class="modal-file-info">
                    <div class="modal-file-name">${file.name}</div>
                    <div class="modal-file-date">${date}</div>
                </div>
            `;
            div.addEventListener('click', () => {
                document.querySelectorAll('.modal-file-item').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedModalFileId = file.id;
                els.btnModalOpen.disabled = false;
            });
            els.modalFileList.appendChild(div);
        });
    } catch (e) {
        console.error('List error:', e);
        els.modalFileList.innerHTML = '<div class="modal-empty">파일 목록을 불러올 수 없습니다.</div>';
    }
}

/**
 * Drive에서 불러오기
 */
async function loadFromDrive(fileId) {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });

        const data = (typeof response.body === 'string')
            ? JSON.parse(response.body)
            : (response.result || {});

        state.project = normalizeProject(data);
        state.currentEpisodeIndex = 0;
        currentFileId = fileId;

        loadCurrentEpisode();
        updateEpisodesList();
        renderCharacterGrid();

        els.saveStatus.textContent = '불러옴 ✓';
        els.saveStatus.className = 'save-status saved';

    } catch (e) {
        console.error('Load error:', e);
        alert('파일을 불러올 수 없습니다.');
    }
}
