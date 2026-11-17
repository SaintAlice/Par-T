
const RESEND_API_URL = "https://api.resend.com/emails";
const CONTACT_EMAIL = "contact@par-tee.nl";
const SENDER_EMAIL = "PAR-TEE <contact@par-tee.nl>";

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");

        return res.status(405).json({
            error: "Method not allowed."
        });
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error("RESEND_API_KEY is not configured.");

        return res.status(500).json({
            error: "Contact service is not configured."
        });
    }

    const { name, email, subject, message } = req.body || {};

    const fields = { name, email, subject, message };

    if (
        Object.values(fields).some(value =>
            value !== undefined && typeof value !== "string"
        )
    ) {
        return res.status(400).json({
            error: "Invalid form data."
        });
    }

    const contact = {
        name: (name || "").trim(),
        email: (email || "").trim(),
        subject: (subject || "").trim(),
        message: (message || "").trim()
    };

    if (!contact.email || !contact.subject || !contact.message) {
        return res.status(400).json({
            error: "Please complete all required fields."
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        !emailPattern.test(contact.email) ||
        contact.email.length > 254
    ) {
        return res.status(400).json({
            error: "Invalid email address."
        });
    }

    if (
        contact.name.length > 100 ||
        contact.subject.length > 150 ||
        contact.message.length > 5000
    ) {
        return res.status(400).json({
            error: "One or more fields exceed the maximum length."
        });
    }

    try {
        const response = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: SENDER_EMAIL,
                to: [CONTACT_EMAIL],
                reply_to: contact.email,
                subject: `Nieuw contactbericht: ${contact.subject}`,
                text: [
                    "Nieuw contactbericht via PAR-TEE",
                    "",
                    `Naam: ${contact.name || "Niet opgegeven"}`,
                    `E-mailadres: ${contact.email}`,
                    `Onderwerp: ${contact.subject}`,
                    "",
                    "Bericht:",
                    contact.message
                ].join("\n")
            }),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);

            console.error("Resend API error:", {
                status: response.status,
                message: error?.message
            });

            return res.status(502).json({
                error: "Unable to send contact message."
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.error("Contact API error:", error.message);

        return res.status(502).json({
            error: "Unable to send contact message."
        });
    }
};
