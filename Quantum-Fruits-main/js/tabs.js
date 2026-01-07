function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Activate selected
    document.getElementById('tab-' + tabId).classList.add('active');

    // Find button and activate it
    // Logic: The button that called this might not be easily accessible if we just pass ID.
    // Instead early binding or querySelector strategy.

    // Let's assume buttons are in order: Theory, Papers, Formulas
    const btns = document.querySelectorAll('.tab-btn');
    if (tabId === 'theory' && btns[0]) btns[0].classList.add('active');
    if (tabId === 'papers' && btns[1]) btns[1].classList.add('active');
    if (tabId === 'formulas' && btns[2]) btns[2].classList.add('active');

    // Optional: Trigger Math render if needed
    // if (window.renderMathInElement) {
    //    renderMathInElement(document.getElementById('tab-' + tabId));
    // }
}
