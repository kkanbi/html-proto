// api-helper.js - Claude / Gemini API 호출 헬퍼 함수
import { CLAUDE_CONFIG, GEMINI_CONFIG } from './constants.js';

export function getAnthropicApiUrl() {
    const baseUrl = 'https://api.anthropic.com/v1/messages';
    const hostname = window.location.hostname;

    const isGitHubPages = hostname.includes('github.io');
    if (isGitHubPages) {
        if (CLAUDE_CONFIG.WORKER_URL) {
            return CLAUDE_CONFIG.WORKER_URL;
        }
        console.warn('⚠️ Cloudflare Workers 프록시가 설정되지 않았습니다. corsproxy.io를 사용합니다.');
        return 'https://corsproxy.io/?' + encodeURIComponent(baseUrl);
    }

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${window.location.origin}/api/claude`;
    }

    return baseUrl;
}

export function createApiRequestOptions(apiKey, payload) {
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(payload)
    };
}

// ─── Gemini 헬퍼 ───────────────────────────────────────────────

export function getGeminiApiUrl() {
    return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.MODEL}:generateContent`;
}

export function createGeminiRequestOptions(apiKey, prompt) {
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: GEMINI_CONFIG.MAX_TOKENS }
        })
    };
}

export function calculateGeminiCost(inputTokens, outputTokens) {
    const inputCost = (inputTokens / 1_000_000) * GEMINI_CONFIG.PRICING.INPUT_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * GEMINI_CONFIG.PRICING.OUTPUT_PER_MILLION;
    return inputCost + outputCost;
}

// ────────────────────────────────────────────────────────────────

export function getApiErrorMessage(error) {
    let errorMessage = `❌ API 호출 실패: ${error.message}\n\n`;

    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMessage = `❌ CORS 오류: 브라우저 보안 정책으로 인해 API 호출이 차단되었습니다.\n\n`;
        errorMessage += '📋 해결 방법:\n\n';
        errorMessage += '1️⃣ Cloudflare Workers프록시 설정 (5분, 추천)\n';
        errorMessage += '   - SETUP-GUIDE.md 문서의 "방법 3: GitHub Pages" 섹션 참조\n\n';
        errorMessage += '2️⃣ 로컬 서버 사용\n';
        errorMessage += '   - START-SERVER.bat 실행 후 http://localhost:8080 접속\n\n';
        errorMessage += '3️⃣ 로컬 HTML 파일 사용\n';
        errorMessage += '   - index.html 파일 직접 더블 클릭\n\n';
        errorMessage += '💡 가장 간단: index.html 더블클릭 (0초 설정)';
    } else {
        errorMessage += '가능한 원인:\n';
        errorMessage += '1. API 키가 올바르지 않습니다 (sk-ant-api-로 시작해야 함)\n';
        errorMessage += '2. API 키에 충분한 크레딧이 없습니다\n';
        errorMessage += '3. 네트워크 연결 문제\n';
        errorMessage += '4. API 서비스 일시 중단\n\n';
        errorMessage += '브라우저 개발자 도구(F12)의 Console 탭에서 자세한 에러를 확인하세요.';
    }

    return errorMessage;
}
