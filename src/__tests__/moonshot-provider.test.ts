import { describe, expect, it } from 'vitest';
import { config, AVAILABLE_MODELS } from '../config/index.js';
import { LLMBackbone } from '../llm/index.js';

// Coverage for native Moonshot / Kimi support.
// Moonshot's Kimi Open Platform is OpenAI-compatible, so the engine dispatches it
// through OpenAIAdapter (via the thin MoonshotAdapter subclass), which posts to
// `${baseUrl}/chat/completions`. Two distinct routes to Kimi exist and must not be
// conflated: the direct `moonshot` provider takes BARE model ids (kimi-latest), while
// routing Kimi through OpenRouter uses the `moonshotai/`-prefixed slug under `openrouter`.
describe('Moonshot / Kimi native provider wiring', () => {
  it('routes moonshot through the OpenAI-compatible Kimi Open Platform endpoint', () => {
    const cfg = config.getLLMConfig('moonshot');
    expect(cfg.provider).toBe('moonshot');
    expect(cfg.baseUrl).toBe('https://api.moonshot.ai/v1');
    expect(`${cfg.baseUrl}/chat/completions`).toBe('https://api.moonshot.ai/v1/chat/completions');
  });

  it('defaults to a bare Kimi model id (no moonshotai/ prefix — that prefix is the OpenRouter route)', () => {
    const cfg = config.getLLMConfig('moonshot');
    expect(cfg.model).toBe('kimi-latest');
    expect(cfg.model.startsWith('moonshotai/')).toBe(false);
  });

  it('honors an explicit model override', () => {
    expect(config.getLLMConfig('moonshot', 'kimi-k2.5').model).toBe('kimi-k2.5');
  });

  it('publishes a non-empty direct Kimi catalog with bare ids', () => {
    expect(AVAILABLE_MODELS.moonshot?.length ?? 0).toBeGreaterThan(0);
    for (const m of AVAILABLE_MODELS.moonshot) {
      expect(m.id.startsWith('moonshotai/')).toBe(false);
    }
  });

  it('also exposes Kimi via OpenRouter using the moonshotai/ prefix', () => {
    const orIds = AVAILABLE_MODELS.openrouter.map(m => m.id);
    expect(orIds).toContain('moonshotai/kimi-k2');
    expect(orIds).toContain('moonshotai/kimi-k3');
  });

  it('maps the moonshot provider to the MOONSHOT_API_KEY environment variable', () => {
    const prev = process.env.MOONSHOT_API_KEY;
    process.env.MOONSHOT_API_KEY = 'test-moonshot-key-0123456789';
    try {
      expect(config.hasApiKey('moonshot')).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.MOONSHOT_API_KEY;
      else process.env.MOONSHOT_API_KEY = prev;
    }
  });

  it('fails closed with a Moonshot-specific message when no key is set (not the parent OpenAI message)', () => {
    const backbone = new LLMBackbone({ provider: 'moonshot', model: 'kimi-latest', baseUrl: 'https://api.moonshot.ai/v1' });
    const v = backbone.validateConfig();
    expect(v.valid).toBe(false);
    expect(v.error).toMatch(/Moonshot API key is required/);
    expect(v.error).not.toMatch(/OpenAI/);
  });
});
