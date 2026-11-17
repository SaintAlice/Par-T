import { t, initLanguage, getLanguage } from "../../../js/shared/i18n/i18n.js";

const MIN_PLAYERS = 2;
const STORAGE_KEY = "flightBuilderPlayers";
const SETTINGS_STORAGE_KEY = "flightBuilderSettings";

const playerInput = document.getElementById("playerInput");
const addPlayerButton = document.getElementById("addPlayerButton");
const playerList = document.getElementById("playerList");
const validationMessage = document.getElementById("gameValidationMessage");
const nextButton = document.getElementById("nextButton");

const settingsToggle = document.getElementById("gameSettingsToggle");
const settingsContent = document.getElementById("gameSettingsContent");
const settingsDescription = document.getElementById("selectedSettingsDescription");

let selectedMethod = "random";
let selectedPlayersPerFlight = "4";

let players = [];

function createPlayerId() {
    return crypto.randomUUID();
}

function loadPlayers() {
    try {
        const savedPlayers = JSON.parse(
            sessionStorage.getItem(STORAGE_KEY)
        );

        if (Array.isArray(savedPlayers)) {
            players = savedPlayers.map(player => ({
                id: player.id || createPlayerId(),
                name: player.name
                    ? player.name.charAt(0).toUpperCase() + player.name.slice(1)
                    : "",
                handicap: player.handicap ?? ""
            }));
        }
    } catch (error) {
        console.error("Spelers konden niet worden geladen.", error);
        players = [];
    }
}

function loadSettings() {
    try {
        const savedSettings = JSON.parse(
            sessionStorage.getItem(SETTINGS_STORAGE_KEY)
        );

        if (savedSettings) {
            selectedMethod = savedSettings.method || "random";
            selectedPlayersPerFlight = savedSettings.playersPerFlight || "4";
        }
    } catch (error) {
        console.error("Flight-instellingen konden niet worden geladen.", error);
    }

    document.querySelectorAll('input[name="distributionMethod"]').forEach(input => {
        input.checked = input.value === selectedMethod;
    });

    document.querySelectorAll('input[name="playersPerFlight"]').forEach(input => {
        input.checked = input.value === selectedPlayersPerFlight;
    });

    console.log("Huidige taal:", getLanguage());
    updateSettingsDescription();
}

function saveSettings() {
    sessionStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
            method: selectedMethod,
            playersPerFlight: selectedPlayersPerFlight
        })
    );
}

function updateSettingsDescription() {
    settingsDescription.textContent = t(
        "games.flightBuilder.playersPage.selectedSettings",
        {
            method: t(`games.flightBuilder.playersPage.methods.${selectedMethod}`),
            count: selectedPlayersPerFlight
        }
    );
}

function toggleSettings() {
    const isOpen = settingsToggle.getAttribute("aria-expanded") !== "true";

    settingsContent.hidden = !isOpen;
    settingsToggle.setAttribute("aria-expanded", String(isOpen));
    settingsToggle.classList.toggle("isOpen", isOpen);
}

function updateSettings() {
    selectedMethod = document.querySelector(
        'input[name="distributionMethod"]:checked'
    ).value;

    selectedPlayersPerFlight = document.querySelector(
        'input[name="playersPerFlight"]:checked'
    ).value;

    saveSettings();
    updateSettingsDescription();
    renderPlayers();
}

function savePlayers() {
    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(players)
    );
}

function showValidation(message) {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
}

function getFlightSizeValidation() {
    const maxPlayers = Number(selectedPlayersPerFlight);
    const playerCount = players.length;

    const minimumFlightCount = Math.ceil(
        playerCount / maxPlayers
    );

    const maximumFlightCount = Math.floor(
        playerCount / MIN_PLAYERS
    );

    if (minimumFlightCount <= maximumFlightCount) {
        return "";
    }

    let suggestedMaxPlayers = null;

    for (let size = maxPlayers + 1; size <= 4; size++) {
        const requiredFlights = Math.ceil(playerCount / size);
        const possibleFlights = Math.floor(playerCount / MIN_PLAYERS);

        if (requiredFlights <= possibleFlights) {
            suggestedMaxPlayers = size;
            break;
        }
    }

    if (suggestedMaxPlayers !== null) {
        return t("games.flightBuilder.errors.invalidDistribution", {
            playerCount,
            maxPlayers,
            suggestedMax: suggestedMaxPlayers
        });
    }

    return t("games.flightBuilder.errors.impossibleDistribution");
}

function requiresHandicap() {
    return selectedMethod !== "random"
        || selectedPlayersPerFlight === "4";
}

function updateNextButton() {
    let message = "";

    if (players.length < MIN_PLAYERS) {
        message = t("errors.minimumPlayers");
    } else {
        message = getFlightSizeValidation();
    }

    if (!message && requiresHandicap()) {
        const invalidHandicap = players.some(player => {
            if (player.handicap === "") {
                return true;
            }

            const handicap = Number(player.handicap);

            return !Number.isFinite(handicap)
                || handicap < 0
                || handicap > 54;
        });

        if (invalidHandicap) {
            message = t("errors.requiredHandicap");
        }
    }

    showValidation(message);
    nextButton.disabled = message !== "";
}

function addPlayer() {
    const inputName = playerInput.value.trim();

    if (!inputName) {
        showValidation(t("games.flightBuilder.errors.enterPlayerName"));
        playerInput.focus();
        return;
    }

    const formattedName =
        inputName.charAt(0).toUpperCase() + inputName.slice(1);

    const exists = players.some(
        player => player.name.toLowerCase() === formattedName.toLowerCase()
    );

    if (exists) {
        showValidation(t("errors.duplicatePlayer"));
        playerInput.focus();
        return;
    }

    players.push({
        id: createPlayerId(),
        name: formattedName,
        handicap: ""
    });

    playerInput.value = "";

    savePlayers();
    renderPlayers();
    playerInput.focus();
}

function removePlayer(id) {
    players = players.filter(player => player.id !== id);

    savePlayers();
    renderPlayers();
}

function renderPlayers() {
    playerList.replaceChildren();

    players.forEach(player => {
        const playerCard = document.createElement("article");
        playerCard.className = "player";
        playerCard.dataset.playerId = player.id;

        const playerTop = document.createElement("div");
        playerTop.className = "playerTop";

        const playerInfo = document.createElement("div");
        playerInfo.className = "playerInfo";

        const avatar = document.createElement("div");
        avatar.className = "playerAvatar";
        avatar.textContent = player.name.charAt(0).toUpperCase();

        const playerDetails = document.createElement("div");
        playerDetails.className = "playerDetails";

        const playerName = document.createElement("div");
        playerName.className = "playerName";
        playerName.textContent = player.name;

        playerDetails.append(playerName);
        playerInfo.append(avatar, playerDetails);

        const playerActions = document.createElement("div");
        playerActions.className = "playerActions";

        if (requiresHandicap()) {
            const handicapInput = document.createElement("input");
            handicapInput.className = "handicapField";
            handicapInput.type = "number";
            handicapInput.min = "0";
            handicapInput.max = "54";
            handicapInput.step = "0.1";
            handicapInput.placeholder = "HCP";
            handicapInput.value = player.handicap;
            handicapInput.setAttribute(
                "aria-label",
                t("games.flightBuilder.playersPage.handicap", {
                    player: player.name
                })
            );

            handicapInput.addEventListener("input", () => {
                player.handicap = handicapInput.value;
                savePlayers();
                updateNextButton();
            });

            playerActions.append(handicapInput);
        }

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "removeButton";
        removeButton.textContent = "×";
        removeButton.setAttribute(
            "aria-label",
            t("games.flightBuilder.playersPage.removePlayer", {
                player: player.name
            })
        );

        removeButton.addEventListener("click", () => {
            removePlayer(player.id);
        });

        playerActions.append(removeButton);

        playerTop.append(playerInfo, playerActions);
        playerCard.append(playerTop);
        playerList.append(playerCard);
    });

    updateNextButton();
}

function startFlightBuilder() {
    updateNextButton();

    if (nextButton.disabled) {
        return;
    }

    savePlayers();
    window.location.href = "flights.html";
}

addPlayerButton.addEventListener("click", addPlayer);

playerInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addPlayer();
    }
});

nextButton.addEventListener("click", startFlightBuilder);
settingsToggle.addEventListener("click", toggleSettings);

document.querySelectorAll(
    'input[name="distributionMethod"], input[name="playersPerFlight"]'
).forEach(input => {
    input.addEventListener("change", updateSettings);
});

initLanguage();
loadPlayers();
loadSettings();
renderPlayers();