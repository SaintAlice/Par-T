
import {
    initLanguage,
    setLanguage
} from "../js/shared/i18n/i18n.js";

const languageSelect = document.getElementById("languageSelect");

const currentLanguage = initLanguage();

if (languageSelect) {
    languageSelect.value = currentLanguage;

    languageSelect.addEventListener("change", () => {
        const selectedLanguage = languageSelect.value;

        if (!setLanguage(selectedLanguage)) {
            languageSelect.value = currentLanguage;
        }
    });
}
