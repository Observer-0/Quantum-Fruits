import json
import numpy as np
import physics_engine as yps

# ============================================================
# Datenextraktion und JSON-Export
# ============================================================

def export_data_for_web(spin=80.0, burden=10.0):
    data = []
    
    # Repräsentative Objekte: PBH, stellar, supermassive
    reps = [yps.SAMPLES[0], yps.SAMPLES[4], yps.SAMPLES[9]]

    for name, M0 in reps:
        t_sc, M_sc, TH_sc, S_sc, Srad_sc, tau_sc = yps.evaporate_semiclassical(M0)
        t_q, M_q, TH_q, S_q, Srad_q, tau_q, Srem = yps.evaporate_sigmaP_quantized(M0)
        
        # Daten für die Webseite vorbereiten
        balance = yps.action_burden_balance(spin, burden)
        entry = {
            "name": name,
            "M0": M0,
            "tau_sc": tau_sc,
            "tau_q": tau_q,
            "Srem_kB": Srem / yps.kB, # Srem normalisiert mit kB
            "hawking_temp_M0": yps.hawking_temperature(M0),
            "action_burden": {
                "spin": float(spin),
                "burden": float(burden),
                "balance": float(balance),
            },
            "data_sc": {
                "t_norm": (t_sc / tau_sc).tolist(),
                "Srad_norm": (Srad_sc / max(np.max(Srad_sc), 1e-99)).tolist(),
            },
            "data_q": {
                "t_norm": (t_q / max(t_q[-1], 1e-99)).tolist(),
                "Srad_norm": (Srad_q / max(np.max(Srad_q), 1e-99)).tolist(),
            }
        }
        data.append(entry)
    
    with open('physics_data.json', 'w') as f:
        json.dump(data, f, indent=4)
    print("Daten erfolgreich nach 'physics_data.json' exportiert.")

if __name__ == "__main__":
    export_data_for_web()
