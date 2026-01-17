import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

console.log('✓ Anthropic client initialized');

// Helper function to call Claude
async function callClaude(systemPrompt, userPrompt, temperature = 1.0, maxTokens = 4096) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

export { anthropic, callClaude };
export default { anthropic, callClaude };
