import { callClaude } from '../config/anthropic.js';
import { COPY_CHIEF_PROMPT, COPY_EVALUATOR_PROMPT } from '../utils/prompts.js';
import { retrieveContext, retrieveHighPerformingCopy } from './retrieval.js';
import { generateAdScript } from './copywriters/adScript.js';
import { generateAdCopy } from './copywriters/adCopy.js';
import { generateEmail } from './copywriters/email.js';
import { generateLandingPage } from './copywriters/landingPage.js';
import { generateVSL } from './copywriters/vsl.js';

/**
 * Copy Chief Orchestrator - Main agent that coordinates the entire copywriting workflow
 */

/**
 * Create comprehensive Copy & Funnel Brief
 */
export async function createBrief(userQuery, context, copyType) {
  try {
    let userPrompt = `User Request: ${userQuery}\n\nCopy Type: ${copyType}\n\nRetrieved Context:\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}] (score: ${item.score?.toFixed(3)}):\n${item.content}\n`;
    });

    userPrompt += '\n\nCreate a comprehensive Copy & Funnel Brief as structured JSON.';

    const response = await callClaude(COPY_CHIEF_PROMPT, userPrompt, 0.7, 4096);

    // Try to parse as JSON, otherwise create structured brief from text
    let brief;
    try {
      brief = JSON.parse(response);
    } catch (parseError) {
      // If not valid JSON, create a structured brief from the text
      brief = {
        offer_summary: {
          target_market: 'Extract from context',
          problem_statement: 'Extract from context',
          solution: 'Extract from context',
          core_promise: 'Extract from context'
        },
        prospect_analysis: {
          demographics: 'Extract from context',
          psychographic_markers: 'Extract from context',
          awareness_level: 'problem-aware',
          desire_map: 'Extract from context'
        },
        psychological_strategy: {
          primary_emotion: 'desire',
          belief_engineering: 'Extract from context',
          objection_handling: 'Extract from context',
          proof_requirements: 'Extract from context'
        },
        voice_and_tone: {
          brand_voice: 'professional yet approachable',
          language_patterns: 'Extract from context',
          taboo_words: []
        },
        success_criteria: {
          primary_goal: 'conversion',
          secondary_goals: ['engagement', 'brand awareness'],
          key_metrics: ['CTR', 'conversion rate']
        },
        raw_brief: response
      };
    }

    return brief;
  } catch (error) {
    console.error('Brief creation error:', error);
    throw error;
  }
}

/**
 * Evaluate copy quality (0-100 scoring)
 */
export async function evaluateCopy(draft, brief, context) {
  try {
    let userPrompt = `COPY BRIEF:\n${JSON.stringify(brief, null, 2)}\n\nDRAFT COPY:\n${JSON.stringify(draft, null, 2)}\n\nRETRIEVED CONTEXT (proven patterns):\n`;

    context.forEach((item, index) => {
      userPrompt += `\n[Context ${index + 1}]:\n${item.content}\n`;
    });

    userPrompt += '\n\nEvaluate this copy and return the evaluation as JSON.';

    const response = await callClaude(COPY_EVALUATOR_PROMPT, userPrompt, 0.3, 2048);

    // Parse JSON response
    let evaluation;
    try {
      evaluation = JSON.parse(response);
    } catch (parseError) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback evaluation
        evaluation = {
          scores: {
            brief_adherence: 15,
            psychological_impact: 15,
            voice_consistency: 15,
            structural_integrity: 15,
            conversion_optimization: 15
          },
          total_score: 75,
          feedback: 'Unable to parse full evaluation. Manual review recommended.',
          approved: false
        };
      }
    }

    // Ensure approved flag matches score
    evaluation.approved = evaluation.total_score >= 90;

    return evaluation;
  } catch (error) {
    console.error('Copy evaluation error:', error);
    throw error;
  }
}

/**
 * Route to appropriate copywriter based on copy type
 */
async function callCopywriter(copyType, brief, context, previousFeedback = null) {
  const copyTypeMap = {
    'ad_script': generateAdScript,
    'ad_copy': generateAdCopy,
    'email': generateEmail,
    'landing_page': generateLandingPage,
    'vsl': generateVSL
  };

  const copywriterFunc = copyTypeMap[copyType];
  if (!copywriterFunc) {
    throw new Error(`Unknown copy type: ${copyType}`);
  }

  return await copywriterFunc(brief, context, previousFeedback);
}

/**
 * Main Copy Generation Workflow with Quality Control Loop
 */
export async function generateCopyWithQualityControl(
  userQuery,
  copyType,
  projectId,
  maxAttempts = 5
) {
  try {
    console.log(`Starting copy generation for project ${projectId}, type: ${copyType}`);

    // Step 1: Retrieve context from Pinecone
    console.log('Retrieving context...');
    const context = await retrieveContext(userQuery, projectId, 10, true);

    // Also get high-performing copy if available
    const highPerformingCopy = await retrieveHighPerformingCopy(projectId, copyType, 3);
    const allContext = [...highPerformingCopy, ...context];

    // Step 2: Create Copy & Funnel Brief
    console.log('Creating copy brief...');
    const brief = await createBrief(userQuery, allContext, copyType);

    // Step 3: Iteration loop
    let attempt = 1;
    let lastDraft = null;
    let evaluation = null;
    const attempts = [];

    while (attempt <= maxAttempts) {
      console.log(`Generating copy (attempt ${attempt}/${maxAttempts})...`);

      // Generate draft
      const draft = await callCopywriter(
        copyType,
        brief,
        allContext,
        evaluation?.feedback
      );
      lastDraft = draft;

      // Evaluate
      console.log(`Evaluating copy (attempt ${attempt})...`);
      evaluation = await evaluateCopy(draft, brief, allContext);

      attempts.push({
        attempt,
        draft,
        evaluation
      });

      console.log(`Score: ${evaluation.total_score}/100`);

      // Check if approved
      if (evaluation.approved || evaluation.total_score >= 90) {
        console.log(`✓ Copy approved after ${attempt} attempt(s)`);
        return {
          draft: lastDraft,
          brief,
          evaluation,
          attempts: attempt,
          attemptHistory: attempts,
          warning: null
        };
      }

      attempt++;
    }

    // Max attempts reached
    console.log(`⚠ Max attempts (${maxAttempts}) reached. Best score: ${evaluation.total_score}/100`);
    return {
      draft: lastDraft,
      brief,
      evaluation,
      attempts: maxAttempts,
      attemptHistory: attempts,
      warning: 'Max attempts reached without approval. Manual review recommended.'
    };
  } catch (error) {
    console.error('Copy generation workflow error:', error);
    throw error;
  }
}

export default {
  createBrief,
  evaluateCopy,
  generateCopyWithQualityControl
};
