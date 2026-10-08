const results =
JSON.parse(localStorage.getItem("results")) || [];

const resultsContainer =
document.getElementById("results");

const newGameButton =
document.getElementById("newGameButton");

showResults();

newGameButton.addEventListener("click", newGame);

function showResults() {

    let html = "";

    results.forEach(function(result) {

        const initial =
            result.player.charAt(0).toUpperCase();

        const playerName =
            result.player.charAt(0).toUpperCase() +
            result.player.slice(1);

        const teeClass =
            result.tee.toLowerCase();

        html += `

            <div class="player">

                <div class="playerInfo">

                    <div class="playerAvatar ${teeClass}">
                        ${initial}
                    </div>

                    <div class="playerName">
                        ${playerName}
                    </div>

                </div>

                <div class="resultBadge ${teeClass}">

                    <span class="teeEmoji">
                        ${getTeeEmoji(result.tee)}
                    </span>

                    <span class="teeName">
                        ${result.tee}
                    </span>

                </div>

            </div>

        `;

    });

    resultsContainer.innerHTML = html;

}


function getTeeEmoji(tee){

    switch(tee){

        case "Wit": return "⚪";
        case "Geel": return "🟡";
        case "Blauw": return "🔵";
        case "Rood": return "🔴";
        case "Oranje": return "🟠";

        default: return "";

    }

}

function newGame(){

    localStorage.removeItem("players");
    localStorage.removeItem("tees");
    localStorage.removeItem("results");

    location.href = "index.html";

}