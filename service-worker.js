
const CACHE_NAME = "par-tee-v2";

const PRECACHE_URLS = [
    // Hoofdpagina's
    "/",
    "/index.html",
    "/offline.html",
    "/header.html",

    // Gedeelde JavaScript
    "/header.js",
    "/navigation.js",
    "/js/pwa.js",

    // Algemene CSS
    "/css/style.css",
    "/css/home.css",
    "/css/navigation.css",
    "/css/header.css",

    // Algemene afbeeldingen
    "/assets/golfbal-tee.png",
    "/assets/golfbal-tee-cropped.png",

    // App-iconen
    "/assets/icons/icon-192.png",
    "/assets/icons/icon-512.png",
    "/assets/icons/icon-maskable-512.png",

    // Afbeeldingen en logo's
    "/images/par-t-logo.png",
    "/images/par-t-logo2.png",
    "/images/par-t-logo3.png",
    "/images/par-t-logo4.png",
    "/images/par-t-logo-perzik.png",
    "/images/par-t-logo-perzik.svg",
    "/images/background-hrd10.png",
    "/images/background-hrd10.1.png",
    "/images/background-hrd16.png",
    "/images/tee-oranje.svg",

    // Games overzicht
    "/games/games.html",
    "/games/games.css",

    // Spin the Tee - HTML
    "/games/spin-the-tee/spin-the-tee.html",
    "/games/spin-the-tee/tees.html",
    "/games/spin-the-tee/spelers.html",
    "/games/spin-the-tee/draaien.html",
    "/games/spin-the-tee/resultaat.html",

    // Spin the Tee - CSS
    "/games/spin-the-tee/css/style.css",
    "/games/spin-the-tee/css/home.css",
    "/games/spin-the-tee/css/tees.css",
    "/games/spin-the-tee/css/spelers.css",
    "/games/spin-the-tee/css/draaien.css",
    "/games/spin-the-tee/css/resultaat.css",
    "/games/spin-the-tee/css/wheel.css",

    // Spin the Tee - JavaScript
    "/games/spin-the-tee/js/loting.js",
    "/games/spin-the-tee/js/tees.js",
    "/games/spin-the-tee/js/spelers.js",
    "/games/spin-the-tee/js/draaien.js",
    "/games/spin-the-tee/js/resultaat.js",

    // Spin the Tee - afbeeldingen
    "/games/spin-the-tee/images/background.png",
    "/games/spin-the-tee/images/background-hrd18.png",
    "/games/spin-the-tee/images/background-hrd18.1.png",
    "/games/spin-the-tee/images/tee-blauw.svg",
    "/games/spin-the-tee/images/tee-geel.svg",
    "/games/spin-the-tee/images/tee-rood.svg",
    "/games/spin-the-tee/images/tee-wit.svg",

    // Sink or Win - HTML
    "/games/sink-or-win/sink-or-win.html",
    "/games/sink-or-win/spelers.html",
    "/games/sink-or-win/baan.html",
    "/games/sink-or-win/score.html",

    // Sink or Win - CSS
    "/games/sink-or-win/css/sink-or-win.css",
    "/games/sink-or-win/css/spelers.css",
    "/games/sink-or-win/css/baan.css",
    "/games/sink-or-win/css/score.css",

    // Sink or Win - JavaScript
    "/games/sink-or-win/js/sink-or-win.js",
    "/games/sink-or-win/js/spelers.js",
    "/games/sink-or-win/js/baan.js",
    "/games/sink-or-win/js/score.js",
    "/games/sink-or-win/js/handicap.js",
    "/games/sink-or-win/js/courses/de-hooge-rotterdamsche.js",

    // Instellingen
    "/instellingen/instellingen.html",
    "/instellingen/instellingen.js",
    "/instellingen/over-par-t.html",

    // Instellingen - CSS
    "/instellingen/css/instellingen.css",
    "/instellingen/css/over-par-t.css",
    "/instellingen/css/spelregels.css",

    // Spelregels
    "/instellingen/spelregels/spelregels.html"
];

// Installatie: belangrijkste bestanden vooraf opslaan
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );

    self.skipWaiting();
});

// Activatie: oude caches verwijderen
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys
                    .filter((key) =>
                        key.startsWith("par-tee-") &&
                        key !== CACHE_NAME
                    )
                    .map((key) => caches.delete(key))
            );

            await self.clients.claim();
        })()
    );
});

// Netwerk en offline afhandeling
self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return;
    }

    event.respondWith(
        (async () => {
            try {
                const response = await fetch(request);

                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, response.clone());
                }

                return response;

            } catch (error) {
                const cachedResponse = await caches.match(request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                if (request.mode === "navigate") {
                    return caches.match("/offline.html");
                }

                return new Response("Je bent offline.", {
                    status: 503,
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8"
                    }
                });
            }
        })()
    );
});
