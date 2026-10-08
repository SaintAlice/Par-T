const checkboxes =
    document.querySelectorAll(".teeCard input");

const startButton =
    document.getElementById("startButton");

const randomModeCheckbox =
    document.getElementById("randomMode");

checkboxes.forEach(function(checkbox) {

    checkbox.addEventListener("change", updateSelection);

});

function updateSelection() {

    const selectedTees = [];

    checkboxes.forEach(function(checkbox) {

        if (checkbox.checked) {
            selectedTees.push(checkbox.value);
        }

    });

    startButton.disabled = selectedTees.length < 2;

}

startButton.addEventListener("click", startGame);

function startGame() {

    const selectedTees = [];

    checkboxes.forEach(function(checkbox) {

        if (checkbox.checked) {
            selectedTees.push(checkbox.value);
        }

    });

    const randomMode = randomModeCheckbox.checked;

    localStorage.setItem(
        "tees",
        JSON.stringify(selectedTees)
    );

    sessionStorage.setItem(
        "randomMode",
        randomMode
    );

    location.href = "draaien.html";

}