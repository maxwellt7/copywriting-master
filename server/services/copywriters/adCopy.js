import { callClaude } from '../../config/anthropic.js';
import { AD_COPY_COPYWRITER_PROMPT } from '../../utils/prompts.js';

/**
 * Ad Copy Copywriter - Specialized agent for text ads (Google, Facebook, LinkedIn)
 */
export async function generateAdCopy(brief, context, previousFeedback = null) {
  try {
    let userPrompt = `Copy Brief:\n${JSON.stringify(brief, null, 2)}\n\nRelevant Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    if (previousFeedback) {
      userPrompt += `\n\nPREVIOUS FEEDBACK (address these issues):\n${previousFeedback}`;
    }

    userPrompt += '\n\nGenerate the ad copy variations now as JSON.';

    const response = await callClaude(AD_COPY_COPYWRITER_PROMPT, userPrompt, 0.8, 4096);

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
            variations: [
              {
                headline: 'Generated Ad',
                body: response,
                cta: 'Learn More'
              }
            ],
            metadata: {
              platform: 'general',
              character_counts: { headline: 0, body: response.length }
            }
          };
        }
      } else {
        result = {
          variations: [
            {
              headline: 'Generated Ad',
              body: response,
              cta: 'Learn More'
            }
          ],
          metadata: {
            platform: 'general',
            character_counts: { headline: 0, body: response.length }
          }
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Ad Copy generation error:', error);
    throw error;
  }
}

export default { generateAdCopy };
