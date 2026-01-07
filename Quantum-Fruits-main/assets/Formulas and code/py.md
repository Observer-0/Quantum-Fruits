class Tick:
    def __init__(self, action_quantum=sigma_P):
        self.action = action_quantum
    def __add__(self, other):
        return Tick(self.action + other.action)
    def __mul__(self, n):
        return Tick(self.action * n)

export function ticks(totalAction, hbar) {
  return totalAction / hbar;
}

export function hawkingRate(M, constants) {
  const chiM = chi(M, constants.G, constants.hbar, constants.c);
  return 1 / Math.sqrt(chiM);
}

export function chi(M, G, hbar, c) {
  return (G * M * M) / (hbar * Math.pow(c, 3));
}
