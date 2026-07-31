// api-helper.js - Google Gemini API 호출 헬퍼 함수
import { GEMINI_CONFIG } from './constants.js';

/**
 * Gemini API 엔드포인트 URL 생성
 *
 * Gemini는 브라우저에서의 직접 호출(CORS)을 허용하므로
 * 별도의 프록시 서버가 필요 없다.
 *
 * @param {string} [model] - 사용할 모델 (기본값: GEMINI_CONFIG.MODEL)
 * @returns {string} API 엔드포인트 URL
 */
export function getGeminiApiUrl(model = GEMINI_CONFIG.MODEL) {
    return `${GEMINI_CONFIG.API_BASE}/${model}:generateContent`;
}

/**
 * Gemini API 요청 옵션 생성
 *
 * API 키는 URL 쿼리스트링이 아니라 헤더로 보낸다.
 * URL에 키를 넣으면 브라우저 히스토리·서버 로그·리퍼러에 남을 수 있다.
 *
 * @param {string} apiKey - Gemini API 키
 * @param {string} prompt - 보낼 프롬프트
 * @param {number} [maxOutputTokens] - 최대 출력 토큰
 * @returns {object} fetch 옵션
 */
export function createGeminiRequestOptions(apiKey, prompt, maxOutputTokens = GEMINI_CONFIG.MAX_OUTPUT_TOKENS) {
    return {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens }
        })
    };
}

/**
 * Gemini 응답에서 본문 텍스트를 추출
 *
 * @param {object} result - API 응답 JSON
 * @returns {string} 생성된 텍스트
 * @throws {Error} 응답이 비었거나 안전 필터에 걸린 경우
 */
export function extractResponseText(result) {
    const candidate = result?.candidates?.[0];

    if (!candidate) {
        // 프롬프트 자체가 차단된 경우
        const blockReason = result?.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`요청이 안전 필터에 의해 차단되었습니다 (${blockReason}).`);
        }
        throw new Error('응답이 비어 있습니다.');
    }

    const text = candidate.content?.parts
        ?.map(part => part.text)
        .filter(Boolean)
        .join('');

    if (!text) {
        // 출력 토큰 한도에 걸려 잘린 경우 등
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`응답이 정상적으로 완료되지 않았습니다 (${candidate.finishReason}).`);
        }
        throw new Error('응답 형식이 올바르지 않습니다.');
    }

    return text;
}

/**
 * Gemini 응답에서 토큰 사용량 추출
 *
 * @param {object} result - API 응답 JSON
 * @returns {{inputTokens: number, outputTokens: number}}
 */
export function extractUsage(result) {
    const usage = result?.usageMetadata || {};
    return {
        inputTokens: usage.promptTokenCount || 0,
        // 내부 추론(thinking) 토큰도 출력으로 과금되므로 합산한다.
        outputTokens: (usage.candidatesTokenCount || 0) + (usage.thoughtsTokenCount || 0)
    };
}

/**
 * Gemini 비용 계산
 * 단가는 constants.js의 GEMINI_CONFIG.PRICING에서 가져온다.
 */
export function calculateGeminiCost(inputTokens, outputTokens) {
    const { INPUT_PER_MILLION, OUTPUT_PER_MILLION } = GEMINI_CONFIG.PRICING;
    const inputCost = (inputTokens / 1_000_000) * INPUT_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_PER_MILLION;
    return inputCost + outputCost;
}

/**
 * API 에러 메시지 생성
 *
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
export function getApiErrorMessage(error) {
    const message = error.message || '';

    // 네트워크 / CORS 오류
    if (message.includes('CORS') || message.includes('Failed to fetch')) {
        let msg = '❌ API 서버에 연결하지 못했습니다.\n\n';
        msg += '📋 확인할 것:\n\n';
        msg += '1️⃣ 인터넷 연결 상태\n\n';
        msg += '2️⃣ 브라우저 확장 프로그램(광고 차단 등)이 요청을 막고 있지 않은지\n\n';
        msg += '💡 브라우저 개발자 도구(F12) Console 탭에서 상세 오류를 확인하세요.';
        return msg;
    }

    // 인증 오류
    if (message.includes('401') || message.includes('403') || message.includes('API key')) {
        let msg = '❌ API 키 인증에 실패했습니다.\n\n';
        msg += '📋 확인할 것:\n\n';
        msg += '1️⃣ 키가 AIza... 로 시작하는 Gemini API 키가 맞는지\n\n';
        msg += '2️⃣ https://aistudio.google.com/apikey 에서 키가 유효한지\n\n';
        msg += '3️⃣ 해당 키에 Generative Language API가 활성화되어 있는지';
        return msg;
    }

    // 사용량 한도 초과
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
        let msg = '⏳ 무료 사용량 한도에 도달했습니다.\n\n';
        msg += '잠시 후(보통 1분 이내) 다시 시도해주세요.\n';
        msg += '분당 요청 수 제한에 걸린 경우가 대부분입니다.\n\n';
        msg += '💡 계속 반복되면 하루 한도를 넘긴 것일 수 있습니다.';
        return msg;
    }

    // 모델을 찾을 수 없음
    if (message.includes('404') || message.includes('not found')) {
        let msg = '❌ 모델을 찾을 수 없습니다.\n\n';
        msg += 'src/utils/constants.js 의 GEMINI_CONFIG.MODEL 값을 확인하세요.\n';
        msg += '사용 가능한 모델: https://ai.google.dev/gemini-api/docs/models';
        return msg;
    }

    return `❌ API 호출 실패: ${message}\n\n브라우저 개발자 도구(F12)의 Console 탭에서 자세한 에러를 확인하세요.`;
}
