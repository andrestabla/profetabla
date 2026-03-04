import { describe, expect, it } from 'vitest';
import { fetchMindOntologySkills } from './mind-ontology';

describe('mind-ontology', () => {
    it('lee habilidades desde JSON remoto o local y respeta maxSkills', async () => {
        const result = await fetchMindOntologySkills({
            url: 'https://raw.githubusercontent.com/MIND-TechAI/MIND-tech-ontology/main/__aggregated_skills.json',
            maxSkills: 50
        });

        expect(result.totalAvailable).toBeGreaterThan(1000);
        expect(result.skills.length).toBe(50);
        expect(result.skills[0]?.name).toBeTruthy();
        expect(result.skills[0]?.sourceUri.startsWith('mind-tech-ontology://skill/')).toBe(true);
    }, 20_000);
});
