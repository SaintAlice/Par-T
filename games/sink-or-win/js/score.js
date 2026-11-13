import { t, initLanguage } from "../../../js/shared/i18n/i18n.js";

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
const challengerOptions = document.querySelector("#challengerOptions");
const opponentOptions = document.querySelector("#opponentOptions");

const saveChallengeButton = document.querySelector("#saveChallengeButton");
const cancelChallengeButton = document.querySelector("#cancelChallengeButton");
const challengeValidationMessage = document.querySelector("#challengeValidationMessage");
const challengeStakeValue = document.querySelector("#challengeStakeValue");
const decreaseChallengeStake = document.querySelector("#decreaseChallengeStake");
const increaseChallengeStake = document.querySelector("#increaseChallengeStake");
const challengeStakeGroup = document.querySelector("#challengeStakeGroup");
const challengeFormActions = document.querySelector("#challengeFormActions");

const challengeResultSection = document.querySelector(".challengeResultSection");

const standingsButton = document.querySelector("#standingsButton");
const standingsSection = document.querySelector("#standingsSection");
const standingsList = document.querySelector("#standingsList");
const holeResultNewGameButton = document.querySelector("#holeResultNewGameButton");
const holeResultHeading = document.querySelector("#holeResultHeading");

// Definitieve resultatenpagina
const finalResultsSection = document.querySelector("#finalResultsSection");
const finalStandingsList = document.querySelector("#finalStandingsList");
const finalPointsChart = document.querySelector("#finalPointsChart");
const finalEventsList = document.querySelector("#finalEventsList");
const finalScorecard = document.querySelector("#finalScorecard");

let setup = null;
let roundSetup = null;
let gameState = null;
let currentHoleIndex = 0;
let scores = {};
let pendingHoleResult = null;
let selectedChallengerId = "";
let selectedOpponentId = "";
let challengeStake = 1;

initLanguage();

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
            throw new Error(t("games.sinkOrWin.errors.missingGameData"));
        }

        const savedGame = JSON.parse(localStorage.getItem(GAME_STORAGE_KEY));

        if (savedGame) {
            gameState = savedGame;

            if (
                !Array.isArray(gameState.players) ||
                !Array.isArray(gameState.completedHoles)
            ) {
                throw new Error(t("games.sinkOrWin.errors.invalidSavedGame"));
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
        showValidation(t("games.sinkOrWin.errors.noHolesAvailable"));
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
                indicator.title = t("games.sinkOrWin.score.birdieCardsAvailable", {
                    count: player.birdieCards
                });
                header.append(indicator);
            }
        }

        const inputRow = document.createElement("div");
        inputRow.className = "scoreInputRow";

        const label = document.createElement("span");
        label.className = "scoreInputLabel";
        label.textContent = t("games.sinkOrWin.score.grossStrokesLabel");

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
    const hole = roundSetup.holes[currentHoleIndex];

    if (scores[playerId] === undefined) {
        scores[playerId] = amount > 0
            ? hole.par
            : hole.par - 1;
    } else {
        scores[playerId] = Math.max(1, scores[playerId] + amount);
    }

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

    selectedChallengerId = "";
    selectedOpponentId = "";

    challengeStakeGroup.hidden = true;
    challengeFormActions.hidden = true;

    challengeStake = 1;
    challengeStakeValue.textContent = challengeStake;

    showChallengeValidation("");
    renderChallengerOptions();
    renderOpponentOptions();
}

function closeChallengeForm() {
    challengeForm.hidden = true;
    challengeButton.hidden = false;

    selectedChallengerId = "";
    selectedOpponentId = "";

    challengeStake = 1;
    challengeStakeValue.textContent = challengeStake;

    showChallengeValidation("");
    challengeStakeGroup.hidden = true;
    challengeFormActions.hidden = true;
}

function renderChallengerOptions() {
    challengerOptions.replaceChildren();

    gameState.players.forEach((player) => {
        if (player.birdieCards <= 0) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "playerOptionButton";
        button.textContent = player.name;

        if (player.id === selectedChallengerId) {
            button.classList.add("isSelected");
        }

        button.addEventListener("click", () => {
            selectedChallengerId = player.id;
            selectedOpponentId = "";

            challengeStakeGroup.hidden = true;
            challengeFormActions.hidden = true;

            showChallengeValidation("");
            renderChallengerOptions();
            renderOpponentOptions();
        });

        challengerOptions.append(button);
    });

    if (challengerOptions.children.length === 0) {
        challengerOptions.textContent = t("games.sinkOrWin.score.noAvailableBirdieCards");
    }
}

function renderOpponentOptions() {
    opponentOptions.replaceChildren();

    if (!selectedChallengerId) {
        const hint = document.createElement("p");
        hint.className = "optionHint";
        hint.textContent = t("games.sinkOrWin.score.selectChallenger");
        opponentOptions.append(hint);
        return;
    }

    const stake = challengeStake;
    const validStake = Number.isInteger(stake) && stake >= 1;
    const challenges = getCurrentChallenges();

    gameState.players.forEach((player) => {
        if (player.id === selectedChallengerId) return;

        const alreadyChallenged = challenges.some(
            (challenge) =>
                challenge.challengerId === selectedChallengerId &&
                challenge.opponentId === player.id
        );

        if (alreadyChallenged) return;

        const reservedPoints = getReservedPoints(player.id, challenges);
        const availablePoints = player.points - reservedPoints;
        const hasEnoughPoints = validStake && availablePoints >= stake;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "playerOptionButton";
        button.textContent = player.name;

        if (!hasEnoughPoints) {
            button.disabled = true;
            button.classList.add("isUnavailable");
        }

        if (player.id === selectedOpponentId) {
            button.classList.add("isSelected");
        }

        button.addEventListener("click", () => {
            if (!hasEnoughPoints) return;

            selectedOpponentId = player.id;

            challengeStakeGroup.hidden = false;
            challengeFormActions.hidden = false;

            showChallengeValidation("");
            renderOpponentOptions();
        });

        opponentOptions.append(button);
    });

    if (opponentOptions.children.length === 0) {
        opponentOptions.textContent = t("games.sinkOrWin.score.noAvailableOpponents");
    }
}

function saveChallenge() {
    const challengerId = selectedChallengerId;
    const opponentId = selectedOpponentId;
    const stake = challengeStake;

    const challenges = getCurrentChallenges();

    const challenger = gameState.players.find(
        (player) => player.id === challengerId
    );

    const opponent = gameState.players.find(
        (player) => player.id === opponentId
    );

    if (!challenger || !opponent) {
        showChallengeValidation(t("games.sinkOrWin.score.selectChallengerAndOpponent"));
        return;
    }

    if (!Number.isInteger(stake) || stake < 1) {
        showChallengeValidation(t("games.sinkOrWin.score.enterValidPoints"));
        return;
    }

    if (challenger.birdieCards <= 0) {
        showChallengeValidation(t("games.sinkOrWin.score.noBirdieCardsLeft"));
        return;
    }

    const challengerReserved = getReservedPoints(challengerId, challenges);
    const opponentReserved = getReservedPoints(opponentId, challenges);

    if (challenger.points - challengerReserved < stake) {
        showChallengeValidation(t("games.sinkOrWin.score.challengerInsufficientPoints"));
        return;
    }

    if (opponent.points - opponentReserved < stake) {
        showChallengeValidation(t("games.sinkOrWin.score.challengerInsufficientPoints"));
        return;
    }

    const alreadyChallenged = challenges.some(
        (challenge) =>
            challenge.challengerId === challengerId &&
            challenge.opponentId === opponentId
    );

    if (alreadyChallenged) {
        showChallengeValidation(t("games.sinkOrWin.score.playerAlreadyChallenged"));
        return;
    }

    challenger.birdieCards--;

    challenger.birdieCardPenalties ??= [];

    const consumedPenalty = challenger.birdieCardPenalties.length > 0
        ? challenger.birdieCardPenalties.shift()
        : null;

    challenges.push({
        challengerId,
        opponentId,
        stake,
        birdieCardPenalty: consumedPenalty
    });

    saveGame();
    renderPlayers();
    updateOpenSections();
    closeChallengeForm();
}

function renderChallenges() {
    const challengeList = document.querySelector("#challengeList");
    const challenges = getCurrentChallenges();

    challengeList.replaceChildren();

    if (challenges.length === 0) {
        const message = document.createElement("p");
        message.className = "emptyChallenges";
        message.textContent = t("games.sinkOrWin.score.noChallenges");
        challengeList.append(message);
        return;
    }

    challenges.forEach((challenge, index) => {
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
        names.textContent = t("games.sinkOrWin.score.challengerChallengesOpponent", {
            challenger: challenger.name,
            opponent: opponent.name
        });

        const stake = document.createElement("span");
        stake.className = "challengeStake";
        stake.textContent = t("games.sinkOrWin.score.challengeStakePoints", {
            points: challenge.stake
        });

        details.append(names);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "challengeRemoveButton";
        removeButton.textContent = "×";
        removeButton.setAttribute(
            "aria-label",
            t("games.sinkOrWin.score.removeChallengeLabel", {
                challenger: challenger.name,
                opponent: opponent.name
            })
        );

        removeButton.addEventListener("click", () => {
            removeChallenge(index);
        });

        card.append(details, stake, removeButton);
        challengeList.append(card);
    });
}

function updateChallengeStake(amount) {
    challengeStake = Math.max(1, challengeStake + amount);

    challengeStakeValue.textContent = challengeStake;

    showChallengeValidation("");
    renderOpponentOptions();
}

function updateOpenSections() {
    if (!challengeContent.hidden) {
        renderChallenges();
    }

    if (!standingsSection.hidden) {
        renderStandings();
    }
}

function removeChallenge(index) {
    const challenges = getCurrentChallenges();
    const challenge = challenges[index];

    if (!challenge) return;

    const challenger = gameState.players.find(
        (player) => player.id === challenge.challengerId
    );

    if (!challenger) return;

    const confirmed = window.confirm(
        t("games.sinkOrWin.score.confirmRemoveChallenge")
    );

    if (!confirmed) return;

    // Geef de Birdiekaart terug.
    challenger.birdieCards++;

    challenger.birdieCardPenalties ??= [];

    // Herstel ook de oorspronkelijke eindstraf van de kaart.
    challenger.birdieCardPenalties.unshift(
        challenge.birdieCardPenalty === true
    );

    // Verwijder de uitdaging.
    challenges.splice(index, 1);

    saveGame();

    renderPlayers();
    updateOpenSections();

    if (!challengeForm.hidden) {
    renderChallengerOptions();
    renderOpponentOptions();
    }
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
        showValidation(t("games.sinkOrWin.score.enterAllScores"));
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
    holeResultHeading.textContent = t("games.sinkOrWin.score.holeResultTitle");
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
        pointsValue.textContent = t("games.sinkOrWin.score.playerPoints", {
            points: `${sign}${player.totalPoints}`
        });

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
        details.textContent = t("games.sinkOrWin.score.challengerVsOpponent", {
            challenger: challenger.name,
            opponent: opponent.name
        });

        const outcome = document.createElement("strong");

        if (challenger.comparisonScore < opponent.comparisonScore) {
            outcome.textContent = t("games.sinkOrWin.score.challengerWinsPoints", {
                challenger: challenger.name,
                points: challenge.stake
            });
        } else if (challenger.comparisonScore > opponent.comparisonScore) {
            outcome.textContent = t("games.sinkOrWin.score.opponentWinsPoints", {
                opponent: opponent.name,
                points: challenge.stake
            });
        } else {
            outcome.textContent = t("games.sinkOrWin.score.drawNoPoints");
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
        name.textContent = t("games.sinkOrWin.score.earnsBirdieCard", {
            name: player.name
        });

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
    updateOpenSections();
}

function editScores() {
    pendingHoleResult = null;

    holeResultSection.hidden = true;
    scoreSection.hidden = false;
    challengeSection.hidden = false;
    finishHoleButton.hidden = false;
}

/* Eindresultaat */

/* Definitieve resultatenpagina */

function renderFinalResults() {
    holeResultSection.hidden = true;
    finalResultsSection.hidden = false;

    scoreSection.hidden = true;
    challengeSection.hidden = true;
    standingsSection.hidden = true;

    document.querySelector(".scoreActions").hidden = true;
    document.querySelector(".scorePage .pageFooter").hidden = true;

    holeTitle.textContent = t("games.sinkOrWin.score.roundCompleted");
    holeDetails.textContent = t("games.sinkOrWin.score.finalStandingsDescription");

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

    renderFinalStandings(sortedPlayers);
    renderFinalPointsChart();
    renderFinalEvents();
    renderFinalScorecard();
}


/* Eindstand */

function renderFinalStandings(players) {
    finalStandingsList.replaceChildren();

    players.forEach((player, index) => {
        const card = document.createElement("article");
        card.className = "finalStandingPlayer";

        const highestPoints = players[0].finalPoints;

        if (player.finalPoints === highestPoints) {
            card.classList.add("isWinner");
        }
        
        const position = document.createElement("span");
        position.className = "finalStandingPosition";
        position.textContent = index + 1;

        const info = document.createElement("div");
        info.className = "finalStandingInfo";

        const name = document.createElement("strong");
        name.textContent = player.name;

        info.append(name);

        const points = document.createElement("strong");
        points.className = "finalStandingPoints";
        points.textContent = t("games.sinkOrWin.score.finalPoints", {
            points: player.finalPoints
        });

        card.append(position, info, points);

        if (player.penaltyCards > 0) {
            const penalty = document.createElement("p");
            penalty.className = "finalStandingPenalty";
            penalty.textContent = t("games.sinkOrWin.score.birdieCardPenalty", {
                count: player.penaltyCards
            });
            card.append(penalty);
        }

        finalStandingsList.append(card);
    });
}


/* Puntenverloop */

function renderFinalPointsChart() {
    finalPointsChart.replaceChildren();

    const players = gameState.players;
    const holes = gameState.completedHoles;

    if (holes.length === 0) return;

    const width = 600;
    const height = 280;
    const padding = {
        top: 20,
        right: 25,
        bottom: 35,
        left: 35
    };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const totals = players.map((player) => {
        let total = 0;

        const values = [{
            hole: 0,
            points: 0
        }];

        holes.forEach((hole) => {
            const result = hole.results.find(
                (item) => item.id === player.id
            );

            total += result?.totalPoints ?? 0;

            values.push({
                hole: hole.holeNumber,
                points: total
            });
        });

        return {
            player,
            values
        };
    });

    const allValues = totals.flatMap((item) =>
        item.values.map((value) => value.points)
    );

    const minValue = Math.min(0, ...allValues);
    const maxValue = Math.max(1, ...allValues);
    const range = maxValue - minValue || 1;

    const x = (index) =>
        padding.left + (index / holes.length) * chartWidth;

    const y = (value) =>
        padding.top +
        ((maxValue - value) / range) * chartHeight;

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute(
        "aria-label",
        t("games.sinkOrWin.score.pointsChartLabel")
    );

    // Horizontale nullijn.
    const zeroLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    zeroLine.setAttribute("x1", padding.left);
    zeroLine.setAttribute("x2", width - padding.right);
    zeroLine.setAttribute("y1", y(0));
    zeroLine.setAttribute("y2", y(0));
    zeroLine.setAttribute("stroke", "#A8B7A5");
    zeroLine.setAttribute("stroke-dasharray", "4 4");

    svg.append(zeroLine);

    // Holelabels.
    holes.forEach((hole, index) => {
        const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        label.setAttribute("x", x(index + 1));
        label.setAttribute("y", height - 10);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "12");
        label.setAttribute("fill", "#52675A");
        label.textContent = hole.holeNumber;

        svg.append(label);
    });

    const colors = [
        "#194D3A",
        "#83A84D",
        "#547A9B",
        "#B77B42",
        "#9674A5",
        "#C56C70"
    ];

    totals.forEach((item, playerIndex) => {
        const color = colors[playerIndex % colors.length];

        const points = item.values
            .map((value, index) => `${x(index)},${y(value.points)}`)
            .join(" ");

        const line = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "polyline"
        );

        line.setAttribute("points", points);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-linejoin", "round");

        svg.append(line);

        item.values.forEach((value, index) => {
            const circle = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

            circle.setAttribute("cx", x(index));
            circle.setAttribute("cy", y(value.points));
            circle.setAttribute("r", "3.5");
            circle.setAttribute("fill", color);

            svg.append(circle);
        });
    });

    finalPointsChart.append(svg);

    // Legenda.
    const legend = document.createElement("div");
    legend.className = "finalChartLegend";

    totals.forEach((item, index) => {
        const entry = document.createElement("span");
        entry.className = "finalChartLegendItem";

        const marker = document.createElement("span");
        marker.className = "finalChartLegendMarker";
        marker.style.backgroundColor =
            colors[index % colors.length];

        const name = document.createElement("span");
        name.textContent = item.player.name;

        entry.append(marker, name);
        legend.append(entry);
    });

    finalPointsChart.append(legend);
}


/* Gebeurtenissen */

function renderFinalEvents() {
    finalEventsList.replaceChildren();

    gameState.completedHoles.forEach((hole) => {
        const group = document.createElement("article");
        group.className = "finalEventHole";

        const heading = document.createElement("h4");
        heading.textContent = `Hole ${hole.holeNumber}`;

        group.append(heading);

        hole.results.forEach((result) => {
            if (result.points !== 0) {
                const event = document.createElement("p");

                event.textContent = result.points === 3
                ? t("games.sinkOrWin.score.winsHole", {
                    name: result.name
                })
                : t("games.sinkOrWin.score.sharesBestScore", {
                    name: result.name
                });

                group.append(event);
            }
        });

        hole.challenges.forEach((challenge) => {
            const challenger = gameState.players.find(
                (player) => player.id === challenge.challengerId
            );

            const opponent = gameState.players.find(
                (player) => player.id === challenge.opponentId
            );

            const challengerResult = hole.results.find(
                (player) => player.id === challenge.challengerId
            );

            const opponentResult = hole.results.find(
                (player) => player.id === challenge.opponentId
            );

            if (!challenger || !opponent ||
                !challengerResult || !opponentResult) return;

            const event = document.createElement("p");

            if (
                challengerResult.comparisonScore <
                opponentResult.comparisonScore
            ) {
                event.textContent = t("games.sinkOrWin.score.stealsPoints", {
                    challenger: challenger.name,
                    points: challenge.stake,
                    opponent: opponent.name
                });
            } else if (
                challengerResult.comparisonScore >
                opponentResult.comparisonScore
            ) {
                event.textContent = t("games.sinkOrWin.score.opponentWinsPointsFromChallenger", {
                    opponent: opponent.name,
                    points: challenge.stake,
                    challenger: challenger.name
                });
            } else {
                event.textContent = t("games.sinkOrWin.score.challengeDraw", {
                    challenger: challenger.name,
                    opponent: opponent.name
                });
            }

            group.append(event);
        });

        hole.results
            .filter((result) => result.earnsBirdieCard)
            .forEach((result) => {
                const event = document.createElement("p");
                event.textContent = t("games.sinkOrWin.score.earnsBirdieCardEvent", {
                    name: result.name
                });

                group.append(event);
            });

        finalEventsList.append(group);
    });
}


/* Scorekaart */

function renderFinalScorecard() {
    finalScorecard.replaceChildren();

    const header = document.createElement("p");
    header.className = "finalScorecardDescription";
    header.textContent = setup.mode === "handicap"
    ? t("games.sinkOrWin.score.handicapScorecardDescription")
    : t("games.sinkOrWin.score.scratchScorecardDescription");

    finalScorecard.append(header);

    gameState.players.forEach((player) => {
        const details = document.createElement("details");
        details.className = "finalScorecardPlayer";

        const summary = document.createElement("summary");
        summary.textContent = player.name;

        details.append(summary);

        gameState.completedHoles.forEach((hole) => {
            const result = hole.results.find(
                (item) => item.id === player.id
            );

            if (!result) return;

            const row = document.createElement("div");
            row.className = "finalScorecardRow";

            const holeName = document.createElement("strong");
            holeName.textContent = `Hole ${hole.holeNumber}`;

            const score = document.createElement("span");

            score.textContent = setup.mode === "handicap"
            ? t("games.sinkOrWin.score.grossAndNetScore", {
                gross: result.grossScore,
                net: result.netScore
            })
            : t("games.sinkOrWin.score.grossScore", {
                score: result.grossScore
            });

            const points = document.createElement("strong");
            const sign = result.totalPoints > 0 ? "+" : "";

            points.textContent = t("games.sinkOrWin.score.playerPoints", {
                points: result.totalPoints
            });

            row.append(holeName, score, points);
            details.append(row);
        });

        finalScorecard.append(details);
    });
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
        points.textContent = t("games.sinkOrWin.score.playerPoints", {
            points: player.points
        });

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
        ? t("games.sinkOrWin.score.closeStandings")
        : t("games.sinkOrWin.score.viewStandings");
}

/* Gebeurtenissen */

finishHoleButton.addEventListener("click", reviewHole);
confirmHoleButton.addEventListener("click", confirmHole);
editScoresButton.addEventListener("click", editScores);
standingsButton.addEventListener("click", toggleStandings);

function startNewGame() {
    localStorage.removeItem(GAME_STORAGE_KEY);
    localStorage.removeItem(PLAYER_STORAGE_KEY);
    localStorage.removeItem(ROUND_STORAGE_KEY);

    window.location.href = "baan.html";
}

holeResultNewGameButton.addEventListener("click", startNewGame);

challengeToggleButton.addEventListener("click", () => {
    const isOpen = challengeToggleButton.getAttribute("aria-expanded") !== "true";

    if (isOpen) {
    renderChallenges();
    }

    challengeContent.hidden = !isOpen;
    challengeToggleButton.setAttribute("aria-expanded", String(isOpen));
    challengeToggleButton.classList.toggle("isOpen", isOpen);
    });

challengeButton.addEventListener("click", openChallengeForm);
cancelChallengeButton.addEventListener("click", closeChallengeForm);

decreaseChallengeStake.addEventListener("click", () => {
    updateChallengeStake(-1);
});

increaseChallengeStake.addEventListener("click", () => {
    updateChallengeStake(1);
});

saveChallengeButton.addEventListener("click", saveChallenge);

/* Spel starten */

loadGame();
