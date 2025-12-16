// sigmaP helper functions (ES module)
export const CONSTS = {
  hbar: 1.054e-34,
  G: 6.674e-11,
  c: 2.998e8,
  kB: 1.381e-23
};

export function chi(M, G = CONSTS.G, hbar = CONSTS.hbar, c = CONSTS.c) {
  return (G * M * M) / (hbar * Math.pow(c, 3));
}

export function ticks(totalAction, hbar = CONSTS.hbar) {
  return totalAction / hbar;
}

export function hawkingRate(M, constants = CONSTS) {
  const chiM = chi(M, constants.G, constants.hbar, constants.c);
  return 1 / Math.sqrt(chiM);
}

export function alphaG(M, G = CONSTS.G, hbar = CONSTS.hbar, c = CONSTS.c) {
  return (G * M) / (hbar * c);
}

// small self-test when loaded in browser console
if (typeof window !== 'undefined') {
  console.debug('sigmaP module loaded — available exports: chi, ticks, hawkingRate, alphaG');
}
