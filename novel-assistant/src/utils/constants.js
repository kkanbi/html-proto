// constants.js - 앱 전역 상수
export const GOOGLE_CONFIG = {
    CLIENT_ID: '1091054006094-57mjgruhj8djhi2s2e81pah1p1demj65.apps.googleusercontent.com',
    API_KEY: '',
    SCOPES: 'https://www.googleapis.com/auth/drive.file',
    FOLDER_NAME: '소설작성기'
};

export const AUTOSAVE_DELAY = {
    TITLE: 500,
    CONTENT: 2000,
    SETTINGS: 1000
};

export const CLAUDE_CONFIG = {
    MODEL: 'claude-sonnet-4-6',
    MAX_TOKENS: 2048,
    PRICING: {
        INPUT_PER_MILLION: 3,
        OUTPUT_PER_MILLION: 15
    },
    // Cloudflare Workers 프록시 URL (GitHub Pages 배포 시 설정)
    // 비워두면 corsproxy.io 폴백 사용 (불안정할 수 있음)
    // 설정 방법: docs/SETUP.md "방법 3: GitHub Pages" → B. Claude API CORS 우회 참조
    // 예: WORKER_URL: 'https://novel-proxy.your-name.workers.dev'
    WORKER_URL: ''
};

export const GEMINI_CONFIG = {
    MODEL: 'gemini-2.5-flash',
    MAX_TOKENS: 8192,
    PRICING: {
        INPUT_PER_MILLION: 0.075,
        OUTPUT_PER_MILLION: 0.30
    }
};

export const UI_CONFIG = {
    DEBOUNCE_DEFAULT: 1000,
    CHARS_PER_PAGE: 200,
    DEFAULT_VOLUME_GOAL: 100000
};
