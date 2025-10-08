import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY not set');
}

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;
