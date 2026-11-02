
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration =
                await navigator.serviceWorker.register(
                    "/service-worker.js"
                );

            console.log(
                "PAR-TEE service worker geregistreerd:",
                registration.scope
            );
        } catch (error) {
            console.error(
                "Service worker registratie mislukt:",
                error
            );
        }
    });
}
