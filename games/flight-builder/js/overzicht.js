
const FLIGHTS_STORAGE_KEY = "flightBuilderFlights";
const SETTINGS_STORAGE_KEY = "flightBuilderSettings";

const playerCountElement = document.getElementById("playerCount");
const flightCountElement = document.getElementById("flightCount");
const distributionMethodElement = document.getElementById("distributionMethod");
const overviewFlightList = document.getElementById("overviewFlightList");
const backButton = document.getElementById("backButton");

let flights = [];
let settings = {};

const distributionMethods = {
    random: "Willekeurige verdeling",
    equalHandicap: "Gelijk gemiddeld handicap",
    similarHandicap: "Handicap spreiden"
};

function loadOverviewData() {
    try {
        flights = JSON.parse(
            sessionStorage.getItem(FLIGHTS_STORAGE_KEY)
        ) || [];

        settings = JSON.parse(
            sessionStorage.getItem(SETTINGS_STORAGE_KEY)
        ) || {};
    } catch (error) {
        console.error("De flightindeling kon niet worden geladen.", error);
        flights = [];
        settings = {};
    }
}

function renderSummary() {
    const totalPlayers = flights.reduce(
        (total, flight) => total + flight.length,
        0
    );

    playerCountElement.textContent = totalPlayers;
    flightCountElement.textContent = flights.length;

    distributionMethodElement.textContent =
        distributionMethods[settings.method] || "Onbekende methode";
}

function renderFlights() {
    overviewFlightList.replaceChildren();

    flights.forEach((flight, index) => {
        const flightCard = document.createElement("article");
        flightCard.className = "overviewFlightCard";

        const title = document.createElement("h2");
        title.className = "overviewFlightTitle";
        title.textContent = `Flight ${index + 1}`;

        const playerList = document.createElement("div");
        playerList.className = "overviewPlayerList";

        flight.forEach(player => {
            const playerElement = document.createElement("div");
            playerElement.className = "overviewPlayer";

            const playerName = document.createElement("span");
            playerName.className = "overviewPlayerName";
            playerName.textContent = player.name;

            playerElement.append(playerName);

            if (settings.method !== "random") {
                const handicap = document.createElement("span");
                handicap.className = "overviewPlayerHandicap";
                handicap.textContent = `HCP ${player.handicap}`;

                playerElement.append(handicap);
            }

            playerList.append(playerElement);
        });

        flightCard.append(title, playerList);
        overviewFlightList.append(flightCard);
    });
}

function renderEmptyState() {
    overviewFlightList.textContent =
        "Er is nog geen bevestigde flightindeling beschikbaar.";
}

function initialize() {
    loadOverviewData();

    if (flights.length === 0) {
        renderEmptyState();
        backButton.disabled = true;
        return;
    }

    renderSummary();
    renderFlights();
}

backButton.addEventListener("click", () => {
    window.location.href = "flights.html";
});

initialize();
