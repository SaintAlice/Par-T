

const TEE_OPTIONS = [
    { id: "wit", name: "Wit", value: "Wit", color: "#FFFFFF" },
    { id: "geel", name: "Geel", value: "Geel", color: "#F5D547" },
    { id: "blauw", name: "Blauw", value: "Blauw", color: "#4388D5" },
    { id: "rood", name: "Rood", value: "Rood", color: "#E34F4F" },
    { id: "oranje", name: "Oranje", value: "Oranje", color: "#F39A42" }
];


let allPlayers =
    JSON.parse(localStorage.getItem("allPlayers")) || [];

let selectedTees = localStorage.getItem("tees") !== null
    ? JSON.parse(localStorage.getItem("tees"))
    : TEE_OPTIONS.map(tee => tee.value);

const playerInput = document.getElementById("playerInput");
const addPlayerButton = document.getElementById("addPlayerButton");
const playerList = document.getElementById("playerList");
const nextButton = document.getElementById("nextButton");

const generalTeesToggle = document.getElementById("generalTeesToggle");
const generalTeesContent = document.getElementById("generalTeesContent");
const generalTeesCount = document.getElementById("generalTeesCount");
const randomModeCheckbox = document.getElementById("randomMode");
const validationMessage = document.getElementById("gameValidationMessage");

init();

function init() {
    let updated = false;

    allPlayers.forEach(function(player) {
        if (!Array.isArray(player.availableTees)) {
            player.availableTees = TEE_OPTIONS.map(tee => tee.id);
            updated = true;
        }
    });

    if (updated) {
        savePlayers();
    }

    // Herstel de algemene selectie.
    document.querySelectorAll("[data-tee]").forEach(function(checkbox) {
        checkbox.checked = selectedTees.includes(checkbox.value);

        checkbox.addEventListener("change", function() {
            if (checkbox.checked) {
                if (!selectedTees.includes(checkbox.value)) {
                    selectedTees.push(checkbox.value);
                }
            } else {
                selectedTees = selectedTees.filter(function(tee) {
                    return tee !== checkbox.value;
                });
            }

            saveTees();
            renderGeneralTees();
            renderPlayers();
        });
    });

    
    generalTeesToggle.addEventListener("click", function() {
        const isOpen =
            generalTeesToggle.getAttribute("aria-expanded") === "true";

        generalTeesContent.hidden = isOpen;

        generalTeesToggle.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        generalTeesToggle.classList.toggle("isOpen", !isOpen);
    });

generalTeesContent.hidden = true;
generalTeesToggle.setAttribute("aria-expanded", "false");
generalTeesToggle.classList.remove("isOpen");

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

function getAvailableTees(player) {
    return selectedTees.filter(function(tee) {
        return player.availableTees.includes(tee.toLowerCase());
    });
}

function addPlayer() {
    const name = playerInput.value.trim();

    if (!name) return;

    const bestaatAl = allPlayers.some(function(player) {
        return player.name.toLowerCase() === name.toLowerCase();
    });

    if (bestaatAl) {
        alert("Deze speler bestaat al.");
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

function renderGeneralTees() {
    generalTeesCount.textContent =
        selectedTees.length + " van " + TEE_OPTIONS.length;

    updateNextButton();
}

function renderPlayers() {
    playerList.innerHTML = "";

    allPlayers.forEach(function(player) {
        const card = document.createElement("article");
        card.className = "player";

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
            "Tee-instellingen voor " + player.name
        );

        const arrow = document.createElement("span");
        arrow.className = "settingsArrow";
        arrow.textContent = "⌄";
        settingsButton.append(arrow);

        const removeButton = document.createElement("button");
        removeButton.className = "removeButton";
        removeButton.type = "button";
        removeButton.textContent = "🗑️";
        removeButton.setAttribute(
            "aria-label",
            "Verwijder " + player.name
        );

        removeButton.addEventListener("click", function() {
            removePlayer(player.id);
        });

        actions.append(settingsButton, removeButton);
        details.append(name, count);
        info.append(avatar, details);
        top.append(info, actions);

        const settings = document.createElement("div");
        settings.className = "teeSettings";
        settings.hidden = true;

        const settingsTitle = document.createElement("p");
        settingsTitle.className = "teeSettingsTitle";
        settingsTitle.textContent = "Welke tee's mag deze speler gebruiken?";

        const teeOptions = document.createElement("div");
        teeOptions.className = "teeOptions";

        TEE_OPTIONS.forEach(function(tee) {
            const label = document.createElement("label");
            label.className = "teeOption";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = player.availableTees.includes(tee.id);
            checkbox.setAttribute(
                "aria-label",
                tee.name + " voor " + player.name
            );

            const color = document.createElement("span");
            color.className = "teeColor";
            color.style.setProperty("--tee-color", tee.color);

            const check = document.createElement("span");
            check.className = "teeCheck";
            check.textContent = "✓";

            const teeName = document.createElement("span");
            teeName.className = "teeName";
            teeName.textContent = tee.name;

            label.append(checkbox, color, check, teeName);
            teeOptions.append(label);

            // Een globaal uitgeschakelde tee kan niet
            // persoonlijk worden ingeschakeld.
            checkbox.disabled = !selectedTees.includes(tee.value);

            checkbox.addEventListener("change", function() {
                if (checkbox.checked) {
                    if (!player.availableTees.includes(tee.id)) {
                        player.availableTees.push(tee.id);
                    }
                } else {
                    player.availableTees =
                        player.availableTees.filter(id => id !== tee.id);
                }

                savePlayers();
                updateCount();
                updateNextButton();
            });
        });

        settings.append(settingsTitle, teeOptions);

        settingsButton.addEventListener("click", function() {
            const open = settings.hidden;

            settings.hidden = !open;
            settingsButton.setAttribute("aria-expanded", String(open));
            settingsButton.classList.toggle("isOpen", open);
            card.classList.toggle("isExpanded", open);
        });

        function updateCount() {
            const available = getAvailableTees(player);

            count.textContent =
                available.length + " van " + TEE_OPTIONS.length +
                " tee's beschikbaar";

            card.classList.toggle(
                "playerHasNoTees",
                available.length === 0
            );
        }

        updateCount();

        card.append(top, settings);
        playerList.append(card);
    });

    updateNextButton();
}

function updateNextButton() {
    const spelersGenoeg = allPlayers.length >= 2;
    const teesGenoeg = selectedTees.length >= 2;

    const spelersZonderTee = allPlayers.filter(function(player) {
        return getAvailableTees(player).length === 0;
    });

    let message = "";

    if (!spelersGenoeg) {
        message = "Voeg minimaal twee spelers toe.";
    } else if (!teesGenoeg) {
        message = "Selecteer minimaal twee algemene tee's.";
    } else if (spelersZonderTee.length > 0) {
        message = "Geen beschikbare tee voor: " +
            spelersZonderTee.map(player => player.name).join(", ") + ".";
    }

    validationMessage.textContent = message;
    validationMessage.hidden = message === "";

    nextButton.disabled = message !== "";
}

function removePlayer(id) {
    allPlayers = allPlayers.filter(player => player.id !== id);

    savePlayers();
    renderPlayers();
}


function startGame() {
    updateNextButton();

    if (nextButton.disabled) return;

    // Sla de algemene tee-selectie op.
    saveTees();

    // Sla de spelers op voor de draaipagina.
    localStorage.setItem(
        "players",
        JSON.stringify(allPlayers.map(function(player) {
            return player.name;
        }))
    );

    // Sla de instelling voor willekeurige tee's op.
    sessionStorage.setItem(
        "randomMode",
        String(randomModeCheckbox.checked)
    );

    location.href = "draaien.html";
}
