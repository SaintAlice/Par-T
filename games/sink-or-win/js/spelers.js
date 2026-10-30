
/* PAR-T — Sink or Win spelerspagina */

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
const STORAGE_KEY = "sinkOrWinSetup";

const TEE_OPTIONS = [
    { id: "wit", name: "Wit", color: "#FFFFFF" },
    { id: "geel", name: "Geel", color: "#F5D547" },
    { id: "blauw", name: "Blauw", color: "#4388D5" },
    { id: "rood", name: "Rood", color: "#E34F4F" },
    { id: "oranje", name: "Oranje", color: "#F39A42" }
];

const playerInput = document.querySelector("#playerInput");
const addPlayerButton = document.querySelector("#addPlayerButton");
const playerList = document.querySelector("#playerList");
const nextButton = document.querySelector("#nextButton");

const settingsToggle = document.querySelector("#gameSettingsToggle");
const settingsContent = document.querySelector("#gameSettingsContent");
const modeDescription = document.querySelector("#selectedModeDescription");
const validationMessage = document.querySelector("#gameValidationMessage");

let selectedMode = "scratch";
let players = [];

/* Spelersgegevens laden */

function createPlayerId() {
    return crypto.randomUUID();
}

function loadSetup() {
    try {
        const savedSetup = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (savedSetup && Array.isArray(savedSetup.players)) {
            selectedMode = savedSetup.mode === "handicap"
                ? "handicap"
                : "scratch";

            players = savedSetup.players.map((player) => ({
                id: player.id || createPlayerId(),
                name: player.name
                    ? player.name.charAt(0).toUpperCase() + player.name.slice(1)
                    : "",
                handicap: player.handicap ?? "",
                gender: player.gender ?? "",
                tee: player.tee ?? "",
                settingsOpen: false
            }));
        }
    } catch (error) {
        console.error(
            "Sink or Win-instellingen konden niet worden geladen.",
            error
        );
    }
}

function saveSetup() {
    const setup = {
        mode: selectedMode,
        players: players.map((player) => ({
            id: player.id,
            name: player.name,
            handicap: selectedMode === "handicap"
                ? Number(player.handicap)
                : null,
            gender: selectedMode === "handicap"
                ? player.gender
                : null,
            tee: selectedMode === "handicap"
                ? player.tee
                : null,
            playingHandicap: player.playingHandicap ?? null,
            points: 0,
            steelCards: 0
        })),
        totalHoles: 9
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
}

/* Validatie */

function showValidation(message) {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
}

/* Spelmodus */

function updateMode() {
    const selectedRadio = document.querySelector(
        'input[name="gameMode"]:checked'
    );

    selectedMode = selectedRadio ? selectedRadio.value : "scratch";

    modeDescription.textContent = selectedMode === "handicap"
        ? "Spelen met handicap"
        : "Spelen zonder handicap";

    renderPlayers();
    updateNextButton();
}

/* Spelers toevoegen en verwijderen */

function addPlayer() {
    const inputName = playerInput.value.trim();
    const formattedName = inputName.charAt(0).toUpperCase() + inputName.slice(1);

    if (!inputName) {
        showValidation("Vul eerst een spelersnaam in.");
        playerInput.focus();
        return;
    }

    if (players.length >= MAX_PLAYERS) {
        showValidation("Je kunt maximaal vier spelers toevoegen.");
        return;
    }

    const exists = players.some(
        (player) => player.name.toLowerCase() === formattedName.toLowerCase()
    );

    if (exists) {
        showValidation("Deze speler is al toegevoegd.");
        playerInput.focus();
        return;
    }

    players.push({
        id: createPlayerId(),
        name: formattedName,
        handicap: "",
        gender: "",
        tee: "",
        settingsOpen: false
    });

    playerInput.value = "";

    showValidation("");
    renderPlayers();
    updateNextButton();
    playerInput.focus();
}

function removePlayer(id) {
    players = players.filter((player) => player.id !== id);

    renderPlayers();
    updateNextButton();
    showValidation("");
}

/* Persoonlijke instellingen */

function createGenderSettings(player) {
    const wrapper = document.createElement("div");
    wrapper.className = "playerSettings";

    const genderTitle = document.createElement("p");
    genderTitle.className = "playerSettingsTitle";
    genderTitle.textContent = "Geslacht";

    const genderOptions = document.createElement("div");
    genderOptions.className = "genderOptions";

    [
        { value: "heren", label: "Heren" },
        { value: "dames", label: "Dames" }
    ].forEach((option) => {
        const label = document.createElement("label");
        label.className = "genderOption";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `gender-${player.id}`;
        input.value = option.value;
        input.checked = player.gender === option.value;

        input.addEventListener("change", () => {
        player.gender = input.value;

        if (player.gender === "dames" && player.tee === "wit") {
            player.tee = "";
        }

        renderPlayers();
        updateNextButton();
        });

        const text = document.createElement("span");
        text.textContent = option.label;

        label.append(input, text);
        genderOptions.append(label);
    });

    const teeTitle = document.createElement("p");
    teeTitle.className = "playerSettingsTitle";
    teeTitle.textContent = "Speelkleur";

    const teeOptions = document.createElement("div");
    teeOptions.className = "teeOptions";

    TEE_OPTIONS
    .filter((tee) => player.gender !== "dames" || tee.id !== "wit")
    .forEach((tee) => {
        const label = document.createElement("label");
        label.className = "teeOption";

        if (player.tee === tee.id) {
            label.classList.add("selected");
        }

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `tee-${player.id}`;
        input.value = tee.id;
        input.checked = player.tee === tee.id;

        input.addEventListener("change", () => {
            player.tee = tee.id;
            renderPlayers();
            updateNextButton();
        });

        const color = document.createElement("span");
        color.className = "teeColor";
        color.style.backgroundColor = tee.color;

        const name = document.createElement("span");
        name.className = "teeName";
        name.textContent = tee.name;

        label.append(input, color, name);
        teeOptions.append(label);
    });

    wrapper.append(
        genderTitle,
        genderOptions,
        teeTitle,
        teeOptions
    );

    return wrapper;
}

/* Spelers weergeven */

function renderPlayers() {
    playerList.replaceChildren();

    players.forEach((player) => {
        if (player.gender === "dames" && player.tee === "wit") {
            player.tee = "";
        }
        const card = document.createElement("article");
        card.className = "player";
        card.dataset.playerId = player.id;

        if (selectedMode === "handicap") {
            card.classList.add("showHandicap");
        }

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

        details.append(name);

        if (selectedMode === "handicap") {
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
                `Handicap van ${player.name}`
            );

            handicapInput.addEventListener("input", () => {
                player.handicap = handicapInput.value;
                updateNextButton();
            });

            details.append(handicapInput);
        }

        info.append(avatar, details);

        const actions = document.createElement("div");
        actions.className = "playerActions";

        if (selectedMode === "handicap") {
            const settingsButton = document.createElement("button");
            settingsButton.type = "button";
            settingsButton.className = "settingsButton";

            const arrow = document.createElement("span");
            arrow.className = "settingsArrow";

            settingsButton.append(arrow);

            settingsButton.addEventListener("click", () => {
                player.settingsOpen = !player.settingsOpen;
                renderPlayers();
            });

            settingsButton.setAttribute(
                "aria-expanded",
                String(player.settingsOpen)
            );

            if (player.settingsOpen) {
                settingsButton.classList.add("isOpen");
            }

            actions.append(settingsButton);
        }

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "removeButton";
        removeButton.textContent = "×";
        removeButton.setAttribute(
            "aria-label",
            `Verwijder ${player.name}`
        );

        removeButton.addEventListener("click", () => {
            removePlayer(player.id);
        });

        actions.append(removeButton);

        top.append(info, actions);
        card.append(top);

        if (selectedMode === "handicap" && player.settingsOpen) {
            card.append(createGenderSettings(player));
        }

        playerList.append(card);
    });
}

/* Startknop en validatie */

function updateNextButton() {
    let message = "";

    if (players.length < MIN_PLAYERS) {
        message = "Voeg minimaal twee spelers toe.";
    } else if (selectedMode === "handicap") {
        const invalidHandicap = players.some((player) => {
            if (player.handicap === "") return true;

            const handicap = Number(player.handicap);

            return !Number.isFinite(handicap)
                || handicap < 0
                || handicap > 54;
        });

        const missingGender = players.some(
            (player) => !player.gender
        );

        const missingTee = players.some(
            (player) => !player.tee
        );

        if (invalidHandicap) {
            message = "Vul voor iedere speler een handicap tussen 0 en 54 in.";
        } else if (missingGender) {
            message = "Kies voor iedere speler een geslacht.";
        } else if (missingTee) {
            message = "Kies voor iedere speler een speelkleur.";
        }
    }

    showValidation(message);
    nextButton.disabled = message !== "";
}

function startGame() {
    updateNextButton();

    if (nextButton.disabled) return;

    try {
        const roundSetup = JSON.parse(
            localStorage.getItem("sinkOrWinRoundSetup")
        );

        if (!roundSetup) {
            throw new Error("Geen baan- of rondegegevens gevonden.");
        }

        if (selectedMode === "handicap") {
            players.forEach((player) => {
                const courseData = getCourseData(
                    player.gender,
                    player.tee,
                    roundSetup.round
                );

                player.playingHandicap = calculatePlayingHandicap(
                    player.handicap,
                    courseData,
                    roundSetup.totalHoles
                );
            });
        }

        saveSetup();
        window.location.href = "score.html";

    } catch (error) {
        console.error("Handicapberekening mislukt.", error);
        showValidation(
            error.message || "De handicap kon niet worden berekend."
        );
    }
}

/* Initialisatie */

addPlayerButton.addEventListener("click", addPlayer);

playerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addPlayer();
    }
});

document.querySelectorAll('input[name="gameMode"]').forEach((radio) => {
    radio.addEventListener("change", updateMode);
});

nextButton.addEventListener("click", startGame);

loadSetup();

settingsToggle.addEventListener("click", () => {
    const isOpen = settingsToggle.getAttribute("aria-expanded") !== "true";

    settingsContent.hidden = !isOpen;
    settingsToggle.setAttribute("aria-expanded", String(isOpen));
    settingsToggle.classList.toggle("isOpen", isOpen);
});

document.querySelectorAll('input[name="gameMode"]').forEach((radio) => {
    radio.checked = radio.value === selectedMode;
});

updateMode();
