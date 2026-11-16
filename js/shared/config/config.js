const APP_VERSION = "0.3.1";

if (typeof module !== "undefined" && module.exports) {
    module.exports = { APP_VERSION };
}

if (typeof window !== "undefined") {
    window.PAR_TEE_CONFIG = { APP_VERSION };
}