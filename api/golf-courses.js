
const API_BASE_URL = "https://api.golfcore.org/v1";

module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");

        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    const apiKey = process.env.GOLFCORE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "Golf course service is not configured."
        });
    }

    const { q, slug, country } = req.query;

    if (slug !== undefined && (q !== undefined || country !== undefined)) {
        return res.status(400).json({
            error: "Course slug cannot be combined with search filters."
        });
    }

    let endpoint;
    let cacheDuration;

    if (slug !== undefined) {
        const courseSlug = String(slug).trim();

        if (!/^[a-z0-9-]+$/.test(courseSlug)) {
            return res.status(400).json({
                error: "Invalid golf course slug."
            });
        }

        endpoint = `/courses/${encodeURIComponent(courseSlug)}`;
        cacheDuration = "public, s-maxage=86400, stale-while-revalidate=604800";
    } else {
        const params = new URLSearchParams();

        if (q !== undefined) {
            const searchQuery = String(q).trim();

            if (searchQuery.length < 2 || searchQuery.length > 100) {
                return res.status(400).json({
                    error: "Search query must contain between 2 and 100 characters."
                });
            }

            params.set("q", searchQuery);
        }

        if (country !== undefined) {
            const countryCode = String(country).trim().toLowerCase();

            if (!/^[a-z]{2}$/.test(countryCode)) {
                return res.status(400).json({
                    error: "Country must be a valid ISO2 country code."
                });
            }

            params.set("country", countryCode);
        }

        params.set("limit", "100");

        endpoint = `/courses?${params.toString()}`;
        cacheDuration = "public, s-maxage=300, stale-while-revalidate=3600";
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
                "User-Agent": "PAR-TEE/1.0"
            },
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 429) {
                const retryAfter = response.headers.get("Retry-After");

                if (retryAfter) {
                    res.setHeader("Retry-After", retryAfter);
                }
            }

            return res.status(response.status).json({
                error: data?.message || "GolfCore API request failed.",
                details: data?.errors || null
            });
        }

        res.setHeader("Cache-Control", cacheDuration);

        return res.status(200).json(data);

    } catch (error) {
        console.error("GolfCore API error:", error.message);

        return res.status(502).json({
            error: "Unable to retrieve golf course data."
        });
    }
};
