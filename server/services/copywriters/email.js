import { callClaude } from '../../config/anthropic.js';
import { EMAIL_COPYWRITER_PROMPT } from '../../utils/prompts.js';

/**
 * Email Copywriter - Specialized agent for conversion-focused emails
 */
export async function generateEmail(brief, context, previousFeedback = null) {
  try {
    let userPrompt = `Copy Brief:\n${JSON.stringify(brief, null, 2)}\n\nRelevant Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    if (previousFeedback) {
      userPrompt += `\n\nPREVIOUS FEEDBACK (address these issues):\n${previousFeedback}`;
    }

    userPrompt += '\n\nGenerate the email copy now as JSON.';

    const response = await callClaude(EMAIL_COPYWRITER_PROMPT, userPrompt, 0.8, 4096);

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
          subject_line: 'Important Update',
          preview_text: '',
          body: response,
          cta: 'Click Here',
          metadata: {
            email_type: 'general',
            word_count: response.split(/\s+/).length
          }
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Email generation error:', error);
    throw error;
  }
}

export default { generateEmail };
