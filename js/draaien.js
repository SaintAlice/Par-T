let currentPlayerIndex = 0;
let currentRotation = 0;

const results = [];
const wheelSegments = [];

const players =
JSON.parse(localStorage.getItem("players")) || [];

const tees =
JSON.parse(localStorage.getItem("tees")) || [];

const teeColors = {

    "Wit":"#ffffff",
    "Geel":"#ffd700",
    "Blauw":"#2196f3",
    "Rood":"#f44336",
    "Oranje":"#ff9800"

};

const currentPlayer =
document.getElementById("currentPlayer");

const wheel =
document.getElementById("wheel");

const svg =
document.getElementById("segments");

const playersBar =
document.getElementById("playersBar");

const statusText =
document.getElementById("statusText");

const randomMode =
sessionStorage.getItem("randomMode") === "true";

init();

function init(){

    createResults();

    drawPlayers();

    createWheel();

    drawWheel();

    showCurrentPlayer();

    updatePlayerBar();

    wheel.addEventListener(
        "click",
        spinWheel
    );

}

function createResults(){

    results.length = 0;

    if(randomMode){

        players.forEach(function(player){

            const randomTee =
                tees[Math.floor(Math.random() * tees.length)];

            results.push({

                player: player,
                tee: randomTee

            });

        });

    }else{

        const teePool = [];

        const base =
            Math.floor(players.length / tees.length);

        const extra =
            players.length % tees.length;

        tees.forEach(function(tee){

            for(let i = 0; i < base; i++){

                teePool.push(tee);

            }

        });

        const randomTees =
            [...tees].sort(function(){

                return Math.random() - 0.5;

            });

        for(let i = 0; i < extra; i++){

            teePool.push(randomTees[i]);

        }

        teePool.sort(function(){

            return Math.random() - 0.5;

        });

        players.forEach(function(player,index){

            results.push({

                player: player,
                tee: teePool[index]

            });

        });

    }

    localStorage.setItem(
        "results",
        JSON.stringify(results)
    );

}

function createWheel(){

    wheelSegments.length = 0;

    const repeats =
    Math.ceil(24 / tees.length);

    for(let i = 0; i < repeats; i++){

        tees.forEach(function(tee){

            wheelSegments.push({

                naam:tee,
                kleur:teeColors[tee]

            });

        });

    }

}

function drawWheel(){

    svg.innerHTML = "";

    const total =
    wheelSegments.length;

    const slice =
    360 / total;

    for(let i = 0; i < total; i++){

        const start =
        i * slice;

        const end =
        start + slice;

        const center =
        start + (slice / 2);

        wheelSegments[i].angle = center;

        const x1 =
        200 + 180 * Math.cos((start - 90) * Math.PI / 180);

        const y1 =
        200 + 180 * Math.sin((start - 90) * Math.PI / 180);

        const x2 =
        200 + 180 * Math.cos((end - 90) * Math.PI / 180);

        const y2 =
        200 + 180 * Math.sin((end - 90) * Math.PI / 180);

        svg.innerHTML += `

        <path
            d="
            M200 200
            L${x1} ${y1}
            A180 180 0 0 1 ${x2} ${y2}
            Z
            "
            fill="${wheelSegments[i].kleur}"
            stroke="#222"
            stroke-width="0.5"
        />

        `;

    }

}

function showCurrentPlayer(){

    currentPlayer.textContent =
        results[currentPlayerIndex].player.charAt(0).toUpperCase() +
        results[currentPlayerIndex].player.slice(1) +
        " draait";

    if (currentPlayerIndex === 0) {

    statusText.innerHTML =
        "Tik op het rad om te draaien";

    } else {

        statusText.innerHTML = "";

    }

}

function spinWheel(){

wheel.style.pointerEvents = "none";

const teeNaam =
results[currentPlayerIndex].tee;

const mogelijkeSegmenten =
wheelSegments.filter(function(segment){

    return segment.naam === teeNaam;

});

const gekozenSegment =
mogelijkeSegmenten[
    Math.floor(
        Math.random() *
        mogelijkeSegmenten.length
    )
];

const target =
360 - gekozenSegment.angle;

const currentAngle =
((currentRotation % 360) + 360) % 360;

const extraRotation =
(target - currentAngle + 360) % 360;

currentRotation +=
(3 * 360) + extraRotation;

wheel.style.transform =
`rotate(${currentRotation}deg)`;

setTimeout(function(){

    showResult();

},2400);
}



function showResult(){

    updatePlayerColor();

    const speler =
    results[currentPlayerIndex].player;

    const tee =
    results[currentPlayerIndex].tee;

    const kleurEmoji = {

        "Wit":"⚪",
        "Geel":"🟡",
        "Blauw":"🔵",
        "Rood":"🔴",
        "Oranje":"🟠"

    };

    statusText.innerHTML =
        `${kleurEmoji[tee]} <strong>${speler}</strong> speelt vanaf <strong>${tee}</strong>`;

    setTimeout(function(){

        nextPlayer();

    },1000);

}

function nextPlayer(){

    currentPlayerIndex++;

    if(currentPlayerIndex >= results.length){

        location.href =
        "resultaat.html";

        return;

    }

    showCurrentPlayer();

    updatePlayerBar();

    wheel.style.pointerEvents = "auto";

}

function drawPlayers(){

    playersBar.innerHTML = "";

    results.forEach(function(result,index){

        const initial =
        result.player
            .trim()
            .charAt(0)
            .toUpperCase();

        playersBar.innerHTML += `

        <div class="playerCard">

            <div
                class="playerPhoto"
                id="player-${index}">

                ${initial}

            </div>

            <div class="playerName">

                ${result.player}

            </div>

        </div>

        `;

    });

}

function updatePlayerBar(){

    document
    .querySelectorAll(".playerPhoto")
    .forEach(function(photo){

        photo.classList.remove("active");

    });

    const current =
    document.getElementById(
        "player-" + currentPlayerIndex
    );

    if(current){

        current.classList.add("active");

    }

}

function updatePlayerColor(){

    const player =
    document.getElementById(
        "player-" + currentPlayerIndex
    );

    if(!player){

        return;

    }

    player.classList.remove(
        "photo-wit",
        "photo-geel",
        "photo-blauw",
        "photo-rood",
        "photo-oranje"
    );

    const tee =
    results[currentPlayerIndex].tee.toLowerCase();

    player.classList.add(
        "photo-" + tee
    );

}