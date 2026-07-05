// Shared dark-theme config for @nivo/* charts, matching src/styles/abstracts/_variables.scss
// (nivo takes a plain JS theme object, not SCSS vars, so the relevant hex values are mirrored here).
export const nivoDarkThemeCompactAxis = {
  background: 'transparent',
  text: {
    fill: '#a0a1ac', // $gray-400
    fontSize: 12,
  },
  axis: {
    domain: { line: { stroke: '#32323f' } }, // $gray-80
    ticks: {
      line: { stroke: '#32323f' },
      text: { fill: '#7c7e8c', fontSize: 10 }, // $gray-300, smaller so rotation isn't needed
    },
  },
  grid: {
    line: { stroke: '#32323f' },
  },
  tooltip: {
    container: {
      background: '#25252f', // $gray-50
      color: '#ffffff', // $gray-900
      fontSize: 12,
    },
  },
  legends: {
    text: { fill: '#a0a1ac' },
  },
};

export const nivoDarkTheme = {
  background: 'transparent',
  text: {
    fill: '#a0a1ac', // $gray-400
    fontSize: 12,
  },
  axis: {
    domain: { line: { stroke: '#32323f' } }, // $gray-80
    ticks: {
      line: { stroke: '#32323f' },
      text: { fill: '#7c7e8c' }, // $gray-300
    },
  },
  grid: {
    line: { stroke: '#32323f' },
  },
  tooltip: {
    container: {
      background: '#25252f', // $gray-50
      color: '#ffffff', // $gray-900
      fontSize: 12,
    },
  },
  legends: {
    text: { fill: '#a0a1ac' },
  },
};

// Matches facereview-front src/constants/index.ts EMOTION_COLORS exactly (design-system parity).
export const EMOTION_COLOR: Record<string, string> = {
  happy: '#FF4D8D',
  surprise: '#92C624',
  sad: '#479CFF',
  angry: '#FF6B4B',
  neutral: '#5D5D6D',
};

export const EMOTION_LABEL: Record<string, string> = {
  happy: '기쁨',
  surprise: '놀람',
  neutral: '무표정',
  sad: '슬픔',
  angry: '분노',
};
