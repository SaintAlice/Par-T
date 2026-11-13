import { t, initLanguage } from "../../../../js/shared/i18n/i18n.js";

const TEE_OPTIONS = [
    { id: "wit", nameKey: "common.tees.white", value: "Wit", color: "#FFFFFF" },
    { id: "geel", nameKey: "common.tees.yellow", value: "Geel", color: "#F5D547" },
    { id: "blauw", nameKey: "common.tees.blue", value: "Blauw", color: "#4388D5" },
    { id: "rood", nameKey: "common.tees.red", value: "Rood", color: "#E34F4F" },
    { id: "oranje", nameKey: "common.tees.orange", value: "Oranje", color: "#F39A42" }
];

let allPlayers =
    JSON.parse(localStorage.getItem("allPlayers")) || [];

let selectedTees = localStorage.getItem("tees") !== null
    ? JSON.parse(localStorage.getItem("tees"))
    : TEE_OPTIONS
        .filter(tee => tee.value !== "Wit")
        .map(tee => tee.value);

const playerInput = document.getElementById("playerInput");
const addPlayerButton = document.getElementById("addPlayerButton");
const playerList = document.getElementById("playerList");
const nextButton = document.getElementById("nextButton");

const generalTeesToggle = document.getElementById("generalTeesToggle");
const generalTeesContent = document.getElementById("generalTeesContent");
const generalTeesCount = document.getElementById("generalTeesCount");
const teeDistributionOptions = document.querySelectorAll(
    'input[name="teeDistribution"]');
const validationMessage = document.getElementById("gameValidationMessage");

initLanguage();
init();

function init() {
    migratePlayerSettings();

    document.querySelectorAll("[data-tee]").forEach(function(checkbox) {
        checkbox.checked = selectedTees.includes(checkbox.value);

        checkbox.addEventListener("change", function() {
            updateGeneralTee(checkbox.value, checkbox.checked);
        });
    });

    generalTeesToggle.addEventListener("click", function() {
        const isOpen =
            generalTeesToggle.getAttribute("aria-expanded") === "true";

        setGeneralTeesOpen(!isOpen);
    });

    setGeneralTeesOpen(false);

    addPlayerButton.addEventListener("click", addPlayer);

    playerInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            addPlayer();
        }
    });

    nextButton.addEventListener("click", startGame);

    renderGeneralTees();
    renderPlayers();
}

function savePlayers() {
    localStorage.setItem("allPlayers", JSON.stringify(allPlayers));
}

function saveTees() {
    localStorage.setItem("tees", JSON.stringify(selectedTees));
}

function migratePlayerSettings() {
    let updated = false;

    allPlayers.forEach(function(player) {
        if (!Array.isArray(player.availableTees)) {
            player.availableTees = TEE_OPTIONS.map(tee => tee.id);
            updated = true;
        }

        const validTees = player.availableTees.filter(function(teeId) {
            return TEE_OPTIONS.some(tee => tee.id === teeId);
        });

        if (validTees.length !== player.availableTees.length) {
            player.availableTees = validTees;
            updated = true;
        }
    });

    if (updated) {
        savePlayers();
    }
}

function setGeneralTeesOpen(isOpen) {
    generalTeesContent.hidden = !isOpen;

    generalTeesToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    generalTeesToggle.classList.toggle("isOpen", isOpen);
}

function updateGeneralTee(teeValue, isChecked) {
    const teeId = teeValue.toLowerCase();

    if (isChecked) {
        if (!selectedTees.includes(teeValue)) {
            selectedTees.push(teeValue);
        }
    } else {
        selectedTees = selectedTees.filter(function(tee) {
            return tee !== teeValue;
        });

        allPlayers.forEach(function(player) {
            player.availableTees =
                player.availableTees.filter(function(tee) {
                    return tee !== teeId;
                });
        });

        savePlayers();
    }

    saveTees();

    document.querySelectorAll("[data-tee]").forEach(function(checkbox) {
        checkbox.checked = selectedTees.includes(checkbox.value);
    });

    renderGeneralTees();
    renderPlayers();
}

function renderGeneralTees() {
    updateNextButton();
}

function addPlayer() {
    const inputName = playerInput.value.trim();
    const name = inputName.charAt(0).toUpperCase() + inputName.slice(1);

    if (!name) {
        return;
    }

    const bestaatAl = allPlayers.some(function(player) {
        return player.name.toLowerCase() === name.toLowerCase();
    });

    if (bestaatAl) {
        alert(t("games.spinTheTee.players.errors.PlayerExcists"));
        return;
    }

    allPlayers.push({
        id: Date.now(),
        name: name,
        photo: "",
        availableTees: TEE_OPTIONS.map(tee => tee.id)
    });

    savePlayers();

    playerInput.value = "";

    renderPlayers();
}

function removePlayer(id) {
    allPlayers = allPlayers.filter(function(player) {
        return player.id !== id;
    });

    savePlayers();
    renderPlayers();
}

function getAvailableTees(player) {
    return selectedTees.filter(function(tee) {
        return player.availableTees.includes(tee.toLowerCase());
    });
}

function renderPlayers() {
    playerList.innerHTML = "";

    allPlayers.forEach(function(player) {
        const card = document.createElement("article");
        card.className = "player";
        card.dataset.playerId = player.id;

        const top = document.createElement("div");
        top.className = "playerTop";

        const info = document.createElement("div");
        info.className = "playerInfo";

        const avatar = document.createElement("div");
        avatar.className = "playerAvatar";
        avatar.textContent = player.name.charAt(0).toUpperCase();

        const details = document.createElement("div");
        details.className = "playerDetails";

        const name = document.createElement("div");
        name.className = "playerName";
        name.textContent = player.name;

        const count = document.createElement("div");
        count.className = "teeCount";

        const actions = document.createElement("div");
        actions.className = "playerActions";

        const settingsButton = document.createElement("button");
        settingsButton.className = "settingsButton";
        settingsButton.type = "button";
        settingsButton.setAttribute("aria-expanded", "false");
        settingsButton.setAttribute(
            "aria-label", 
            t("games.spinTheTee.players.settingsLabel") + " " + player.name
        );

        const arrow = document.createElement("span");
        arrow.className = "settingsArrow";
        arrow.setAttribute("aria-hidden", "true");

        settingsButton.append(arrow);

        const removeButton = document.createElement("button");
        removeButton.className = "removeButton";
        removeButton.type = "button";
        removeButton.textContent = "🗑️";
        removeButton.setAttribute(
            "aria-label",
            t("games.spinTheTee.players.removePlayer") + " " + player.name
        );

        removeButton.addEventListener("click", function() {
            removePlayer(player.id);
        });

        actions.append(settingsButton, removeButton);
        details.append(name, count);
        info.append(avatar, details);
        top.append(info, actions);

        const settings = createPlayerTeeSettings(player);

        settingsButton.addEventListener("click", function() {
            const isOpen = settings.hidden;

            settings.hidden = !isOpen;

            settingsButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            settingsButton.classList.toggle("isOpen", isOpen);
            card.classList.toggle("isExpanded", isOpen);
        });

        updatePlayerCount(player, count, card);

        card.append(top, settings);
        playerList.append(card);
    });

    updateNextButton();
}

function createPlayerTeeSettings(player) {
    const settings = document.createElement("div");
    settings.className = "teeSettings";
    settings.hidden = true;

    const settingsTitle = document.createElement("p");
    settingsTitle.className = "teeSettingsTitle";
    settingsTitle.textContent =
        t("games.spinTheTee.players.selectTeesFor", { player: player.name });

    const teeOptions = document.createElement("div");
    teeOptions.className = "teeOptions";

    TEE_OPTIONS
    .filter(tee => selectedTees.includes(tee.value))
    .forEach(function(tee) {
        const label = document.createElement("label");
        label.className = "teeOption";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.setAttribute(
            "aria-label",
            t(tee.nameKey) + " voor " + player.name
        );

        checkbox.checked =
            selectedTees.includes(tee.value) &&
            player.availableTees.includes(tee.id);

        checkbox.disabled = !selectedTees.includes(tee.value);

        const color = document.createElement("span");
        color.className = "teeColor";
        color.style.setProperty("--tee-color", tee.color);

        const check = document.createElement("span");
        check.className = "teeCheck";
        check.textContent = "✓";

        const teeName = document.createElement("span");
        teeName.className = "teeName";
        teeName.textContent = t(tee.nameKey);

        label.append(checkbox, color, check, teeName);
        teeOptions.append(label);

        checkbox.addEventListener("change", function() {
            updatePlayerTee(player, tee, checkbox.checked);
        });
    });

    settings.append(settingsTitle, teeOptions);

    return settings;
}

function updatePlayerTee(player, tee, isChecked) {
    if (isChecked) {
        if (!selectedTees.includes(tee.value)) {
            return;
        }

        if (!player.availableTees.includes(tee.id)) {
            player.availableTees.push(tee.id);
        }
    } else {
        player.availableTees =
            player.availableTees.filter(function(teeId) {
                return teeId !== tee.id;
            });
    }

    savePlayers();

    const card = document.querySelector(
        `.player[data-player-id="${player.id}"]`
    );

    if (card) {
        const count = card.querySelector(".teeCount");
        updatePlayerCount(player, count, card);
    }

    updateNextButton();
}

function updatePlayerCount(player, count, card) {
    const available = getAvailableTees(player);

    count.textContent = t("games.spinTheTee.players.availableTeesCount", {
        available: available.length,
        total: selectedTees.length
    });

    card.classList.toggle(
        "playerHasNoTees",
        available.length === 0
    );
}

function updateNextButton() {
    const spelersGenoeg = allPlayers.length >= 2;
    const teesGenoeg = selectedTees.length >= 2;

    const spelersZonderTee = allPlayers.filter(function(player) {
        return getAvailableTees(player).length === 0;
    });

    let message = "";

    if (!spelersGenoeg) {
        message = t("games.spinTheTee.errors.notEnoughPlayers");
    } else if (!teesGenoeg) {
        message = t("games.spinTheTee.errors.notEnoughTees");
    } else if (spelersZonderTee.length > 0) {
        message = t("games.spinTheTee.errors.playersWithoutTee") + " " +
             spelersZonderTee.map(player => player.name).join(", ") + ".";
    }

    validationMessage.textContent = message;
    validationMessage.hidden = message === "";

    nextButton.disabled = message !== "";
}

function startGame() {
    updateNextButton();

    if (nextButton.disabled) {
        return;
    }

    savePlayers();
    saveTees();

    localStorage.setItem(
        "players",
        JSON.stringify(
            allPlayers.map(function(player) {
                return player.name;
            })
        )
    );

    const selectedDistribution = document.querySelector(
        'input[name="teeDistribution"]:checked'
    );

    localStorage.setItem(
        "teeDistribution",
        selectedDistribution ? selectedDistribution.value : "random"
    );

    location.href = "draaien.html";
}
