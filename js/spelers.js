let allPlayers =
JSON.parse(localStorage.getItem("allPlayers")) || [];

const playerInput =
document.getElementById("playerInput");

const addPlayerButton =
document.getElementById("addPlayerButton");

const playerList =
document.getElementById("playerList");

const nextButton =
document.getElementById("nextButton");

init();

function init(){

    renderPlayers();

    addPlayerButton.addEventListener(
        "click",
        addPlayer
    );

    playerInput.addEventListener(
        "keydown",
        function(event){

            if(event.key === "Enter"){

                addPlayer();

            }

        }
    );

    nextButton.addEventListener(
        "click",
        startGame
    );

}

function addPlayer(){

    const name =
    playerInput.value.trim();

    if(name === ""){

        return;

    }

    const bestaatAl =
    allPlayers.some(function(player){

        return player.name.toLowerCase() ===
        name.toLowerCase();

    });

    if(bestaatAl){

        alert("Deze speler bestaat al.");

        return;

    }

    allPlayers.push({

        id: Date.now(),

        name: name,

        photo: ""

    });

    localStorage.setItem(
        "allPlayers",
        JSON.stringify(allPlayers)
    );

    playerInput.value = "";

    renderPlayers();

}

function renderPlayers(){

    playerList.innerHTML = "";

    allPlayers.forEach(function(player, index){

        const initial =
            player.name.charAt(0).toUpperCase();

        playerList.innerHTML += `

            <div class="player">

                <div class="playerInfo">

                    <div class="playerAvatar">

                        ${initial}

                    </div>

                    <div class="playerName">

                        ${player.name}

                    </div>

                </div>

                <button
                    class="removeButton"
                    onclick="removePlayer(${index})">

                    🗑️

                </button>

            </div>

        `;

    });

    nextButton.disabled =
        allPlayers.length < 2;

}

function removePlayer(index){

    allPlayers.splice(index,1);

    localStorage.setItem(
        "allPlayers",
        JSON.stringify(allPlayers)
    );

    renderPlayers();

}

function startGame(){

    const players =
    allPlayers.map(function(player){

        return player.name;

    });

    localStorage.setItem(
        "players",
        JSON.stringify(players)
    );

    location.href =
    "tees.html";

}