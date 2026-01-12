function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Activate selected content
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Activate the corresponding button
    // Find button that has an onclick calling this tabId
    document.querySelectorAll('.tab-nav .tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)) {
            btn.classList.add('active');
        }
    });

    // Handle nested buttons if any
    document.querySelectorAll('.theory-subnav .tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)) {
            btn.classList.add('active');
        }
    });

    // Resize simulations if visible
    if (tabId === 'galaxies' && window.galaxySim) window.galaxySim.resize();
    if (tabId === 'blackholes' && window.bhSim) window.bhSim.resize();
}
