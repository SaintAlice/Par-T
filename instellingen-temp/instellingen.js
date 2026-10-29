
/* PAR-T — taalvoorkeur */

const languageSelect = document.getElementById("languageSelect");
const languageStorageKey = "parTLanguage";

if (languageSelect) {
    const savedLanguage = localStorage.getItem(languageStorageKey);

    if (savedLanguage && ["nl", "en"].includes(savedLanguage)) {
        languageSelect.value = savedLanguage;
    }

    languageSelect.addEventListener("change", () => {
        localStorage.setItem(languageStorageKey, languageSelect.value);
    });
}
