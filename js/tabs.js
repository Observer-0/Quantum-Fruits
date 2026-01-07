function switchTab(tabId) {
    // Hide all contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Activate selected content
    const targetContent = document.getElementById('tab-' + tabId);
    if (targetContent) {
        targetContent.classList.add('active');
    }

    // Activate selected button
    // Find button that has the onclick with this tabId
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)) {
            btn.classList.add('active');
        }
    });

    // Optional: Trigger Math render if needed
    if (window.renderMathInElement && targetContent) {
        renderMathInElement(targetContent, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false },
                { left: "\\[", right: "\\]", display: true }
            ]
        });
    }
}
