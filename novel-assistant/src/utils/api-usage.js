// api-usage.js - API 사용량 추적 및 관리
const USAGE_STORAGE_KEY = 'novelWriter_apiUsage';

/**
 * API 사용량 데이터 구조
 * {
 *   totalCost: 0,
 *   totalRequests: 0,
 *   history: [
 *     { timestamp, type, cost, inputTokens, outputTokens }
 *   ]
 * }
 */

/**
 * 사용량 데이터 로드
 */
export function loadUsageData() {
    const data = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!data) {
        return {
            totalCost: 0,
            totalRequests: 0,
            history: []
        };
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return {
            totalCost: 0,
            totalRequests: 0,
            history: []
        };
    }
}

/**
 * 사용량 데이터 저장
 */
export function saveUsageData(data) {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
}

/**
 * 사용량 추가
 */
export function addUsage(type, cost, inputTokens = 0, outputTokens = 0) {
    const data = loadUsageData();

    data.totalCost += cost;
    data.totalRequests += 1;
    data.history.push({
        timestamp: new Date().toISOString(),
        type, // 'review' or 'character-gen'
        cost,
        inputTokens,
        outputTokens
    });

    saveUsageData(data);
    updateUsageDisplay();

    return data;
}

/**
 * 사용량 초기화
 */
export function resetUsage() {
    const data = {
        totalCost: 0,
        totalRequests: 0,
        history: []
    };
    saveUsageData(data);
    updateUsageDisplay();
}

/**
 * 사용량 디스플레이 업데이트
 */
export function updateUsageDisplay() {
    const data = loadUsageData();
    const totalUsageEl = document.getElementById('totalUsage');

    if (totalUsageEl) {
        // 무료 티어(단가 0)에서는 금액 대신 호출 횟수와 토큰 수를 보여준다.
        if (data.totalCost > 0) {
            totalUsageEl.textContent = `$${data.totalCost.toFixed(4)} (${data.totalRequests}회)`;
        } else {
            const totalTokens = data.history.reduce(
                (sum, entry) => sum + (entry.inputTokens || 0) + (entry.outputTokens || 0),
                0
            );
            totalUsageEl.textContent = `${data.totalRequests}회 · ${totalTokens.toLocaleString()}토큰 (무료 티어)`;
        }
    }
}

/**
 * 대략적인 토큰 수 추정 (한글/영문 혼합)
 * 한글: 약 1.5자 = 1토큰
 * 영문: 약 4자 = 1토큰
 */
export function estimateTokens(text) {
    if (!text) return 0;

    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - koreanChars;

    const koreanTokens = Math.ceil(koreanChars / 1.5);
    const otherTokens = Math.ceil(otherChars / 4);

    return koreanTokens + otherTokens;
}
