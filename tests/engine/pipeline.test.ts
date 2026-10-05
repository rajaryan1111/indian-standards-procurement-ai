import { describe, expect, it } from 'vitest';
import { analyze } from '../../src/engine/pipeline';
import { demoDeps, LED_QUERY } from '../helpers';

describe('analysis pipeline', () => {
  it('promotes a product-matching standard and keeps the result explainable', async () => {
    const { repo, ai } = demoDeps();
    const result = await analyze({ text: LED_QUERY, source: 'text', topK: 8 }, { repo, ai });

    expect(result.input.language).toBe('en');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0].standard.id).toBe('is-10322-5-3');
    expect(result.recommendations[0].role).toBe('primary');
    expect(result.recommendations[0].evidence.length).toBeGreaterThan(0);
    expect(result.recommendations[0].explanation.length).toBeGreaterThan(20);
    expect(result.disclaimer).toContain('verify');
  });

  it('preserves the original Hindi input while producing a normalised analysis', async () => {
    const { repo, ai } = demoDeps();
    const text = 'नगर निगम की सड़कों के लिए एलईडी स्ट्रीट लाइट चाहिए, 120 वाट, जलरोधक';
    const result = await analyze({ text, source: 'paste' }, { repo, ai });

    expect(result.input.original).toBe(text);
    expect(result.input.language).toBe('hi');
    expect(result.input.normalized).toContain('street lighting luminaire');
    expect(result.input.normalized).toContain('ingress protection');
    expect(result.summary.requirementCount).toBe(result.requirements.length);
  });

  it('keeps summary counts consistent with the returned recommendation sets', async () => {
    const { repo, ai } = demoDeps();
    const result = await analyze({ text: 'Supply of XLPE cable for pump motor, 4 core 50 sqmm', source: 'text' }, { repo, ai });

    expect(result.summary.primaryCount).toBe(result.recommendations.length);
    expect(result.summary.relatedCount).toBe(result.related.length);
    expect(result.summary.gapCount).toBe(result.gaps.length);
    expect(result.summary.outdatedCount).toBe(
      result.outdated.filter((item) => item.status === 'potentially-outdated' || item.status === 'superseded').length,
    );
    expect(result.recommendations.every((r) => r.confidence.total >= 45)).toBe(true);
  });
});
