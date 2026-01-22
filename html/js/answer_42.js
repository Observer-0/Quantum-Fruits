/**
 * THE NUMBER 42 — explained by physics.
 *
 * Question:
 * Why can complex structures (chemistry, life, thoughts) exist
 * without collapsing under gravity?
 *
 * Answer:
 * Because on microscopic scales, gravity is absurdly weak.
 */

function explain42() {

    console.log("============================================================");
    console.log("   WHY THOUGHTS DO NOT COLLAPSE INTO BLACK HOLES");
    console.log("============================================================\n");

    console.log("[1] Loading fundamental constants (SI units)...");

    // Fundamental constants
    const k_e = 8.9875517923e9;      // Coulomb constant (N·m²/C²)
    const e = 1.602176634e-19;     // Elementary charge (C)
    const G = 6.67430e-11;         // Gravitational constant (m³/kg/s²)
    const m_e = 9.10938356e-31;      // Electron mass (kg)

    console.log(`    k_e  = ${k_e.toExponential(3)}`);
    console.log(`    e    = ${e.toExponential(3)}`);
    console.log(`    G    = ${G.toExponential(3)}`);
    console.log(`    m_e  = ${m_e.toExponential(3)}\n`);

    console.log("[2] Comparing forces between two electrons...");
    console.log("    (distance cancels out: both scale as 1/r²)\n");

    // Force ratio
    const F_em = k_e * e * e;
    const F_g = G * m_e * m_e;
    const ratio = F_em / F_g;
    const log10 = Math.log10(ratio);

    console.log(`    Electromagnetic strength : ${F_em.toExponential(4)}`);
    console.log(`    Gravitational strength   : ${F_g.toExponential(4)}`);
    console.log("------------------------------------------------------------");
    console.log(`    Strength ratio (EM / G)  : ${ratio.toExponential(3)}`);
    console.log(`    Orders of magnitude      : ${log10.toFixed(2)}`);
    console.log("------------------------------------------------------------\n");

    console.log("[3] Interpretation...\n");

    console.log("    • On atomic scales, gravity is irrelevant.");
    console.log("    • Electromagnetism dominates by ~10^42.");
    console.log("    • Chemistry, biology and neurons depend on EM forces.");
    console.log("    • Gravity only becomes important for stars and galaxies.\n");

    const answer = Math.round(log10);

    console.log(`>>> The famous number appears as: 10^${answer} <<<\n`);

    console.log("Conclusion:");
    console.log("The universe separates INFORMATION from GEOMETRY");
    console.log("by roughly forty-two orders of magnitude.");
    console.log("That gap is what allows stable matter, complexity,");
    console.log("and ultimately: thoughts.\n");
    console.log("42 is not magic.");
    console.log("42 is the safety margin.");
    console.log("\nDouglas Adams hatte nicht recht im physikalischen Sinn –");
    console.log("aber er hatte erschreckend recht im strukturellen Sinn.\n");

    console.log("„The answer is 42.“");
    console.log("Nicht, weil 42 magisch ist,");
    console.log("sondern weil die Frage falsch gestellt ist.");
    console.log("\nDie Physik sagt:");
    console.log("Es gibt keinen Grund, warum EM 10⁴²-mal stärker sein muss als Gravitation.");
    console.log("Es ist einfach so.");
    console.log("Und ohne diese Zahl gäbe es niemanden, der die Frage stellt.");
    console.log("\nAdams’ Pointe war nie die Zahl.");
    console.log("Die Pointe war:");
    console.log("Ein Universum, das Antworten liefert,");
    console.log("bevor es erklärt, welche Fragen sinnvoll sind.");
    console.log("\n42 ist nicht die Antwort auf das Universum.");
    console.log("42 ist der Abstand zwischen einem Universum");
    console.log("und einem, das sich selbst erklären will.");
    console.log("\nHandtuch nicht vergessen.");
}

// Run it
explain42();
