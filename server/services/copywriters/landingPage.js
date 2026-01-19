import { callClaude } from '../../config/anthropic.js';
import { LANDING_PAGE_COPYWRITER_PROMPT } from '../../utils/prompts.js';

/**
 * Landing Page Copywriter - Specialized agent for high-converting web copy
 */
export async function generateLandingPage(brief, context, previousFeedback = null) {
  try {
    let userPrompt = `Copy Brief:\n${JSON.stringify(brief, null, 2)}\n\nRelevant Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    if (previousFeedback) {
      userPrompt += `\n\nPREVIOUS FEEDBACK (address these issues):\n${previousFeedback}`;
    }

    userPrompt += '\n\nGenerate the landing page copy now as JSON.';

    const response = await callClaude(LANDING_PAGE_COPYWRITER_PROMPT, userPrompt, 0.8, 8000);

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      console.log('Direct JSON parse failed, attempting extraction...');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
          console.log('✓ Extracted JSON successfully');
        } catch (extractError) {
          console.log('Extracted JSON is malformed, using fallback');
          result = {
            sections: {
              hero: { headline: 'Transform Your Business', subheadline: '', cta: 'Get Started' },
              problem: response.substring(0, 500),
              solution: response.substring(500, 1000),
              proof: '',
              offer: '',
              guarantee: '',
              final_cta: 'Get Started Now'
            },
            metadata: {
              word_count: response.split(/\s+/).length,
              sections_count: 7
            }
          };
        }
      } else {
        result = {
          sections: {
            hero: { headline: 'Transform Your Business', subheadline: '', cta: 'Get Started' },
            problem: response.substring(0, 500),
            solution: response.substring(500, 1000),
            proof: '',
            offer: '',
            guarantee: '',
            final_cta: 'Get Started Now'
          },
          metadata: {
            word_count: response.split(/\s+/).length,
            sections_count: 7
          }
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Landing Page generation error:', error);
    throw error;
  }
}

export default { generateLandingPage };
