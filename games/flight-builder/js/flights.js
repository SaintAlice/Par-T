const PLAYERS_STORAGE_KEY = "flightBuilderPlayers";
const SETTINGS_STORAGE_KEY = "flightBuilderSettings";
const FLIGHTS_STORAGE_KEY = "flightBuilderFlights";

const flightSummary = document.getElementById("flightSummary");
const flightList = document.getElementById("flightList");
const validationMessage = document.getElementById("flightValidationMessage");

const backButton = document.getElementById("backButton");
const shuffleButton = document.getElementById("shuffleButton");
const confirmButton = document.getElementById("confirmButton");

let players = [];
let settings = {};
let flights = [];
let expandedFlights = new Set();

function loadData() {
    try {
        players = JSON.parse(
            sessionStorage.getItem(PLAYERS_STORAGE_KEY)
        ) || [];

        settings = JSON.parse(
            sessionStorage.getItem(SETTINGS_STORAGE_KEY)
        ) || {};
    } catch (error) {
        console.error("Flight Builder-gegevens konden niet worden geladen.", error);
        players = [];
        settings = {};
    }
}

function showValidation(message = "") {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
}

function getMaxPlayers() {
    return Number(settings.playersPerFlight || 4);
}

function shufflePlayers(list) {
    const shuffled = [...list];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function getFlightSizes(playerCount, flightCount) {
    const baseSize = Math.floor(playerCount / flightCount);
    const remainder = playerCount % flightCount;

    return Array.from(
        { length: flightCount },
        (_, index) => baseSize + (index < remainder ? 1 : 0)
    );
}

function getHandicap(player) {
    return Number(player.handicap);
}

function isValidFourPlayerFlight(flight) {
    if (flight.length !== 4 || settings.method === "random") {
        return true;
    }

    const totalHandicap = flight.reduce(
        (total, player) => total + getHandicap(player),
        0
    );

    return totalHandicap <= 110;
}

function createRandomFlights(flightSizes) {
    const shuffledPlayers = shufflePlayers(players);
    const result = [];
    let playerIndex = 0;

    flightSizes.forEach(size => {
        result.push(
            shuffledPlayers.slice(playerIndex, playerIndex + size)
        );

        playerIndex += size;
    });

    return result;
}

function createSimilarHandicapFlights(flightSizes) {
    const sortedPlayers = [...players].sort(
        (a, b) => getHandicap(a) - getHandicap(b)
    );

    const result = [];
    let playerIndex = 0;

    flightSizes.forEach(size => {
        result.push(
            sortedPlayers.slice(playerIndex, playerIndex + size)
        );

        playerIndex += size;
    });

    return result;
}

function createEqualHandicapFlights(flightSizes) {
    const sortedPlayers = [...players].sort(
        (a, b) => getHandicap(b) - getHandicap(a)
    );

    const result = flightSizes.map(() => []);

    sortedPlayers.forEach(player => {
        const availableFlights = result
            .map((flight, index) => ({
                flight,
                index,
                targetSize: flightSizes[index]
            }))
            .filter(item => item.flight.length < item.targetSize);

        availableFlights.sort((a, b) => {
            const averageA = a.flight.length
                ? a.flight.reduce(
                    (sum, p) => sum + getHandicap(p), 0
                ) / a.flight.length
                : 0;

            const averageB = b.flight.length
                ? b.flight.reduce(
                    (sum, p) => sum + getHandicap(p), 0
                ) / b.flight.length
                : 0;

            return averageA - averageB;
        });

        availableFlights[0].flight.push(player);
    });

    return result;
}

function createFlights() {
    showValidation();

    const maxPlayers = getMaxPlayers();

    if (players.length < 2) {
        showValidation("Er zijn minimaal twee spelers nodig.");
        return [];
    }

    const minimumFlightCount = Math.ceil(
        players.length / maxPlayers
    );

    const maximumFlightCount = Math.floor(
        players.length / 2
    );

    if (minimumFlightCount > maximumFlightCount) {
        showValidation(
            `Met ${players.length} spelers en maximaal ${maxPlayers} spelers per flight is een geldige indeling niet mogelijk. Kies maximaal ${Math.min(4, players.length - 1)} spelers per flight.`
        );

        return [];
    }

    for (
        let flightCount = minimumFlightCount;
        flightCount <= maximumFlightCount;
        flightCount++
    ) {
        const flightSizes = getFlightSizes(
            players.length,
            flightCount
        );

        if (
            flightSizes.some(
                size => size < 2 || size > maxPlayers
            )
        ) {
            continue;
        }

        let candidateFlights;

        if (settings.method === "random") {
            candidateFlights = createRandomFlights(flightSizes);
        } else if (settings.method === "equalHandicap") {
            candidateFlights = createEqualHandicapFlights(flightSizes);
        } else {
            candidateFlights = createSimilarHandicapFlights(flightSizes);
        }

        const validFlights = candidateFlights.every(
            flight =>
                flight.length >= 2 &&
                flight.length <= maxPlayers &&
                isValidFourPlayerFlight(flight)
        );

        if (validFlights) {
            return candidateFlights;
        }
    }

    showValidation(
        "Er kon geen geldige flightindeling worden gemaakt. Controleer de handicaps en instellingen."
    );

    return [];
}

function updateSummary() {
    flightSummary.textContent =
        `${players.length} spelers verdeeld over ${flights.length} flights`;
}

function createPlayerElement(player, flightIndex) {
    const playerElement = document.createElement("div");
    playerElement.className = "flightPlayer";

    const playerName = document.createElement("span");
    playerName.className = "flightPlayerName";
    playerName.textContent = player.name;

    playerElement.append(playerName);

    if (settings.method !== "random") {
        const handicap = document.createElement("span");
        handicap.className = "flightPlayerHandicap";
        handicap.textContent = `HCP ${player.handicap}`;

        playerElement.append(handicap);
    }

    const flightSelect = document.createElement("select");

    flightSelect.setAttribute(
        "aria-label",
        `Verplaats ${player.name} naar een andere flight`
    );

    flights.forEach((flight, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `Flight ${index + 1}`;
        option.selected = index === flightIndex;

        flightSelect.append(option);
    });

    flightSelect.addEventListener("change", () => {
        movePlayer(
            player.id,
            flightIndex,
            Number(flightSelect.value)
        );
    });

    playerElement.append(flightSelect);

    return playerElement;
}

function toggleFlight(index) {
    if (expandedFlights.has(index)) {
        expandedFlights.delete(index);
    } else {
        expandedFlights.add(index);
    }

    renderFlights();
}

function toggleAllFlights() {
    if (expandedFlights.size === flights.length) {
        expandedFlights.clear();
    } else {
        expandedFlights = new Set(
            flights.map((_, index) => index)
        );
    }

    renderFlights();
}

function renderToggleAllButton() {
    let toggleButton = document.getElementById("toggleAllFlightsButton");

    if (!toggleButton) {
        toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.id = "toggleAllFlightsButton";
        toggleButton.className = "toggleAllFlightsButton";

        flightList.before(toggleButton);

        toggleButton.addEventListener("click", toggleAllFlights);
    }

    const allExpanded = expandedFlights.size === flights.length;

    toggleButton.innerHTML = allExpanded
        ? '<span>Alles inklappen</span><span aria-hidden="true">⌃</span>'
        : '<span>Alles uitklappen</span><span aria-hidden="true">⌄</span>';
}

function renderFlights() {
    flightList.replaceChildren();
    updateSummary();
    renderToggleAllButton();

    flights.forEach((flight, index) => {
        const flightCard = document.createElement("article");
        flightCard.className = "flightCard";

        const isExpanded = expandedFlights.has(index);

        const header = document.createElement("button");
        header.type = "button";
        header.className = "flightHeader";
        header.setAttribute("aria-expanded", String(isExpanded));

        const title = document.createElement("span");
        title.className = "flightTitle";
        title.textContent = `Flight ${index + 1}`;

        const headerRight = document.createElement("span");
        headerRight.className = "flightHeaderRight";

        const playerCount = document.createElement("span");
        playerCount.textContent = `${flight.length} spelers`;

        const arrow = document.createElement("span");
        arrow.className = "flightArrow";
        arrow.textContent = "⌄";

        headerRight.append(playerCount, arrow);
        header.append(title, headerRight);

        header.addEventListener("click", () => {
            toggleFlight(index);
        });

        flightCard.append(header);

        if (isExpanded) {
            const playerList = document.createElement("div");
            playerList.className = "flightPlayerList";

            flight.forEach(player => {
                playerList.append(
                    createPlayerElement(player, index)
                );
            });

            flightCard.append(playerList);

            if (flight.length === 4) {
                const totalHandicap = flight.reduce(
                    (total, player) => total + getHandicap(player),
                    0
                );

                const handicapInfo = document.createElement("p");
                handicapInfo.textContent =
                    `Totale handicap: ${totalHandicap.toFixed(1)}`;

                flightCard.append(handicapInfo);
            }
        }

        flightList.append(flightCard);
    });
}

function movePlayer(playerId, fromIndex, toIndex) {
    if (fromIndex === toIndex) {
        return;
    }

    const player = flights[fromIndex].find(
        item => item.id === playerId
    );

    if (!player) {
        return;
    }

    const updatedFlights = flights.map(
        flight => [...flight]
    );

    updatedFlights[fromIndex] = updatedFlights[fromIndex].filter(
        item => item.id !== playerId
    );

    updatedFlights[toIndex].push(player);

    const sourceFlight = updatedFlights[fromIndex];
    const targetFlight = updatedFlights[toIndex];

    if (sourceFlight.length < 2) {
        showValidation(
            "Een flight moet minimaal twee spelers bevatten."
        );
        renderFlights();
        return;
    }

    if (targetFlight.length > getMaxPlayers()) {
        showValidation(
            "Deze flight heeft het maximale aantal spelers bereikt."
        );
        renderFlights();
        return;
    }

    if (!isValidFourPlayerFlight(targetFlight)) {
        showValidation(
            "De gezamenlijke handicap van een flight met vier spelers mag maximaal 110 zijn."
        );
        renderFlights();
        return;
    }

    flights = updatedFlights;
    expandedFlights.add(toIndex);

    showValidation();
    renderFlights();
}

function saveFlights() {
    sessionStorage.setItem(
        FLIGHTS_STORAGE_KEY,
        JSON.stringify(flights)
    );
}

function confirmFlights() {
    const invalidFlight = flights.some(
        flight =>
            flight.length < 2 ||
            flight.length > getMaxPlayers() ||
            !isValidFourPlayerFlight(flight)
    );

    if (flights.length === 0 || invalidFlight) {
        showValidation(
            "Controleer de flightindeling voordat je verdergaat."
        );
        return;
    }

    saveFlights();
    window.location.href = "overzicht.html";
}

function initialize() {
    loadData();

    flights = createFlights();
    expandedFlights.clear();

    if (flights.length === 0) {
        flightList.replaceChildren();
        updateSummary();
        confirmButton.disabled = true;
        return;
    }

    confirmButton.disabled = false;
    renderFlights();
}

backButton.addEventListener("click", () => {
    window.location.href = "spelers.html";
});

shuffleButton.addEventListener("click", () => {
    flights = createFlights();
    expandedFlights.clear();

    if (flights.length === 0) {
        flightList.replaceChildren();
        updateSummary();
        confirmButton.disabled = true;
        return;
    }

    confirmButton.disabled = false;
    renderFlights();
});

confirmButton.addEventListener("click", confirmFlights);

initialize();