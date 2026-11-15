
const API_BASE_URL = "https://golfcoursesapi.com/api/v1";

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");

        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    const apiKey = process.env.GOLF_COURSES_API_KEY;

    if (!apiKey) {
        console.error("Golf Courses API key is not configured.");

        return res.status(500).json({
            error: "Golf course service is not configured."
        });
    }

    const { q, id } = req.query;

    if (q && id) {
        return res.status(400).json({
            error: "Provide either a search query or a course ID."
        });
    }

    let endpoint;

    if (id !== undefined) {
        const courseId = String(id);

        if (!/^\d+$/.test(courseId) || Number(courseId) <= 0) {
            return res.status(400).json({
                error: "Invalid golf course ID."
            });
        }

        endpoint = `/courses/${courseId}`;
    } else if (q !== undefined) {
        const searchQuery = String(q).trim();

        if (searchQuery.length < 2 || searchQuery.length > 100) {
            return res.status(400).json({
                error: "Search query must contain between 2 and 100 characters."
            });
        }

        endpoint = `/courses?q=${encodeURIComponent(searchQuery)}`;
    } else {
        return res.status(400).json({
            error: "Provide a search query or a course ID."
        });
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "application/json"
                },
                signal: AbortSignal.timeout(10000)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");

                if (retryAfter) {
                    res.setHeader("Retry-After", retryAfter);
                }
            }

            return res.status(response.status).json({
                error: data.message || "Golf course API request failed.",
                details: data.errors || null
            });
        }

        res.setHeader(
            "Cache-Control",
            "public, s-maxage=3600, stale-while-revalidate=86400"
        );

        return res.status(200).json(data);

    } catch (error) {
        console.error("Golf Courses API error:", error.message);

        return res.status(502).json({
            error: "Unable to retrieve golf course data."
        });
    }
};
