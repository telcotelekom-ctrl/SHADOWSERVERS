// Parabiblische matching-systeem (minimale, functionele reconstructie).
// Het originele bestand "parabiblical-matching-system.js" was niet onderdeel van de
// geplakte broncode. Deze versie herkent theologische kernbegrippen rond het thema
// "Liefde" uit meerdere tradities en levert resultaten in het formaat dat de hoofdpagina
// verwacht (matches met term/category/definition/explanation/confidence/verses).
class ParabiblicalMatcher {
    constructor() {
        this.terms = {
            agape: {
                category: 'Liefde',
                definition: 'Onvoorwaardelijke, zelfopofferende liefde.',
                explanation: 'Agape is de hoogste vorm van liefde in de christelijke traditie, gericht op het welzijn van de ander zonder eigenbelang.'
            },
            chesed: {
                category: 'Liefde',
                definition: 'Standvastige, trouwe liefde en goedheid.',
                explanation: 'Chesed beschrijft Gods trouwe verbondsliefde in de joodse traditie.'
            },
            metta: {
                category: 'Liefde',
                definition: 'Liefdevolle vriendelijkheid naar alle wezens.',
                explanation: 'Metta is een boeddhistische meditatiepraktijk gericht op onvoorwaardelijke goedheid.'
            },
            mahabbah: {
                category: 'Liefde',
                definition: 'Liefde voor God en de schepping.',
                explanation: 'Mahabbah beschrijft de liefdevolle relatie tussen mens en het goddelijke in de islam.'
            },
            shalom: {
                category: 'Vrede',
                definition: 'Volledige vrede, heelheid en welzijn.',
                explanation: 'Shalom is meer dan afwezigheid van conflict; het is volledige harmonie.'
            },
            ahavah: {
                category: 'Liefde',
                definition: 'Naastenliefde en Godsliefde in het jodendom.',
                explanation: 'Ahavah is de actieve, verplichtende liefde die ten grondslag ligt aan de joodse ethiek.'
            }
        };
    }

    async matchQuery(query, options = {}) {
        const q = (query || '').toLowerCase().trim();
        const threshold = options.fuzzyThreshold || 0;
        const matches = [];

        if (!q) {
            return { matches };
        }

        for (const [term, data] of Object.entries(this.terms)) {
            const termHit = q.includes(term);
            const categoryHit = data.category.toLowerCase().includes(q);
            const definitionHit = data.definition.toLowerCase().includes(q);

            if (termHit || categoryHit || definitionHit) {
                const confidence = termHit ? 0.8 : 0.6;
                if (confidence >= threshold) {
                    matches.push({
                        term,
                        category: data.category,
                        definition: data.definition,
                        explanation: data.explanation,
                        confidence,
                        verses: []
                    });
                }
            }
        }

        return { matches };
    }
}
