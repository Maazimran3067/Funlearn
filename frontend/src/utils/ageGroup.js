// Centralised age group normalisation — import this everywhere
export function normaliseAge(raw) {
    if (!raw) return '6-9';
    const s = String(raw).trim();
    if (s === '3-5' || s === '3-6') return '3-6';
    if (s === '6-8' || s === '6-9') return '6-9';
    if (s === '9-12')               return '9-12';
    return '6-9';
  }
  
  export const AGE_LABEL = {
    '3-6':  '🐣 Little Explorer (Age 3–6)',
    '6-9':  '🚀 Junior Learner (Age 6–9)',
    '9-12': '🧠 Super Scholar (Age 9–12)',
  };