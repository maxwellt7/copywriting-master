import { initPinecone } from '../config/pinecone.js';
import db from '../config/db.js';

/**
 * Process performance metrics and update Pinecone embeddings
 * This creates a feedback loop for continuous improvement
 */

/**
 * Calculate average performance for a copy output
 */
export async function calculateAveragePerformance(copyOutputId) {
  try {
    const result = await db.query(
      `SELECT AVG(metric_value) as avg_performance
       FROM copy_metrics
       WHERE copy_output_id = $1`,
      [copyOutputId]
    );

    return result.rows[0]?.avg_performance || 0;
  } catch (error) {
    console.error('Error calculating average performance:', error);
    throw error;
  }
}

/**
 * Update Pinecone metadata with performance metrics
 */
export async function updateCopyPerformance(copyOutputId, pineconeId, projectId) {
  try {
    const { index } = await initPinecone();
    const namespace = `project-${projectId}`;

    // Calculate average performance
    const avgPerformance = await calculateAveragePerformance(copyOutputId);

    // Fetch existing vector
    const fetchResult = await index.namespace(namespace).fetch([pineconeId]);
    const existingVector = fetchResult.records[pineconeId];

    if (!existingVector) {
      throw new Error(`Vector ${pineconeId} not found in namespace ${namespace}`);
    }

    // Update metadata
    await index.namespace(namespace).upsert([
      {
        id: pineconeId,
        values: existingVector.values,
        metadata: {
          ...existingVector.metadata,
          has_metrics: true,
          avg_performance: parseFloat(avgPerformance),
          updated_at: new Date().toISOString()
        }
      }
    ]);

    console.log(`✓ Updated performance metrics for copy ${copyOutputId} (avg: ${avgPerformance})`);

    return avgPerformance;
  } catch (error) {
    console.error('Error updating copy performance:', error);
    throw error;
  }
}

/**
 * Extract high-performing patterns from approved copy
 * This can be used to dynamically update copywriter prompts
 */
export async function extractHighPerformingPatterns(projectId, copyType) {
  try {
    const result = await db.query(
      `SELECT co.content, co.copy_brief, AVG(cm.metric_value) as avg_performance
       FROM copy_outputs co
       LEFT JOIN copy_metrics cm ON co.id = cm.copy_output_id
       WHERE co.approved = true
         AND co.copy_type = $1
         AND EXISTS (
           SELECT 1 FROM chat_threads ct
           WHERE ct.id = co.thread_id AND ct.project_id = $2
         )
       GROUP BY co.id, co.content, co.copy_brief
       HAVING AVG(cm.metric_value) > 0
       ORDER BY avg_performance DESC
       LIMIT 5`,
      [copyType, projectId]
    );

    const patterns = result.rows.map(row => ({
      content: row.content,
      brief: row.copy_brief,
      performance: parseFloat(row.avg_performance)
    }));

    return patterns;
  } catch (error) {
    console.error('Error extracting high-performing patterns:', error);
    throw error;
  }
}

/**
 * Generate dynamic prompt enhancement based on performance data
 */
export async function generatePromptEnhancement(projectId, copyType) {
  try {
    const patterns = await extractHighPerformingPatterns(projectId, copyType);

    if (patterns.length === 0) {
      return '';
    }

    let enhancement = '\n\n## HIGH-PERFORMING PATTERNS (learn from these):\n';

    patterns.forEach((pattern, index) => {
      enhancement += `\n[Pattern ${index + 1}] (Performance: ${pattern.performance.toFixed(2)}):\n${pattern.content.substring(0, 500)}...\n`;
    });

    enhancement += '\nIncorporate the successful elements from these high-performing examples into your copy.\n';

    return enhancement;
  } catch (error) {
    console.error('Error generating prompt enhancement:', error);
    return '';
  }
}

export default {
  calculateAveragePerformance,
  updateCopyPerformance,
  extractHighPerformingPatterns,
  generatePromptEnhancement
};
