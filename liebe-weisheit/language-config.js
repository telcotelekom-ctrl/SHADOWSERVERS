// Lichtgewicht taalconfiguratie-helper.
// Het originele bestand "language-config.js" was niet onderdeel van de geplakte broncode;
// dit is een functionele, minimale vervanging zodat de pagina zelfstandig (offline) werkt.
class LanguageConfig {
    constructor() {
        this.currentLanguage = 'nl';
        this.supportedLanguages = ['nl', 'en', 'de'];
    }

    switchLanguage(lang) {
        if (this.supportedLanguages.includes(lang)) {
            this.currentLanguage = lang;
        }
        return this.currentLanguage;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}
