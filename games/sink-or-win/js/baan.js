const STORAGE_KEY = "sinkOrWinCourses";
const ROUND_STORAGE_KEY = "sinkOrWinRoundSetup";
const GAME_STORAGE_KEY = "sinkOrWinGame";
const PLAYER_STORAGE_KEY = "sinkOrWinSetup";

const defaultCourses = [
    {
        id: "hooge-rotterdamsche",
        name: "De Hooge Rotterdamsche",
        holes: [
            { number: 1, par: 4, strokeIndex: 8 },
            { number: 2, par: 4, strokeIndex: 10 },
            { number: 3, par: 4, strokeIndex: 14 },
            { number: 4, par: 3, strokeIndex: 18 },
            { number: 5, par: 5, strokeIndex: 12 },
            { number: 6, par: 4, strokeIndex: 16 },
            { number: 7, par: 4, strokeIndex: 2 },
            { number: 8, par: 4, strokeIndex: 4 },
            { number: 9, par: 4, strokeIndex: 6 },
            { number: 10, par: 5, strokeIndex: 9 },
            { number: 11, par: 3, strokeIndex: 17 },
            { number: 12, par: 5, strokeIndex: 1 },
            { number: 13, par: 3, strokeIndex: 15 },
            { number: 14, par: 4, strokeIndex: 3 },
            { number: 15, par: 3, strokeIndex: 11 },
            { number: 16, par: 4, strokeIndex: 5 },
            { number: 17, par: 4, strokeIndex: 13 },
            { number: 18, par: 4, strokeIndex: 7 }
        ]
    }
];

const courseList = document.querySelector("#courseList");
const roundSelection = document.querySelector("#roundSelection");
const roundOptions = document.querySelector("#roundOptions");
const continueButton = document.querySelector("#continueButton");

const existingGamePrompt = document.querySelector("#existingGamePrompt");
const resumeGameButton = document.querySelector("#resumeGameButton");
const startNewGameButton = document.querySelector("#startNewGameButton");

let courses = [];
let selectedCourse = null;
let selectedRound = null;

/* Bestaand spel controleren */

function checkExistingGame() {
    try {
        const savedGame = JSON.parse(
            localStorage.getItem(GAME_STORAGE_KEY)
        );

        const savedRound = JSON.parse(
            localStorage.getItem(ROUND_STORAGE_KEY)
        );

        if (!existingGamePrompt) {
            console.error("Popup-element #existingGamePrompt ontbreekt in baan.html.");
            return;
        }

        const hasUnfinishedGame =
            savedGame &&
            Array.isArray(savedGame.players) &&
            savedGame.players.length > 0 &&
            Array.isArray(savedGame.completedHoles) &&
            savedRound &&
            Array.isArray(savedRound.holes) &&
            savedRound.holes.length > 0 &&
            savedGame.completedHoles.length < savedRound.holes.length;

        console.log("Opgeslagen spel:", savedGame);
        console.log("Opgeslagen ronde:", savedRound);
        console.log("Onvoltooide ronde:", hasUnfinishedGame);

        existingGamePrompt.hidden = !hasUnfinishedGame;

    } catch (error) {
        console.error("Bestaand spel kon niet worden gecontroleerd.", error);
    }
}

function resumeGame() {
    window.location.href = "score.html";
}

function startNewGame() {
    localStorage.removeItem(GAME_STORAGE_KEY);
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    localStorage.removeItem(ROUND_STORAGE_KEY);

    existingGamePrompt.hidden = true;
}

/* Golfbanen laden */

function loadCourses() {
    try {
        const savedCourses = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        courses = Array.isArray(savedCourses) ? savedCourses : [];

        defaultCourses.forEach((defaultCourse) => {
            const exists = courses.some(
                (course) => course.id === defaultCourse.id
            );

            if (!exists) {
                courses.push(defaultCourse);
            }
        });

        saveCourses();
        renderCourses();

    } catch (error) {
        console.error("Golfbanen konden niet worden geladen.", error);
        courses = [...defaultCourses];
        saveCourses();
        renderCourses();
    }
}

function saveCourses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function renderCourses() {
    courseList.replaceChildren();

    courses.forEach((course) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "courseCard";

        if (selectedCourse?.id === course.id) {
            card.classList.add("isSelected");
        }

        const name = document.createElement("span");
        name.className = "courseCardName";
        name.textContent = course.name;

        const details = document.createElement("span");
        details.className = "courseCardDetails";
        details.textContent = `${course.holes.length} holes`;

        card.append(name, details);

        card.addEventListener("click", () => {
            selectCourse(course);
        });

        courseList.append(card);
    });
}

function selectCourse(course) {
    selectedCourse = course;
    selectedRound = null;

    renderCourses();
    renderRoundOptions();

    roundSelection.hidden = false;

    updateContinueButton();
}

/* Holekeuze */

function renderRoundOptions() {
    roundOptions.replaceChildren();

    const availableRounds = [
        {
            id: "frontNine",
            label: "Hole 1 t/m 9",
            start: 1,
            end: 9
        }
    ];

    if (selectedCourse.holes.length === 18) {
        availableRounds.push(
            {
                id: "backNine",
                label: "Hole 10 t/m 18",
                start: 10,
                end: 18
            },
            {
                id: "fullRound",
                label: "Hole 1 t/m 18",
                start: 1,
                end: 18
            }
        );
    }

    availableRounds.forEach((round) => {
        const option = document.createElement("label");
        option.className = "roundOption";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "selectedRound";
        radio.value = round.id;

        radio.addEventListener("change", () => {
            selectedRound = round;

            updateRoundOptions();
            updateContinueButton();
        });

        const text = document.createElement("span");
        text.textContent = round.label;

        option.append(radio, text);
        roundOptions.append(option);
    });
}

function updateRoundOptions() {
    document.querySelectorAll(".roundOption").forEach((option) => {
        const radio = option.querySelector("input");

        option.classList.toggle(
            "isSelected",
            radio.checked
        );
    });
}

function updateContinueButton() {
    const isReady = selectedCourse !== null && selectedRound !== null;

    continueButton.disabled = !isReady;

    continueButton.textContent = isReady
        ? "Verder →"
        : selectedCourse
            ? "Kies het aantal holes →"
            : "Kies eerst een baan →";
}

/* Doorgaan naar spelers */

function continueToPlayers() {
    if (!selectedCourse || !selectedRound) {
        return;
    }

    const selectedHoles = selectedCourse.holes.filter((hole) => {
        return hole.number >= selectedRound.start &&
            hole.number <= selectedRound.end;
    });

    const roundSetup = {
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        round: selectedRound.id,
        totalHoles: selectedHoles.length,
        holes: selectedHoles
    };

    // Voorkom dat een vorig spel wordt hervat.
    localStorage.removeItem(GAME_STORAGE_KEY);

    localStorage.setItem(
        ROUND_STORAGE_KEY,
        JSON.stringify(roundSetup)
    );

    window.location.href = "spelers.html";
}

/* Gebeurtenissen */

continueButton.addEventListener("click", continueToPlayers);
resumeGameButton.addEventListener("click", resumeGame);
startNewGameButton.addEventListener("click", startNewGame);

/* Pagina initialiseren */

loadCourses();
updateContinueButton();
checkExistingGame();