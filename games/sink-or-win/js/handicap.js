
/* PAR-TEE — Handicapberekening */

const COURSE_RATINGS = {
    heren: {
        frontNine: {
            white: { courseRating: 36.4, slopeRating: 127, par: 36 },
            yellow: { courseRating: 35.4, slopeRating: 124, par: 36 },
            blue: { courseRating: 34.7, slopeRating: 118, par: 36 },
            red: { courseRating: 34.0, slopeRating: 113, par: 36 },
            orange: { courseRating: 31.7, slopeRating: 116, par: 36 }
        },
        backNine: {
            white: { courseRating: 35.5, slopeRating: 143, par: 35 },
            yellow: { courseRating: 34.5, slopeRating: 133, par: 35 },
            blue: { courseRating: 34.3, slopeRating: 132, par: 35 },
            red: { courseRating: 32.8, slopeRating: 123, par: 35 },
            orange: { courseRating: 31.3, slopeRating: 115, par: 35 }
        },
        fullRound: {
            white: { courseRating: 71.8, slopeRating: 135, par: 71 },
            yellow: { courseRating: 69.8, slopeRating: 128, par: 71 },
            blue: { courseRating: 69.0, slopeRating: 125, par: 71 },
            red: { courseRating: 66.8, slopeRating: 118, par: 71 },
            orange: { courseRating: 63.0, slopeRating: 116, par: 71 }
        }
    },
    dames: {
        frontNine: {
            yellow: { courseRating: 38.1, slopeRating: 146, par: 36 },
            blue: { courseRating: 37.3, slopeRating: 134, par: 36 },
            red: { courseRating: 36.3, slopeRating: 123, par: 36 },
            orange: { courseRating: 33.8, slopeRating: 108, par: 36 }
        },
        backNine: {
            yellow: { courseRating: 37.5, slopeRating: 132, par: 35 },
            blue: { courseRating: 36.7, slopeRating: 141, par: 35 },
            red: { courseRating: 35.5, slopeRating: 137, par: 35 },
            orange: { courseRating: 32.9, slopeRating: 114, par: 35 }
        },
        fullRound: {
            yellow: { courseRating: 75.6, slopeRating: 139, par: 71 },
            blue: { courseRating: 74.0, slopeRating: 138, par: 71 },
            red: { courseRating: 71.8, slopeRating: 130, par: 71 },
            orange: { courseRating: 66.5, slopeRating: 111, par: 71 }
        }
    }
};


function getCourseData(gender, tee, round) {
    const courseData = COURSE_RATINGS[gender]?.[round]?.[tee];

    if (!courseData) {
        throw new Error(
            "Geen baaninformatie gevonden voor deze combinatie."
        );
    }

    return courseData;
}


function calculatePlayingHandicap(handicapIndex, courseData, totalHoles) {
    const handicap = Number(handicapIndex);
    const { slopeRating, courseRating, par } = courseData;

    if (
        !Number.isFinite(handicap) ||
        !Number.isFinite(slopeRating) ||
        !Number.isFinite(courseRating) ||
        !Number.isFinite(par)
    ) {
        throw new Error("Ongeldige handicap- of baangegevens.");
    }

    if (slopeRating <= 0 || (totalHoles !== 9 && totalHoles !== 18)) {
        throw new Error("Ongeldige Slope Rating of ronde.");
    }

    let playingHandicap;

    if (totalHoles === 9) {
        playingHandicap =
            (handicap / 2) * (slopeRating / 113)
            + (courseRating - par);
    } else {
        playingHandicap =
            handicap * (slopeRating / 113)
            + (courseRating - par);
    }

    return Math.round(playingHandicap);
}


function distributeHandicapStrokes(playingHandicap, holes) {
    const strokes = Number(playingHandicap);

    if (!Number.isInteger(strokes) || strokes < 0) {
        throw new Error("Ongeldige baanhandicap.");
    }

    if (!Array.isArray(holes) || holes.length === 0) {
        throw new Error("Er zijn geen holes opgegeven.");
    }

    const baseStrokes = Math.floor(strokes / holes.length);
    const remainingStrokes = strokes % holes.length;

    const sortedHoles = [...holes].sort(
        (a, b) => a.strokeIndex - b.strokeIndex
    );

    const extraStrokes = new Set(
        sortedHoles
            .slice(0, remainingStrokes)
            .map((hole) => hole.number)
    );

    return holes.map((hole) => ({
        ...hole,
        handicapStrokes:
            baseStrokes + (extraStrokes.has(hole.number) ? 1 : 0)
    }));
}
