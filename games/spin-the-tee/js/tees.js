const checkboxes =
    document.querySelectorAll(".teeCard input");

const startButton =
    document.getElementById("startButton");

const randomModeCheckbox =
    document.getElementById("randomMode");

checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener("change", updateSelection);
});

function getSelectedTees() {
    const selectedTees = [];

    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            selectedTees.push(checkbox.value);
        }
    });

    return selectedTees;
}

function updateSelection() {
    const selectedTees = getSelectedTees();

    startButton.disabled = selectedTees.length < 2;
}

startButton.addEventListener("click", startGame);

function startGame() {
    const selectedTees = getSelectedTees();

    if (selectedTees.length < 2) {
        alert("Selecteer minimaal 2 tee's.");
        return;
    }

    const allPlayers =
        JSON.parse(localStorage.getItem("allPlayers")) || [];

    const players =
        JSON.parse(localStorage.getItem("players")) || [];

    const spelersZonderTee = [];

    players.forEach(function(playerName) {
        const player = allPlayers.find(function(item) {
            return item.name.toLowerCase() ===
                playerName.toLowerCase();
        });

        // Bestaande spelers zonder instellingen mogen
        // voorlopig alle geselecteerde tee's gebruiken.
        const availableTees =
            player && Array.isArray(player.availableTees)
                ? player.availableTees
                : selectedTees.map(function(tee) {
                    return tee.toLowerCase();
                });

        const toegestaneTees = selectedTees.filter(function(tee) {
            return availableTees.includes(tee.toLowerCase());
        });

        if (toegestaneTees.length === 0) {
            spelersZonderTee.push(playerName);
        }
    });

    if (spelersZonderTee.length > 0) {
        alert(
            "De volgende spelers hebben geen beschikbare tee " +
            "binnen de groepsselectie:\n\n" +
            spelersZonderTee.join(", ") +
            "\n\nPas de tee-instellingen aan op de spelerspagina."
        );

        return;
    }

    localStorage.setItem(
        "tees",
        JSON.stringify(selectedTees)
    );

    sessionStorage.setItem(
        "randomMode",
        randomModeCheckbox.checked
    );

    location.href = "draaien.html";
}

updateSelection();