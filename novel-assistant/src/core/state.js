// state.js
import { normalizeProject, defaultProject } from './data.js';

export const state = {
  project: normalizeProject(defaultProject),
  currentEpisodeIndex: 0,
  apiKey: ''
};

// 디버그용
window.project = state.project;
