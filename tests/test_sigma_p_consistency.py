import os
import sys
import unittest


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from py import sigma_p_consistency as core


class SigmaPConsistencyTests(unittest.TestCase):
    def assert_relative_close(self, a, b, rel_tol=1e-12, abs_tol=0.0):
        scale = max(abs(a), abs(b))
        threshold = max(abs_tol, rel_tol * scale)
        self.assertLessEqual(abs(a - b), threshold)

    def test_sigma_p_magnitude(self):
        sigma_p = core.sigma_p()
        # CODATA-level constants imply sigma_P ~ 8.7e-79 m*s.
        self.assertGreater(sigma_p, 8.0e-79)
        self.assertLess(sigma_p, 9.5e-79)

    def test_planck_projection_identity(self):
        sigma_p = core.sigma_p()
        l_p_sq = core.planck_length_squared()
        self.assert_relative_close(l_p_sq, sigma_p * core.DEFAULT_CONSTANTS.c)

    def test_alpha_and_nsigma_are_reciprocals(self):
        radius, age = core.cosmic_window_now()
        alpha = core.alpha_sigma(radius, age)
        n_sigma = core.n_sigma(radius, age)
        self.assert_relative_close(alpha * n_sigma, 1.0)

    def test_lambda_definitions_match(self):
        radius, age = core.cosmic_window_now()
        lam_alpha = core.lambda_from_alpha(radius, age)
        lam_window = core.lambda_from_window(radius, age)
        self.assert_relative_close(lam_alpha, lam_window)

    def test_consistency_runner_returns_all_true(self):
        radius, age = core.cosmic_window_now()
        checks = core.run_consistency_checks(radius, age)
        self.assertTrue(all(checks.values()), msg=f"Failed checks: {checks}")

    def test_relative_check_preserves_tiny_scale_sensitivity(self):
        a = 1.0e-53
        b = a * (1.0 + 1.0e-9)
        with self.assertRaises(AssertionError):
            self.assert_relative_close(a, b, rel_tol=1e-12)

    def test_invalid_window_raises(self):
        with self.assertRaises(ValueError):
            core.n_sigma(0.0, 1.0)
        with self.assertRaises(ValueError):
            core.alpha_sigma(1.0, -1.0)


if __name__ == "__main__":
    unittest.main()
