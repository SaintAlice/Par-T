
import nl from "./translations/nl.js";
import en from "./translations/en.js";

const LANGUAGE_STORAGE_KEY = "parTeeLanguage";
const DEFAULT_LANGUAGE = "nl";

const translations = {
    nl,
    en
};

const supportedLanguages = Object.keys(translations);

let currentLanguage = DEFAULT_LANGUAGE;

function getStoredLanguage() {
    try {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
        return null;
    }
}

function getBrowserLanguage() {
    const browserLanguage = navigator.language?.toLowerCase() ?? "";

    return browserLanguage.startsWith("nl") ? "nl" : "en";
}

function getTranslationValue(dictionary, key) {
    return key.split(".").reduce((value, part) => {
        return value?.[part];
    }, dictionary);
}

console.log("NL translation structure:", {
    topLevelKeys: Object.keys(nl),
    games: nl.games,
    test: getTranslationValue(
        nl,
        "games.flightBuilder.playersPage.title"
    )
});

export function getLanguage() {
    return currentLanguage;
}

export function t(key, variables = {}) {
    const translation =
        getTranslationValue(translations[currentLanguage], key)
        ?? getTranslationValue(translations.nl, key);

    if (typeof translation !== "string") {
        return key;
    }

    return translation.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => {
        return variables[name] !== undefined
            ? String(variables[name])
            : match;
    });
}

export function applyTranslations(root = document) {
    const selectors = [
        "[data-i18n]",
        "[data-i18n-placeholder]",
        "[data-i18n-aria-label]",
        "[data-i18n-title]",
        "[data-i18n-value]"
    ];

    const elements = [];

    if (root.matches?.(selectors.join(","))) {
        elements.push(root);
    }

    elements.push(...root.querySelectorAll(selectors.join(",")));

    elements.forEach(element => {
        if (element.dataset.i18n) {
            element.textContent = t(element.dataset.i18n);
        }

        if (element.dataset.i18nPlaceholder) {
            element.placeholder = t(element.dataset.i18nPlaceholder);
        }

        if (element.dataset.i18nAriaLabel) {
            element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
        }

        if (element.dataset.i18nTitle) {
            element.title = t(element.dataset.i18nTitle);
        }

        if (element.dataset.i18nValue) {
            element.value = t(element.dataset.i18nValue);
        }
    });
}

export function setLanguage(language) {
    if (!supportedLanguages.includes(language)) {
        return false;
    }

    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
        return false;
    }

    currentLanguage = language;

    document.documentElement.lang = language;
    applyTranslations();

    window.dispatchEvent(
        new CustomEvent("partee:languagechange", {
            detail: { language }
        })
    );

    return true;
}

export function initLanguage() {
    const savedLanguage = getStoredLanguage();

    currentLanguage = supportedLanguages.includes(savedLanguage)
        ? savedLanguage
        : getBrowserLanguage();

    document.documentElement.lang = currentLanguage;
    applyTranslations();

    return currentLanguage;
}