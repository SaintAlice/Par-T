
const headerContainer = document.getElementById("appHeader");
const headerScript = document.currentScript;
const root = headerScript?.dataset.root ?? "";

if (headerContainer) {
    fetch(`${root}header.html`)
        .then(response => {
            if (!response.ok) {
                throw new Error("De algemene header kon niet worden geladen.");
            }

            return response.text();
        })
        .then(async html => {
            headerContainer.innerHTML = html;

            const logo = headerContainer.querySelector(".brandLogo");
            const homeLink = headerContainer.querySelector(".brand");

            if (logo) {
                logo.src = `${root}images/par-t-logo4.png`;
            }

            if (homeLink) {
                homeLink.href = `${root}index.html`;
            }

            const { getLanguage } = await import(
                `${root}js/shared/i18n/i18n.js`
            );

            function updateHeaderLanguage() {
                homeLink?.setAttribute(
                    "aria-label",
                    getLanguage() === "nl"
                        ? "PAR-TEE startpagina"
                        : "PAR-TEE home"
                );
            }

            updateHeaderLanguage();

            window.addEventListener(
                "partee:languagechange",
                updateHeaderLanguage
            );
        })
        .catch(error => {
            console.error("Fout bij laden van de header:", error);
        });
}
