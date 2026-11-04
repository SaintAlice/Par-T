
function initializeIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeIcons);
} else {
    initializeIcons();
}
