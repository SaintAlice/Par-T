
/* PAR-T — gedeelde navigatie */

const navigationScript = document.currentScript;
const projectRoot = new URL("./", navigationScript.src);

const homeUrl = new URL("index.html", projectRoot).href;
const gamesUrl = new URL("games/games.html", projectRoot).href;
const settingsUrl = new URL("instellingen/instellingen.html", projectRoot).href;

const currentPage = window.location.pathname;

const isHomePage =
    new URL(homeUrl).pathname === currentPage;

const isGamesPage =
    new URL(gamesUrl).pathname === currentPage;

const isSettingsPage =
    currentPage.startsWith(
        new URL("instellingen/", projectRoot).pathname
    );

const navigation = document.createElement("nav");

navigation.className = "bottomNav";
navigation.setAttribute("aria-label", "Hoofdnavigatie");

navigation.innerHTML = `
    <a
        class="navItem ${isHomePage ? "active" : ""}"
        href="${homeUrl}"
        ${isHomePage ? 'aria-current="page"' : ""}
    >
        <span class="navIcon" aria-hidden="true">
            <i data-lucide="house"></i>
        </span>
        <span>Home</span>
    </a>

    <a
        class="navItem ${isGamesPage ? "active" : ""}"
        href="${gamesUrl}"
        ${isGamesPage ? 'aria-current="page"' : ""}
    >
        <span class="navIcon" aria-hidden="true">
            <i data-lucide="club"></i>
        </span>
        <span>Spellen</span>
    </a>

    <a
        class="navItem ${isSettingsPage ? "active" : ""}"
        href="${settingsUrl}"
        ${isSettingsPage ? 'aria-current="page"' : ""}
    >
        <span class="navIcon" aria-hidden="true">
            <i data-lucide="settings"></i>
        </span>
        <span>Instellingen</span>
    </a>
`;

document.body.appendChild(navigation);

if (window.lucide) {
    lucide.createIcons();
}

document.body.appendChild(navigation);
