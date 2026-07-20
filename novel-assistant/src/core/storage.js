// storage.js
import { state } from './state.js';
import { normalizeProject, defaultProject } from './data.js';
import { debounce } from '../utils/helpers.js';

// 디바운스된 저장 함수들
const debouncedSaveContent = debounce(autoSaveLocal, 2000); // 본문: 2초
const debouncedSaveTitle = debounce(autoSaveLocal, 500);    // 제목: 0.5초
const debouncedSaveSettings = debounce(autoSaveLocal, 1000); // 설정: 1초

/**
 * 로컬 자동 저장
 */
export function autoSaveLocal() {
  localStorage.setItem(
    'novelWriter_project',
    JSON.stringify(state.project)
  );

  localStorage.setItem(
    'novelWriter_claudeKey',
    state.claudeApiKey || ''
  );

  localStorage.setItem(
    'novelWriter_currentEpisode',
    state.currentEpisodeIndex ?? 0
  );

  // 디버깅/콘솔 확인용 전역 동기화
  window.project = state.project;
}

/**
 * 필드별 디바운스된 저장
 */
export function autoSaveContent() {
  debouncedSaveContent();
}

export function autoSaveTitle() {
  debouncedSaveTitle();
}

export function autoSaveSettings() {
  debouncedSaveSettings();
}

/**
 * 로컬 자동 저장 불러오기
 * @param {Object} options
 * @param {Function} options.onAfterLoad - 불러온 뒤 UI 갱신 콜백
 */
export function loadAutoSave({ onAfterLoad } = {}) {
  const saved = localStorage.getItem('novelWriter_project');
  if (!saved) {
    // 저장된 게 없어도 기본 project는 유지
    if (typeof onAfterLoad === 'function') onAfterLoad();
    return;
  }

  try {
    const data = JSON.parse(saved) || {};

    // ===== project normalize (구버전 호환 포함) =====
    state.project = normalizeProject({
      ...defaultProject,
      ...data,
      core: {
        ...defaultProject.core,
        ...(data.core || {}),
        overview: {
          ...defaultProject.core.overview,
          ...(data.core?.overview || {})
        }
      },
      world: {
        ...defaultProject.world,
        ...(data.world || {})
      },
      treatment: data.treatment || defaultProject.treatment,
      characters: Array.isArray(data.characters)
        ? data.characters
        : [],
      volumes:
        data.volumes && typeof data.volumes === 'object'
          ? data.volumes
          : defaultProject.volumes
    });

    // 전역 동기화
    window.project = state.project;

    // ===== 기타 로컬 상태 =====
    state.currentEpisodeIndex =
      parseInt(
        localStorage.getItem('novelWriter_currentEpisode'),
        10
      ) || 0;

    state.claudeApiKey =
      localStorage.getItem('novelWriter_claudeKey') || '';

    if (typeof onAfterLoad === 'function') onAfterLoad();
  } catch (e) {
    console.error('자동 저장 불러오기 실패:', e);
  }
}
