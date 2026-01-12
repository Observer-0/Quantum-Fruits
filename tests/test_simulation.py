from py.quantum_fruits_sim import simulate_page_curve_mechanic


def simple_checks():
    for integrator in ['euler', 'rk4']:
        t, spin, mass, entropy = simulate_page_curve_mechanic(duration=1.0, steps=50, integrator=integrator)
        assert len(t) == len(mass) == len(entropy) > 0
        assert all(m >= 0 for m in mass), "Mass became negative"
        assert all(e >= 0 for e in entropy), "Entropy became negative"
    print('All simulation checks passed')


if __name__ == '__main__':
    simple_checks()
