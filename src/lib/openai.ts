import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY not set');
}

export const openai = apiKey ? new OpenAI({ apiKey }) : null;
