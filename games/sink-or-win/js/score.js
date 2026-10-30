
const PLAYER_STORAGE_KEY = "sinkOrWinSetup";
const ROUND_STORAGE_KEY = "sinkOrWinRoundSetup";
const GAME_STORAGE_KEY = "sinkOrWinGame";

const holeTitle = document.querySelector("#holeTitle");
const holeDetails = document.querySelector("#holeDetails");
const scoreList = document.querySelector("#scoreList");
const finishHoleButton = document.querySelector("#finishHoleButton");
const validationMessage = document.querySelector("#scoreValidationMessage");

const scoreSection = document.querySelector(".scoreSection");
const challengeSection = document.querySelector(".challengeSection");
const holeResultSection = document.querySelector("#holeResultSection");
const holeResultList = document.querySelector("#holeResultList");
const holePointsList = document.querySelector("#holePointsList");
const challengeResultList = document.querySelector("#challengeResultList");
const birdieResultList = document.querySelector("#birdieResultList");
const confirmHoleButton = document.querySelector("#confirmHoleButton");
const editScoresButton = document.querySelector("#editScoresButton");

const challengeToggleButton = document.querySelector("#challengeToggleButton");
const challengeContent = document.querySelector("#challengeContent");
const challengeButton = document.querySelector("#challengeButton");
const challengeForm = document.querySelector("#challengeForm");
const challengerSelect = document.querySelector("#challengerSelect");
const opponentSelect = document.querySelector("#opponentSelect");
const saveChallengeButton = document.querySelector("#saveChallengeButton");
const cancelChallengeButton = document.querySelector("#cancelChallengeButton");
const challengeValidationMessage = document.querySelector("#challengeValidationMessage");

const challengeResultSection = document.querySelector(".challengeResultSection");

const standingsButton = document.querySelector("#standingsButton");
const standingsSection = document.querySelector("#standingsSection");
const standingsList = document.querySelector("#standingsList");
const newGameButton = document.querySelector("#newGameButton");
const holeResultHeading = document.querySelector("#holeResultHeading");

let setup = null;
let roundSetup = null;
let gameState = null;
let currentHoleIndex = 0;
let scores = {};
let pendingHoleResult = null;

/* Gegevens laden */

function loadGame() {
    try {
        setup = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY));
        roundSetup = JSON.parse(localStorage.getItem(ROUND_STORAGE_KEY));

        if (
            !setup ||
            !Array.isArray(setup.players) ||
            !roundSetup ||
            !Array.isArray(roundSetup.holes) ||
            roundSetup.holes.length === 0
        ) {
            throw new Error("Spelgegevens ontbreken.");
        }

        const savedGame = JSON.parse(localStorage.getItem(GAME_STORAGE_KEY));

        if (savedGame) {
            gameState = savedGame;

            if (
                !Array.isArray(gameState.players) ||
                !Array.isArray(gameState.completedHoles)
            ) {
                throw new Error("De opgeslagen spelgegevens zijn ongeldig.");
            }

            gameState.challengesByHole ??= {};
            gameState.currentScores ??= {};

            gameState.players.forEach((player) => {
                player.birdieCards ??= player.steelCards ?? 0;

                // Oude opgeslagen spellen krijgen een veilige standaard.
                player.birdieCardPenalties ??= [];
            });
        } else {
            gameState = {
                players: setup.players.map((player, index) => {
                    const playingHandicap = Number(player.playingHandicap ?? 0);

                    return {
                        id: player.id || String(index),
                        name: player.name,
                        points: 0,
                        birdieCards: 0,
                        birdieCardPenalties: [],
                        playingHandicap
                    };
                }),
                completedHoles: [],
                challengesByHole: {},
                currentScores: {}
            };

            saveGame();
        }

        currentHoleIndex = gameState.completedHoles.length;

        if (currentHoleIndex >= roundSetup.holes.length) {
            renderFinalResults();
            return;
        }

        renderHole();
        renderChallenges();

    } catch (error) {
        console.error("Spelgegevens konden niet worden geladen.", error);
        showValidation(error.message);
        finishHoleButton.disabled = true;
    }
}

function saveGame() {
    localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(gameState));
}

/* Handicapstrokes */

function getPlayersWithHandicapStrokes(hole) {
    return gameState.players.map((player) => {
        let handicapStrokes = 0;

        if (setup.mode === "handicap") {
            const playerHoles = distributeHandicapStrokes(
                player.playingHandicap,
                roundSetup.holes
            );

            const currentHole = playerHoles.find(
                (item) => item.number === hole.number
            );

            handicapStrokes = currentHole?.handicapStrokes ?? 0;
        }

        return {
            ...player,
            handicapStrokes
        };
    });
}

/* Hole tonen */

function renderHole() {
    const hole = roundSetup.holes[currentHoleIndex];

    if (!hole) {
        showValidation("Er zijn geen holes meer beschikbaar.");
        finishHoleButton.disabled = true;
        return;
    }

    holeTitle.textContent = `Hole ${hole.number}`;
    holeDetails.textContent = `Par ${hole.par} · SI ${hole.strokeIndex}`;

    scores = { ...(gameState.currentScores || {}) };
    pendingHoleResult = null;

    renderPlayers();
    updateFinishButton();
    showValidation("");
}

/* Spelers en scores */

function renderPlayers() {
    scoreList.replaceChildren();

    const hole = roundSetup.holes[currentHoleIndex];
    const players = getPlayersWithHandicapStrokes(hole);

    players.forEach((player) => {
        const card = document.createElement("article");
        card.className = "scorePlayer";

        const header = document.createElement("div");
        header.className = "scorePlayerHeader";

        const name = document.createElement("span");
        name.className = "scorePlayerName";
        name.textContent = player.name;

        header.append(name);

        if (setup.mode === "handicap") {
            const handicapLabel = document.createElement("span");
            handicapLabel.className = "scoreHandicap";
            handicapLabel.textContent = `+${player.handicapStrokes}`;
            header.append(handicapLabel);
        }

        if (player.birdieCards > 0) {
            for (let i = 0; i < player.birdieCards; i++) {
                const indicator = document.createElement("span");
                indicator.className = "birdieCardIndicator";
                indicator.textContent = "B";
                indicator.title = `${player.birdieCards} Birdiekaarten beschikbaar`;
                header.append(indicator);
            }
        }

        const inputRow = document.createElement("div");
        inputRow.className = "scoreInputRow";

        const label = document.createElement("span");
        label.className = "scoreInputLabel";
        label.textContent = "Bruto slagen";

        const controls = document.createElement("div");
        controls.className = "scoreControls";

        const minusButton = createScoreButton("−", () => {
            changeScore(player.id, -1);
        });

        const value = document.createElement("span");
        value.className = "scoreValue";
        value.textContent = scores[player.id] ?? "–";

        const plusButton = createScoreButton("+", () => {
            changeScore(player.id, 1);
        });

        controls.append(minusButton, value, plusButton);
        inputRow.append(label, controls);
        card.append(header, inputRow);
        scoreList.append(card);
    });
}

function createScoreButton(label, callback) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scoreControlButton";
    button.textContent = label;
    button.addEventListener("click", callback);

    return button;
}

function changeScore(playerId, amount) {
    const currentScore = scores[playerId] ?? 0;
    scores[playerId] = Math.max(1, currentScore + amount);

    gameState.currentScores = { ...scores };
    saveGame();

    renderPlayers();
    updateFinishButton();
}

function updateFinishButton() {
    const allScoresEntered = gameState.players.every((player) => {
        return Number.isInteger(scores[player.id]) && scores[player.id] > 0;
    });

    finishHoleButton.disabled = !allScoresEntered;
}

function showValidation(message) {
    validationMessage.textContent = message;
    validationMessage.hidden = !message;
}

function showChallengeValidation(message) {
    challengeValidationMessage.textContent = message;
    challengeValidationMessage.hidden = !message;
}

/* Uitdagingen */

function getCurrentHoleNumber() {
    return roundSetup.holes[currentHoleIndex].number;
}

function getCurrentChallenges() {
    if (!gameState.challengesByHole) {
        gameState.challengesByHole = {};
    }

    const holeNumber = getCurrentHoleNumber();

    if (!gameState.challengesByHole[holeNumber]) {
        gameState.challengesByHole[holeNumber] = [];
    }

    return gameState.challengesByHole[holeNumber];
}

function getReservedPoints(playerId, challenges) {
    return challenges.reduce((total, challenge) => {
        if (
            challenge.challengerId === playerId ||
            challenge.opponentId === playerId
        ) {
            return total + challenge.stake;
        }

        return total;
    }, 0);
}

function openChallengeForm() {
    challengeForm.hidden = false;
    challengeButton.hidden = true;

    showChallengeValidation("");
    renderChallengerOptions();
}

function closeChallengeForm() {
    challengeForm.hidden = true;
    challengeButton.hidden = false;

    challengerSelect.value = "";
    opponentSelect.replaceChildren();
    opponentSelect.disabled = true;

    showChallengeValidation("");
}

function renderChallengerOptions() {
    challengerSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Kies een speler";
    challengerSelect.append(placeholder);

    gameState.players.forEach((player) => {
        if (player.birdieCards <= 0) return;

        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = `${player.name} (${player.birdieCards} Birdiekaarten)`;

        challengerSelect.append(option);
    });
}

function renderOpponentOptions() {
    opponentSelect.replaceChildren();

    const challengerId = challengerSelect.value;
    const stake = Number(
        document.querySelector('input[name="challengeStake"]:checked').value
    );

    if (!challengerId) {
        opponentSelect.disabled = true;

        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Kies eerst een uitdager";
        opponentSelect.append(option);
        return;
    }

    opponentSelect.disabled = false;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Kies een tegenstander";
    opponentSelect.append(placeholder);

    const challenges = getCurrentChallenges();

    const alreadyChallenged = challenges
        .filter((challenge) => challenge.challengerId === challengerId)
        .map((challenge) => challenge.opponentId);

    gameState.players.forEach((player) => {
        if (player.id === challengerId) return;
        if (alreadyChallenged.includes(player.id)) return;

        const reservedPoints = getReservedPoints(player.id, challenges);

        if (player.points - reservedPoints < stake) return;

        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = player.name;

        opponentSelect.append(option);
    });
}

function saveChallenge() {
    const challengerId = challengerSelect.value;
    const opponentId = opponentSelect.value;

    const stake = Number(
        document.querySelector('input[name="challengeStake"]:checked').value
    );

    const challenges = getCurrentChallenges();

    const challenger = gameState.players.find(
        (player) => player.id === challengerId
    );

    const opponent = gameState.players.find(
        (player) => player.id === opponentId
    );

    if (!challenger || !opponent) {
        showChallengeValidation("Kies een uitdager en een tegenstander.");
        return;
    }

    if (challenger.birdieCards <= 0) {
        showChallengeValidation("Deze speler heeft geen Birdiekaarten meer beschikbaar.");
        return;
    }

    const challengerReserved = getReservedPoints(challengerId, challenges);
    const opponentReserved = getReservedPoints(opponentId, challenges);

    if (challenger.points - challengerReserved < stake) {
        showChallengeValidation("De uitdager heeft onvoldoende punten beschikbaar.");
        return;
    }

    if (opponent.points - opponentReserved < stake) {
        showChallengeValidation("De tegenstander heeft onvoldoende punten beschikbaar.");
        return;
    }

    const alreadyChallenged = challenges.some(
        (challenge) =>
            challenge.challengerId === challengerId &&
            challenge.opponentId === opponentId
    );

    if (alreadyChallenged) {
        showChallengeValidation("Je hebt deze speler al uitgedaagd op deze hole.");
        return;
    }

    challenges.push({
        challengerId,
        opponentId,
        stake
    });

    // Verbruik de oudste Birdiekaart eerst.
    challenger.birdieCards--;

    challenger.birdieCardPenalties ??= [];
    challenger.birdieCardPenalties.shift();

    saveGame();
    renderPlayers();
    renderChallenges();
    closeChallengeForm();
}

function renderChallenges() {
    const challengeList = document.querySelector("#challengeList");
    const challenges = getCurrentChallenges();

    challengeList.replaceChildren();

    if (challenges.length === 0) {
        const message = document.createElement("p");
        message.className = "emptyChallenges";
        message.textContent = "Er zijn nog geen uitdagingen voor deze hole.";
        challengeList.append(message);
        return;
    }

    challenges.forEach((challenge) => {
        const challenger = gameState.players.find(
            (player) => player.id === challenge.challengerId
        );

        const opponent = gameState.players.find(
            (player) => player.id === challenge.opponentId
        );

        if (!challenger || !opponent) return;

        const card = document.createElement("div");
        card.className = "challengeCard";

        const details = document.createElement("span");
        details.className = "challengeDetails";

        const names = document.createElement("span");
        names.className = "challengePlayerNames";
        names.textContent = `${challenger.name} daagt ${opponent.name} uit`;

        const stake = document.createElement("span");
        stake.className = "challengeStake";
        stake.textContent = `${challenge.stake} punten`;

        details.append(names);
        card.append(details, stake);
        challengeList.append(card);
    });
}

/* Scorecontrole */

function calculateHoleResults() {
    const hole = roundSetup.holes[currentHoleIndex];
    const players = getPlayersWithHandicapStrokes(hole);

    const results = players.map((player) => {
        const grossScore = scores[player.id];
        const netScore = grossScore - player.handicapStrokes;

        const comparisonScore = setup.mode === "handicap"
            ? netScore
            : grossScore;

        return {
            id: player.id,
            name: player.name,
            grossScore,
            handicapStrokes: player.handicapStrokes,
            netScore,
            comparisonScore,
            points: 0,
            challengePoints: 0,
            earnsBirdieCard: comparisonScore <= hole.par - 1
        };
    });

    const bestScore = Math.min(
        ...results.map((player) => player.comparisonScore)
    );

    const winners = results.filter(
        (player) => player.comparisonScore === bestScore
    );

    if (winners.length === 1) {
        winners[0].points = 3;
    } else {
        winners.forEach((player) => {
            player.points = 1;
        });
    }

    const challenges = [...getCurrentChallenges()];

    challenges.forEach((challenge) => {
        const challenger = results.find(
            (player) => player.id === challenge.challengerId
        );

        const opponent = results.find(
            (player) => player.id === challenge.opponentId
        );

        if (challenger.comparisonScore < opponent.comparisonScore) {
            challenger.challengePoints += challenge.stake;
            opponent.challengePoints -= challenge.stake;
        } else if (challenger.comparisonScore > opponent.comparisonScore) {
            opponent.challengePoints += challenge.stake;
            challenger.challengePoints -= challenge.stake;
        }
    });

    results.forEach((player) => {
        player.totalPoints = player.points + player.challengePoints;
    });

    return {
        holeNumber: hole.number,
        par: hole.par,
        results,
        challenges
    };
}

function reviewHole() {
    const allScoresEntered = gameState.players.every((player) => {
        return Number.isInteger(scores[player.id]) && scores[player.id] > 0;
    });

    if (!allScoresEntered) {
        showValidation("Vul eerst alle scores in.");
        return;
    }

    pendingHoleResult = calculateHoleResults();

    renderHoleResults(pendingHoleResult);

    showValidation("");

    scoreSection.hidden = true;
    challengeSection.hidden = true;
    holeResultSection.hidden = false;
    finishHoleButton.hidden = true;
}

function renderHoleResults(result) {
    holeResultSection.classList.remove("isFinalResult");
    holeResultHeading.textContent = "Resultaat hole";
    holeResultList.replaceChildren();
    holePointsList.replaceChildren();
    challengeResultList.replaceChildren();
    birdieResultList.replaceChildren();

    result.results.forEach((player) => {
        const row = document.createElement("div");
        row.className = "resultPlayer";

        const name = document.createElement("span");
        name.textContent = player.name;

        const score = document.createElement("span");
        score.className = "resultScore";
        score.textContent = setup.mode === "handicap"
            ? `${player.netScore}`
            : `${player.grossScore}`;

        row.append(name, score);
        holeResultList.append(row);

        const pointsRow = document.createElement("div");
        pointsRow.className = "resultPoints";

        const pointsName = document.createElement("span");
        pointsName.textContent = player.name;

        const pointsValue = document.createElement("strong");
        const sign = player.totalPoints > 0 ? "+" : "";
        pointsValue.textContent = `${sign}${player.totalPoints} punten`;

        pointsRow.append(pointsName, pointsValue);
        holePointsList.append(pointsRow);
    });

    renderChallengeResults(result);
    renderBirdieResults(result);
}

function renderChallengeResults(result) {
    challengeResultList.replaceChildren();

    challengeResultSection.hidden = result.challenges.length === 0;

    if (result.challenges.length === 0) return;

    result.challenges.forEach((challenge) => {
        const challenger = result.results.find(
            (player) => player.id === challenge.challengerId
        );

        const opponent = result.results.find(
            (player) => player.id === challenge.opponentId
        );

        if (!challenger || !opponent) return;

        const row = document.createElement("div");
        row.className = "challengeResult";

        const details = document.createElement("span");
        details.textContent = `${challenger.name} tegen ${opponent.name}`;

        const outcome = document.createElement("strong");

        if (challenger.comparisonScore < opponent.comparisonScore) {
            outcome.textContent = `${challenger.name} wint ${challenge.stake} punten`;
        } else if (challenger.comparisonScore > opponent.comparisonScore) {
            outcome.textContent = `${opponent.name} wint ${challenge.stake} punten`;
        } else {
            outcome.textContent = "Gelijkspel · geen punten";
        }

        row.append(details, outcome);
        challengeResultList.append(row);
    });
}

function renderBirdieResults(result) {
    birdieResultList.replaceChildren();

    const winners = result.results.filter(
        (player) => player.earnsBirdieCard
    );

    birdieResultList.hidden = winners.length === 0;

    winners.forEach((player) => {
        const message = document.createElement("div");
        message.className = "birdieResult";

        const name = document.createElement("span");
        name.textContent = `${player.name} verdient een Birdiekaart`;

        const card = document.createElement("span");
        card.className = "birdieResultCards";
        card.textContent = "B";

        message.append(name, card);
        birdieResultList.append(message);
    });
}

/* Hole bevestigen en doorgaan */

function confirmHole() {
    if (!pendingHoleResult) return;

    const result = pendingHoleResult;

    result.results.forEach((playerResult) => {
        const player = gameState.players.find(
            (item) => item.id === playerResult.id
        );

        player.points += playerResult.totalPoints;

        if (playerResult.earnsBirdieCard) {
            player.birdieCards++;

            // Alleen kaarten van hole 1 t/m 8 krijgen een mogelijke eindstraf.
            player.birdieCardPenalties ??= [];
            player.birdieCardPenalties.push(result.holeNumber <= 8);
        }
    });

    gameState.completedHoles.push(result);
    gameState.currentScores = {};
    delete gameState.challengesByHole[result.holeNumber];

    saveGame();

    currentHoleIndex++;
    pendingHoleResult = null;

    if (currentHoleIndex >= roundSetup.holes.length) {
        holeResultSection.hidden = true;
        scoreSection.hidden = true;
        challengeSection.hidden = true;
        finishHoleButton.hidden = true;

        renderFinalResults();
        return;
    }

    scoreSection.hidden = false;
    challengeSection.hidden = false;
    holeResultSection.hidden = true;
    finishHoleButton.hidden = false;

    renderHole();
    renderChallenges();
}

function editScores() {
    pendingHoleResult = null;

    holeResultSection.hidden = true;
    scoreSection.hidden = false;
    challengeSection.hidden = false;
    finishHoleButton.hidden = false;
}

/* Eindresultaat */

function renderFinalResults() {
    holeResultSection.hidden = false;
    holeResultSection.classList.add("isFinalResult");
    holeResultHeading.textContent = "Eindresultaat";

    scoreSection.hidden = true;
    challengeSection.hidden = true;
    standingsSection.hidden = true;

    document.querySelector(".scoreActions").hidden = true;
    document.querySelector(".scorePage .pageFooter").hidden = true;

    holeResultList.replaceChildren();
    holePointsList.replaceChildren();
    challengeResultList.replaceChildren();
    birdieResultList.replaceChildren();

    holeTitle.textContent = "Ronde afgerond";
    holeDetails.textContent = "Dit is de definitieve eindstand.";

    const sortedPlayers = gameState.players
        .map((player) => {
            const penaltyCards = (player.birdieCardPenalties || [])
                .filter(Boolean).length;

            return {
                ...player,
                penaltyCards,
                finalPoints: player.points - penaltyCards
            };
        })
        .sort((a, b) => b.finalPoints - a.finalPoints);

    sortedPlayers.forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "resultPlayer";

        const name = document.createElement("span");
        name.textContent = `${index + 1}. ${player.name}`;

        const points = document.createElement("strong");
        points.textContent = `${player.finalPoints} punten`;

        row.append(name, points);
        holeResultList.append(row);

        if (player.penaltyCards > 0) {
            const penalty = document.createElement("div");
            penalty.className = "resultPoints";

            const description = document.createElement("span");
            description.textContent =
                `${player.penaltyCards} overgebleven Birdiekaarten`;

            const deduction = document.createElement("strong");
            deduction.textContent = `−${player.penaltyCards} punt`;

            penalty.append(description, deduction);
            holePointsList.append(penalty);
        }
    });

    holePointsList.parentElement.hidden =
        !sortedPlayers.some((player) => player.penaltyCards > 0);

    holePointsList.parentElement.querySelector("h3").textContent =
        "Aftrek Birdiekaarten";

    challengeResultSection.hidden = true;
    birdieResultList.hidden = true;

    confirmHoleButton.hidden = true;
    editScoresButton.hidden = true;
    newGameButton.hidden = false;
}

/* Tussenstand */

function renderStandings() {
    standingsList.replaceChildren();

    const sortedPlayers = [...gameState.players].sort(
        (a, b) => b.points - a.points
    );

    sortedPlayers.forEach((player, index) => {
        const row = document.createElement("div");
        row.className = "standingPlayer";

        const info = document.createElement("div");
        info.className = "standingPlayerInfo";

        const name = document.createElement("span");
        name.className = "standingPlayerName";
        name.textContent = `${index + 1}. ${player.name}`;

        const cards = document.createElement("div");
        cards.className = "standingBirdieCards";

        for (let i = 0; i < player.birdieCards; i++) {
            const card = document.createElement("span");
            card.className = "standingBirdieCard";
            card.textContent = "B";
            cards.append(card);
        }

        info.append(name, cards);

        const points = document.createElement("span");
        points.className = "standingPoints";
        points.textContent = `${player.points} punten`;

        row.append(info, points);
        standingsList.append(row);
    });
}

function toggleStandings() {
    const isOpening = standingsSection.hidden;

    if (isOpening) {
        renderStandings();
    }

    standingsSection.hidden = !isOpening;
    standingsButton.textContent = isOpening
        ? "Tussenstand sluiten"
        : "Tussenstand bekijken";
}

/* Gebeurtenissen */

finishHoleButton.addEventListener("click", reviewHole);
confirmHoleButton.addEventListener("click", confirmHole);
editScoresButton.addEventListener("click", editScores);
standingsButton.addEventListener("click", toggleStandings);

newGameButton.addEventListener("click", () => {
    localStorage.removeItem(GAME_STORAGE_KEY);
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    localStorage.removeItem(ROUND_STORAGE_KEY);

    window.location.href = "baan.html";
});

challengeToggleButton.addEventListener("click", () => {
    const isOpen = challengeToggleButton.getAttribute("aria-expanded") !== "true";

    challengeContent.hidden = !isOpen;
    challengeToggleButton.setAttribute("aria-expanded", String(isOpen));
    challengeToggleButton.classList.toggle("isOpen", isOpen);
});

challengeButton.addEventListener("click", openChallengeForm);
cancelChallengeButton.addEventListener("click", closeChallengeForm);

challengerSelect.addEventListener("change", () => {
    showChallengeValidation("");
    renderOpponentOptions();
});

opponentSelect.addEventListener("change", () => {
    showChallengeValidation("");
});

document.querySelectorAll('input[name="challengeStake"]').forEach((radio) => {
    radio.addEventListener("change", renderOpponentOptions);
});

saveChallengeButton.addEventListener("click", saveChallenge);

/* Spel starten */

loadGame();
