import {
    t,
    getLanguage,
    initLanguage
} from "./js/shared/i18n/i18n.js";

initLanguage();

const projectRoot = new URL("./", import.meta.url);

const homeUrl = new URL("index.html", projectRoot).href;
const gamesUrl = new URL("games/games.html", projectRoot).href;
const settingsUrl = new URL("instellingen/instellingen.html", projectRoot).href;

const currentPage = window.location.pathname;

const isHomePage = new URL(homeUrl).pathname === currentPage;
const isGamesPage = new URL(gamesUrl).pathname === currentPage;
const isSettingsPage = currentPage.startsWith(
    new URL("instellingen/", projectRoot).pathname
);

const navigation = document.createElement("nav");

navigation.className = "bottomNav";

function renderNavigation() {
    const language = getLanguage();

    navigation.setAttribute(
        "aria-label",
        language === "nl" ? "Hoofdnavigatie" : "Main navigation"
    );

    navigation.innerHTML = `
        <a
            class="navItem ${isHomePage ? "active" : ""}"
            href="${homeUrl}"
            ${isHomePage ? 'aria-current="page"' : ""}
        >
            <span class="navIcon" aria-hidden="true">
                <i data-lucide="house"></i>
            </span>
            <span>${t("common.home")}</span>
        </a>

        <a
            class="navItem ${isGamesPage ? "active" : ""}"
            href="${gamesUrl}"
            ${isGamesPage ? 'aria-current="page"' : ""}
        >
            <span class="navIcon" aria-hidden="true">
                <i data-lucide="club"></i>
            </span>
            <span>${t("common.games")}</span>
        </a>

        <a
            class="navItem ${isSettingsPage ? "active" : ""}"
            href="${settingsUrl}"
            ${isSettingsPage ? 'aria-current="page"' : ""}
        >
            <span class="navIcon" aria-hidden="true">
                <i data-lucide="settings"></i>
            </span>
            <span>${t("common.settings")}</span>
        </a>
    `;

    if (window.lucide) {
        lucide.createIcons();
    }
}

document.body.appendChild(navigation);

renderNavigation();

window.addEventListener("partee:languagechange", renderNavigation);
