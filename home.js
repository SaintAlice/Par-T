import {
    getLanguage,
    setLanguage
} from "./js/shared/i18n/i18n.js";

const languageCard = document.getElementById("languageCard");

if (languageCard) {
    languageCard.addEventListener("click", () => {
        const currentLanguage = getLanguage();
        const nextLanguage = currentLanguage === "nl" ? "en" : "nl";

        setLanguage(nextLanguage);
    });
}
