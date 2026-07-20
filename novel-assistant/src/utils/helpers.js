// helpers.js - 공통 유틸리티 함수

/**
 * 정규표현식 특수문자 이스케이프
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 디바운스 함수 생성
 * @param {Function} func
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 글자수 계산 (공백 포함/제외)
 * @param {string} text
 * @returns {{withSpaces: number, withoutSpaces: number, pages: number}}
 */
export function calculateStats(text) {
    const withSpaces = text.length;
    const withoutSpaces = text.replace(/\s/g, '').length;
    const pages = (withoutSpaces / 200).toFixed(1);

    return { withSpaces, withoutSpaces, pages };
}

/**
 * 숫자를 천단위 콤마 포맷으로 변환
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    return num.toLocaleString();
}
