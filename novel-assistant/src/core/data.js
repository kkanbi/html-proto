// data.js

export const defaultProject = {
  title: '',
  totalVolumes: 1,
  volumeGoal: 100000,
  core: {
    logline: '',
    overview: { genre: '', keywords: '', background: '', tone: '' },
    theme: '',
    fullPlot: '',
    volumePlots: {}
  },
  characters: [],
  world: {
    genre: '',
    tags: [],
    sections: { basic: { title: '기본 세계 설정', content: '' } }
  },
  treatment: { parts: [] },
  currentVolume: 1,
  volumes: {
    1: { episodes: [{ number: 1, title: '', content: '', charCount: 0, reviewResult: null }] }
  }
};

export function normalizeProject(input = {}) {
  const p = structuredClone(defaultProject);

  // ===== 얕은 값 =====
  p.title = input.title ?? p.title;
  p.totalVolumes = input.totalVolumes ?? p.totalVolumes;
  p.volumeGoal = input.volumeGoal ?? p.volumeGoal;
  p.currentVolume = input.currentVolume ?? p.currentVolume;

  // ===== core =====
  p.core = { ...p.core, ...(input.core || {}) };
  p.core.overview = { ...p.core.overview, ...(input.core?.overview || {}) };

  // volumePlots 정규화 (구버전 호환: string -> object 변환)
  const inputPlots = input.core?.volumePlots || {};
  p.core.volumePlots = {};

  Object.keys(inputPlots).forEach(volNum => {
    const plot = inputPlots[volNum];
    if (typeof plot === 'string') {
      // 구버전: string -> 새 구조로 변환
      p.core.volumePlots[volNum] = {
        summary: plot,
        relationships: '',
        keyEvents: '',
        emotionalArc: '',
        sexualTension: ''
      };
    } else if (typeof plot === 'object') {
      // 신버전: object 그대로 사용
      p.core.volumePlots[volNum] = {
        summary: plot.summary || '',
        relationships: plot.relationships || '',
        keyEvents: plot.keyEvents || '',
        emotionalArc: plot.emotionalArc || '',
        sexualTension: plot.sexualTension || ''
      };
    }
  });

  // ===== characters =====
  p.characters = Array.isArray(input.characters) ? input.characters : [];

  // ===== world =====
  if (typeof input.world === 'string') {
    p.world.sections.basic.content = input.world;
  } else {
    p.world = { ...p.world, ...(input.world || {}) };
    p.world.tags = Array.isArray(p.world.tags) ? p.world.tags : [];
    p.world.sections = p.world.sections || { basic: { title: '기본 세계 설정', content: '' } };
  }

  // ===== treatment =====
  p.treatment.parts = Array.isArray(input.treatment?.parts)
    ? input.treatment.parts
    : [];

  // ===== volumes =====
  p.volumes = input.volumes || p.volumes;
  if (!p.volumes[p.currentVolume]) {
    p.volumes[p.currentVolume] = structuredClone(defaultProject.volumes[1]);
  }

  return p;
}
