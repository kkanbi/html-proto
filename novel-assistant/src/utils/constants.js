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

// Google Gemini API 설정
// 키 발급: https://aistudio.google.com/apikey (무료 티어 제공, 키는 AIza... 로 시작)
export const GEMINI_CONFIG = {
    // 모델 목록은 https://ai.google.dev/gemini-api/docs/models 에서 확인.
    // 무료 티어 한도가 넉넉한 flash 계열을 기본으로 둔다.
    MODEL: 'gemini-2.5-flash',
    API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 8192,

    // 퇴고처럼 긴 응답이 필요한 작업의 출력 한도
    MAX_OUTPUT_TOKENS_LONG: 16384,

    // 무료 티어 기준 요금은 0. 유료 티어로 쓸 경우
    // https://ai.google.dev/pricing 의 100만 토큰당 단가를 여기에 넣으면
    // 사용량 패널에 예상 비용이 표시된다.
    PRICING: {
        INPUT_PER_MILLION: 0,
        OUTPUT_PER_MILLION: 0
    }
};

export const UI_CONFIG = {
    DEBOUNCE_DEFAULT: 1000,
    CHARS_PER_PAGE: 200,
    DEFAULT_VOLUME_GOAL: 100000
};
