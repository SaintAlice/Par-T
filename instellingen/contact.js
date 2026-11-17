
import { t } from "../js/shared/i18n/i18n.js";

const contactForm = document.getElementById("contactForm");
const submitButton = document.getElementById("contactSubmit");
const contactStatus = document.getElementById("contactStatus");

if (contactForm && submitButton && contactStatus) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        contactStatus.textContent = "";

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const formData = new FormData(contactForm);

        const payload = {
            name: formData.get("name").trim(),
            email: formData.get("email").trim(),
            subject: formData.get("subject").trim(),
            message: formData.get("message").trim()
        };

        if (!payload.email || !payload.subject || !payload.message) {
            contactForm.reportValidity();
            return;
        }

        submitButton.disabled = true;
        contactForm.setAttribute("aria-busy", "true");

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Contact form submission failed.");
            }

            contactForm.reset();
            contactStatus.textContent = t("contact.success");
            contactStatus.classList.remove("error");
            contactStatus.classList.add("success");

        } catch (error) {
            console.error("Contact form error:", error);

            contactStatus.textContent = t("contact.error");
            contactStatus.classList.remove("success");
            contactStatus.classList.add("error");

        } finally {
            submitButton.disabled = false;
            contactForm.removeAttribute("aria-busy");
        }
    });
}

window.addEventListener("partee:languagechange", () => {
    if (contactStatus) {
        contactStatus.textContent = "";
        contactStatus.classList.remove("success", "error");
    }
});
