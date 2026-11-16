import { t, initLanguage } from "../../../js/shared/i18n/i18n.js";

const STORAGE_KEY = "sinkOrWinCourses";
const ROUND_STORAGE_KEY = "sinkOrWinRoundSetup";
const GAME_STORAGE_KEY = "sinkOrWinGame";
const PLAYER_STORAGE_KEY = "sinkOrWinSetup";

const API_URL = "/api/golf-courses";

const COUNTRY_CODES = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR",
    "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE",
    "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ",
    "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD",
    "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR",
    "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM",
    "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
    "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS",
    "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU",
    "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
    "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN",
    "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK",
    "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
    "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ",
    "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
    "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM",
    "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS",
    "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
    "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV",
    "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK",
    "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
    "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
];

const courseList = document.querySelector("#courseList");
const searchInput = document.querySelector("#courseSearchInput");
const searchButton = document.querySelector("#courseSearchButton");
const countrySelect = document.querySelector("#courseCountry");
const searchResults = document.querySelector("#courseSearchResults");
const searchStatus = document.querySelector("#courseSearchStatus");

const pagination = document.querySelector("#coursePagination");
const previousPageButton = document.querySelector("#previousCoursePage");
const nextPageButton = document.querySelector("#nextCoursePage");
const pageInfo = document.querySelector("#coursePageInfo");

const selectedCourseSection = document.querySelector("#selectedCourseSection");
const selectedCourseDetails = document.querySelector("#selectedCourseDetails");

const roundSelection = document.querySelector("#roundSelection");
const roundOptions = document.querySelector("#roundOptions");
const continueButton = document.querySelector("#continueButton");

const existingGamePrompt = document.querySelector("#existingGamePrompt");
const resumeGameButton = document.querySelector("#resumeGameButton");
const startNewGameButton = document.querySelector("#startNewGameButton");

const RESULTS_PER_PAGE = 5;

let searchResultsData = [];
let currentPage = 1;

let courses = [];
let selectedCourse = null;
let selectedRound = null;
let isLoading = false;

initLanguage();

function getText(key, fallback) {
    const translated = t(key);

    return translated === key
        ? fallback
        : translated;
}

function getCurrentLanguage() {
    return document.documentElement.lang.startsWith("en")
        ? "en"
        : "nl";
}

function populateCountrySelect() {
    const language = getCurrentLanguage();

    const countryNames = new Intl.DisplayNames(
        [language],
        { type: "region" }
    );

    const preferredCountries = language === "nl"
        ? ["NL", "BE"]
        : ["GB", "US"];

    const remainingCountries = COUNTRY_CODES
        .filter((code) => !preferredCountries.includes(code))
        .sort((a, b) =>
            countryNames.of(a).localeCompare(
                countryNames.of(b),
                language
            )
        );

    const fragment = document.createDocumentFragment();

    preferredCountries.forEach((code) => {
        const option = document.createElement("option");
        option.value = code.toLowerCase();
        option.textContent = countryNames.of(code);
        fragment.append(option);
    });

    remainingCountries.forEach((code) => {
        const option = document.createElement("option");
        option.value = code.toLowerCase();
        option.textContent = countryNames.of(code);
        fragment.append(option);
    });

    countrySelect.replaceChildren(
        countrySelect.options[0],
        fragment
    );
}

function normalizeHoles(holes = []) {
    return holes.map((hole) => ({
        number: hole.position ?? hole.number,
        par: Number(hole.par),
        strokeIndex: Number(hole.stroke_index ?? hole.strokeIndex),
        yards: hole.yards ?? null
    }));
}

function normalizeCourse(course) {
    const layout = course.layouts?.[0];

    const holes = normalizeHoles(
        layout?.holes ?? course.holes ?? []
    );

    return {
        ...course,
        id: course.slug ?? course.id,
        slug: course.slug ?? null,
        name: course.name,
        source: course.source ?? "golfcore",
        hole_count: course.hole_count ?? holes.length,
        par_total: course.par_total ?? layout?.par ?? null,
        holes,
        tees: (layout?.tees ?? course.tees ?? []).map((tee, index) => ({
            id: `${tee.name}-${tee.gender}-${index}`,
            name: tee.name,
            gender: tee.gender,
            yards: tee.yards,
            par: tee.par,
            rating: tee.rating,
            slope: tee.slope,
            holes: normalizeHoles(tee.holes ?? [])
        }))
    };
}

function checkExistingGame() {
    try {
        const savedGame = JSON.parse(
            localStorage.getItem(GAME_STORAGE_KEY)
        );

        const savedRound = JSON.parse(
            localStorage.getItem(ROUND_STORAGE_KEY)
        );

        const hasUnfinishedGame =
            savedGame &&
            Array.isArray(savedGame.players) &&
            savedGame.players.length > 0 &&
            Array.isArray(savedGame.completedHoles) &&
            savedRound &&
            Array.isArray(savedRound.holes) &&
            savedRound.holes.length > 0 &&
            savedGame.completedHoles.length < savedRound.holes.length;

        existingGamePrompt.hidden = !hasUnfinishedGame;

    } catch (error) {
        console.error("Fout bij controleren van bestaand spel:", error);
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

function loadCourses() {
    try {
        const savedCourses = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        courses = Array.isArray(savedCourses)
            ? savedCourses.filter(
                (course) => course.id !== "hooge-rotterdamsche"
            ).slice(0, 3)
            : [];

        saveCourses();
        renderLocalCourses();

    } catch (error) {
        console.error("Fout bij laden van golfbanen:", error);

        courses = [];
        saveCourses();
        renderLocalCourses();
    }
}

function saveCourses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function rememberCourse(course) {
    courses = [
        course,
        ...courses.filter(
            (savedCourse) => savedCourse.id !== course.id
        )
    ].slice(0, 3);

    saveCourses();
    renderLocalCourses();
}

function renderLocalCourses() {
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
        details.textContent = t(
            "games.sinkOrWin.course.holeCount",
            { count: course.hole_count ?? course.holes.length }
        );

        card.append(name, details);

        card.addEventListener("click", () => {
            selectCourse(course);
        });

        courseList.append(card);
    });
}

function setSearchStatus(message, isError = false) {
    searchStatus.textContent = message;
    searchStatus.hidden = !message;
    searchStatus.classList.toggle("isError", isError);
}

async function parseApiResponse(response, errorKey, fallback) {
    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        console.error("Ongeldige API-response:", {
            status: response.status,
            contentType: response.headers.get("content-type"),
            response: responseText.slice(0, 500)
        });

        throw new Error(getText(errorKey, fallback));
    }

    if (!response.ok) {
        console.error("API-aanvraag mislukt:", {
            status: response.status,
            response: data
        });

        throw new Error(getText(errorKey, fallback));
    }

    return data;
}

async function searchCourses() {
    const query = searchInput.value.trim();
    const country = countrySelect.value;

    if (query.length < 2) {
        setSearchStatus(
            getText(
                "games.sinkOrWin.course.searchMinimum",
                "Vul minimaal twee tekens in om te zoeken."
            ),
            true
        );

        searchInput.focus();
        return;
    }

    if (isLoading) return;

    isLoading = true;

    document.querySelector(".recentCoursesSection").hidden = true;

    searchButton.disabled = true;
    searchResults.replaceChildren();
    pagination.hidden = true;
    searchResultsData = [];
    currentPage = 1;

    setSearchStatus(
        getText(
            "games.sinkOrWin.course.searching",
            "Golfbanen zoeken..."
        )
    );

    try {
        const params = new URLSearchParams({
            q: query
        });

        if (country) {
            params.set("country", country);
        }

        const response = await fetch(
            `${API_URL}?${params.toString()}`
        );

        const data = await parseApiResponse(
            response,
            "games.sinkOrWin.course.searchError",
            "Golfbanen konden niet worden opgehaald. Probeer het opnieuw."
        );

        const results = Array.isArray(data.courses)
            ? data.courses
            : [];

        searchResultsData = [
            ...new Map(
                results.map((course) => [
                    course.slug ?? course.id,
                    course
                ])
            ).values()
        ];

        currentPage = 1;
        renderSearchResults();

        setSearchStatus(
            searchResultsData.length === 0
                ? getText(
                    "games.sinkOrWin.course.noResults",
                    "Geen golfbanen gevonden."
                )
                : ""
        );

    } catch (error) {
        console.error("GolfCore zoekfout:", error);

        setSearchStatus(
            error.message || getText(
                "games.sinkOrWin.course.searchError",
                "Golfbanen konden niet worden opgehaald. Probeer het opnieuw."
            ),
            true
        );

    } finally {
        isLoading = false;
        searchButton.disabled = false;
    }
}

function renderSearchResults() {
    searchResults.replaceChildren();

    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;

    const currentResults = searchResultsData.slice(
        startIndex,
        startIndex + RESULTS_PER_PAGE
    );

    currentResults.forEach((course) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "courseCard";

        const name = document.createElement("span");
        name.className = "courseCardName";
        name.textContent = course.name;

        const details = document.createElement("span");
        details.className = "courseCardDetails";

        const location = [
            course.city,
            course.region,
            course.country?.toUpperCase()
        ].filter(Boolean).join(", ");

        details.textContent = [
            location,
            course.hole_count
                ? `${course.hole_count} holes`
                : null
        ].filter(Boolean).join(" · ");

        card.append(name, details);

        card.addEventListener("click", () => {
            loadCourseDetails(course.slug ?? course.id);
        });

        searchResults.append(card);
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(
        searchResultsData.length / RESULTS_PER_PAGE
    );

    pagination.hidden = totalPages <= 1;

    previousPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    previousPageButton.textContent = t(
        "games.sinkOrWin.course.previousPage"
    );

    nextPageButton.textContent = t(
        "games.sinkOrWin.course.nextPage"
    );

    pageInfo.textContent = t(
        "games.sinkOrWin.course.pageInfo",
        {
            current: currentPage,
            total: totalPages
        }
    );
}

function changePage(direction) {
    const totalPages = Math.ceil(
        searchResultsData.length / RESULTS_PER_PAGE
    );

    const nextPage = currentPage + direction;

    if (nextPage < 1 || nextPage > totalPages) return;

    currentPage = nextPage;
    renderSearchResults();
}

async function loadCourseDetails(slug) {
    if (!slug || isLoading) return;

    isLoading = true;
    searchButton.disabled = true;

    setSearchStatus("");

    try {
        const params = new URLSearchParams({ slug });

        const response = await fetch(
            `${API_URL}?${params.toString()}`
        );

        const data = await parseApiResponse(
            response,
            "games.sinkOrWin.course.fetchError",
            "Golfbaangegevens konden niet worden opgehaald."
        );

        const course = normalizeCourse(data);

        if (!course.holes.length) {
            throw new Error(
                getText(
                    "games.sinkOrWin.course.scorecardUnavailable",
                    "Deze golfbaan heeft geen beschikbare scorekaart."
                )
            );
        }

        selectedCourse = course;

        const totalPages = Math.ceil(
            searchResultsData.length / RESULTS_PER_PAGE
        );

        currentPage = Math.min(
            currentPage,
            Math.max(1, totalPages)
        );

        renderSearchResults();

        rememberCourse(selectedCourse);

        selectedRound = null;

        renderSelectedCourse();
        renderRoundOptions();

        selectedCourseSection.hidden = false;
        roundSelection.hidden = false;

        updateContinueButton();

    } catch (error) {
        console.error("GolfCore detailfout:", error);

        setSearchStatus(
            error.message || getText(
                "games.sinkOrWin.course.fetchError",
                "Golfbaangegevens konden niet worden opgehaald."
            ),
            true
        );

    } finally {
        isLoading = false;
        searchButton.disabled = false;
    }
}

function selectCourse(course) {
    selectedCourse = normalizeCourse(course);
    selectedRound = null;

    rememberCourse(selectedCourse);

    renderSelectedCourse();
    renderRoundOptions();

    selectedCourseSection.hidden = false;
    roundSelection.hidden = false;

    updateContinueButton();
}

function renderSelectedCourse() {
    selectedCourseDetails.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = selectedCourse.name;

    const location = document.createElement("p");
    location.className = "selectedCourseLocation";
    location.textContent = [
        selectedCourse.city,
        selectedCourse.region,
        selectedCourse.country?.toUpperCase()
    ].filter(Boolean).join(", ");

    const details = document.createElement("p");
    details.className = "selectedCourseMeta";
    details.textContent = [
        `${selectedCourse.hole_count} holes`,
        selectedCourse.par_total
            ? `Par ${selectedCourse.par_total}`
            : null
    ].filter(Boolean).join(" · ");

    selectedCourseDetails.append(title);

    if (location.textContent) {
        selectedCourseDetails.append(location);
    }

    selectedCourseDetails.append(details);
}

function renderRoundOptions() {
    roundOptions.replaceChildren();

    const holeCount = selectedCourse.hole_count ??
        selectedCourse.holes.length;

    const availableRounds = [
        {
            id: "frontNine",
            label: t("games.sinkOrWin.rounds.frontNine"),
            start: 1,
            end: 9
        }
    ];

    if (holeCount === 18) {
        availableRounds.push(
            {
                id: "backNine",
                label: t("games.sinkOrWin.rounds.backNine"),
                start: 10,
                end: 18
            },
            {
                id: "fullRound",
                label: t("games.sinkOrWin.rounds.fullRound"),
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
        ? t("common.continue")
        : selectedCourse
            ? t("games.sinkOrWin.course.chooseHoles")
            : t("games.sinkOrWin.course.chooseCourse");
}

function continueToPlayers() {
    if (!selectedCourse || !selectedRound) return;

    const selectedHoles = selectedCourse.holes.filter((hole) => {
        return hole.number >= selectedRound.start &&
            hole.number <= selectedRound.end;
    });

    if (selectedHoles.length !== selectedRound.end - selectedRound.start + 1) {
        setSearchStatus(
            getText(
                "games.sinkOrWin.course.incompleteScorecard",
                "De scorekaart bevat niet alle holes voor deze ronde."
            ),
            true
        );
        return;
    }

    const roundSetup = {
        courseId: selectedCourse.id,
        courseSlug: selectedCourse.slug ?? null,
        courseName: selectedCourse.name,
        courseSource: selectedCourse.source,
        course: selectedCourse,
        availableTees: selectedCourse.tees ?? [],
        round: selectedRound.id,
        totalHoles: selectedHoles.length,
        holes: selectedHoles
    };

    localStorage.removeItem(GAME_STORAGE_KEY);

    localStorage.setItem(
        ROUND_STORAGE_KEY,
        JSON.stringify(roundSetup)
    );

    window.location.href = "spelers.html";
}

searchButton.addEventListener("click", searchCourses);

searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchCourses();
    }
});

continueButton.addEventListener("click", continueToPlayers);
resumeGameButton.addEventListener("click", resumeGame);
startNewGameButton.addEventListener("click", startNewGame);

previousPageButton.addEventListener("click", () => {
    changePage(-1);
});

nextPageButton.addEventListener("click", () => {
    changePage(1);
});

populateCountrySelect();
loadCourses();
updateContinueButton();
checkExistingGame();