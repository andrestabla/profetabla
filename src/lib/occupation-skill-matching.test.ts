import { describe, expect, it } from 'vitest';
import { suggestSkillIdsForOccupation } from './occupation-skill-matching';

const baseSkill = {
    industry: 'ESCO',
    category: 'EU Skills',
    tags: []
};

describe('occupation-skill-matching', () => {
    it('ignores symbolic short skills like C# and C++', () => {
        const occupation = {
            id: 'occ-1',
            occupationTitle: 'Industrial engineers',
            occupationType: 'Line Item'
        };

        const skills = [
            { id: 's1', name: 'C#', ...baseSkill },
            { id: 's2', name: 'C++', ...baseSkill },
            { id: 's3', name: 'aerospace engineering', ...baseSkill }
        ];

        const suggested = suggestSkillIdsForOccupation(occupation, skills, {
            minScore: 3,
            maxResults: 5
        });

        expect(suggested).not.toContain('s1');
        expect(suggested).not.toContain('s2');
    });

    it('deduplicates near-identical concept matches', () => {
        const occupation = {
            id: 'occ-2',
            occupationTitle: 'Computer systems analysts',
            occupationType: 'Line Item'
        };

        const skills = [
            { id: 's1', name: 'computer engineering', ...baseSkill },
            { id: 's2', name: 'computer equipment', ...baseSkill },
            { id: 's3', name: 'computer technology', ...baseSkill }
        ];

        const suggested = suggestSkillIdsForOccupation(occupation, skills, {
            minScore: 3,
            maxResults: 5
        });

        expect(suggested).toEqual(['s1']);
    });

    it('respects except clauses in occupation titles', () => {
        const occupation = {
            id: 'occ-3',
            occupationTitle: 'Electronics engineers, except computer',
            occupationType: 'Line Item'
        };

        const skills = [
            { id: 's1', name: 'computer engineering', ...baseSkill },
            { id: 's2', name: 'aerospace engineering', ...baseSkill }
        ];

        const suggested = suggestSkillIdsForOccupation(occupation, skills, {
            minScore: 3,
            maxResults: 5
        });

        expect(suggested).toEqual([]);
    });

    it('returns a clear relation for public relations occupations', () => {
        const occupation = {
            id: 'occ-4',
            occupationTitle: 'Public relations specialists',
            occupationType: 'Line Item'
        };

        const skills = [
            { id: 's1', name: 'advise on public relations', ...baseSkill },
            { id: 's2', name: 'aerospace engineering', ...baseSkill }
        ];

        const suggested = suggestSkillIdsForOccupation(occupation, skills, {
            minScore: 3,
            maxResults: 5
        });

        expect(suggested).toEqual(['s1']);
    });
});
