import os
import sys
import unittest


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from py.quantum_fruits_sim import simulate_page_curve_mechanic


class SimulationTests(unittest.TestCase):
    def test_simulation_outputs_are_non_negative(self):
        for integrator in ["euler", "rk4"]:
            t, spin, mass, entropy = simulate_page_curve_mechanic(
                duration=1.0, steps=50, integrator=integrator
            )
            self.assertTrue(len(t) == len(mass) == len(entropy) > 0)
            self.assertTrue(all(m >= 0 for m in mass), "Mass became negative")
            self.assertTrue(all(e >= 0 for e in entropy), "Entropy became negative")


if __name__ == "__main__":
    unittest.main()
