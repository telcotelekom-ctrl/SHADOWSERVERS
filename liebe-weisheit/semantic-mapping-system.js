// Semantische mapping-systeem (minimale, functionele reconstructie).
// Het originele bestand "semantic-mapping-system.js" was niet onderdeel van de geplakte
// broncode. Deze versie koppelt zoekwoorden aan verwante theologische kernbegrippen rond
// het thema "Liefde" en levert resultaten in het formaat dat de hoofdpagina verwacht
// (matches met type 'concept' of 'direct'). Zonder dit bestand valt de pagina automatisch
// terug op de ingebouwde basis-zoekfunctie (generateFallbackResults), dus dit bestand is een
// verrijking, geen harde vereiste.
class SemanticMappingSystem {
    constructor() {
        this.conceptMap = {
            liefde: {
                concepts: ['agape', 'chesed', 'metta', 'mahabbah'],
                explanation: 'Liefde verbindt alle tradities als kernwaarde: onvoorwaardelijke toewijding aan het welzijn van de ander.'
            },
            vergeving: {
                concepts: ['genade', 'verzoening'],
                explanation: 'Vergeving bevrijdt zowel de gever als de ontvanger van de last van het verleden.'
            },
            vertrouwen: {
                concepts: ['geloof', 'overgave'],
                explanation: 'Vertrouwen is de basis van een levende relatie met het goddelijke en met anderen.'
            },
            hoop: {
                concepts: ['verwachting', 'volharding'],
                explanation: 'Hoop draagt mensen door moeilijke tijden heen.'
            },
            vrede: {
                concepts: ['shalom', 'salaam', 'shanti'],
                explanation: 'Vrede is de vrucht van gerechtigheid en liefde in gemeenschap.'
            },
            dankbaarheid: {
                concepts: ['lof', 'erkenning'],
                explanation: 'Dankbaarheid opent het hart voor meer verbondenheid.'
            },
            barmhartigheid: {
                concepts: ['chesed', 'rahma'],
                explanation: 'Barmhartigheid is actieve liefde voor wie lijdt.'
            },
            geduld: {
                concepts: ['volharding', 'zelfbeheersing'],
                explanation: 'Geduld is liefde die de tijd geeft.'
            },
            trouw: {
                concepts: ['toewijding', 'standvastigheid'],
                explanation: 'Trouw houdt liefde overeind, ook wanneer het moeilijk wordt.'
            }
        };

        this.wordSynonyms = {
            liefhebben: 'liefde',
            liefdevol: 'liefde',
            vergeven: 'vergeving',
            vertrouw: 'vertrouwen',
            hopen: 'hoop',
            vredig: 'vrede',
            dankbaar: 'dankbaarheid',
            barmhartig: 'barmhartigheid',
            geduldig: 'geduld',
            trouwen: 'trouw'
        };
    }

    async matchSemanticQuery(query) {
        const q = (query || '').toLowerCase().trim();
        const matches = [];

        if (!q) {
            return { matches };
        }

        for (const [key, data] of Object.entries(this.conceptMap)) {
            if (q.includes(key)) {
                matches.push({
                    type: 'concept',
                    concept: key,
                    biblicalConcepts: data.concepts,
                    explanation: data.explanation,
                    confidence: 0.78
                });
            }
        }

        for (const [word, mappedKey] of Object.entries(this.wordSynonyms)) {
            if (q.includes(word) && !matches.some(m => m.concept === mappedKey)) {
                const data = this.conceptMap[mappedKey];
                if (data) {
                    matches.push({
                        type: 'direct',
                        word,
                        concepts: data.concepts,
                        triggers: [word, mappedKey],
                        confidence: 0.65
                    });
                }
            }
        }

        return { matches };
    }
}
