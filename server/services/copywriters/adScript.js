import { callClaude } from '../../config/anthropic.js';
import { AD_SCRIPT_COPYWRITER_PROMPT } from '../../utils/prompts.js';

/**
 * Ad Script Copywriter - Specialized agent for 15-60 second video ad scripts
 */
export async function generateAdScript(brief, context, previousFeedback = null) {
  try {
    let userPrompt = `Copy Brief:\n${JSON.stringify(brief, null, 2)}\n\nRelevant Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    if (previousFeedback) {
      userPrompt += `\n\nPREVIOUS FEEDBACK (address these issues):\n${previousFeedback}`;
    }

    userPrompt += '\n\nGenerate the ad script now as JSON.';

    const response = await callClaude(AD_SCRIPT_COPYWRITER_PROMPT, userPrompt, 0.8, 4096);

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: return raw response
        result = {
          script: response,
          metadata: {
            word_count: response.split(/\s+/).length,
            estimated_runtime: 'Unknown',
            hooks_used: [],
            triggers_leveraged: []
          }
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Ad Script generation error:', error);
    throw error;
  }
}

export default { generateAdScript };
