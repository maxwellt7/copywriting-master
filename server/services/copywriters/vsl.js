import { callClaude } from '../../config/anthropic.js';
import { VSL_COPYWRITER_PROMPT } from '../../utils/prompts.js';

/**
 * VSL Copywriter - Specialized agent for 10-45 minute video sales letters
 */
export async function generateVSL(brief, context, previousFeedback = null) {
  try {
    let userPrompt = `Copy Brief:\n${JSON.stringify(brief, null, 2)}\n\nRelevant Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    if (previousFeedback) {
      userPrompt += `\n\nPREVIOUS FEEDBACK (address these issues):\n${previousFeedback}`;
    }

    userPrompt += '\n\nGenerate the VSL script now as JSON.';

    const response = await callClaude(VSL_COPYWRITER_PROMPT, userPrompt, 0.8, 8000);

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(response);
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          script: response,
          metadata: {
            estimated_length: 'Unknown',
            word_count: response.split(/\s+/).length,
            curiosity_loops: 0,
            proof_elements: 0
          }
        };
      }
    }

    return result;
  } catch (error) {
    console.error('VSL generation error:', error);
    throw error;
  }
}

export default { generateVSL };
