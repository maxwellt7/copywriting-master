import { initPinecone } from '../config/pinecone.js';
import { generateQueryEmbedding } from './embedding.js';

/**
 * Retrieve relevant context from Pinecone using semantic search
 */
export async function retrieveContext(query, projectId, topK = 10, includeApprovedCopy = true) {
  try {
    const { index } = await initPinecone();
    const namespace = `project-${projectId}`;

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Build filter
    let filter = {};
    if (!includeApprovedCopy) {
      filter = { type: { $eq: 'source_document' } };
    }

    // Query Pinecone
    const results = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined
    });

    // Format results
    const context = results.matches.map(match => ({
      content: match.metadata.content || match.metadata.text || '',
      score: match.score,
      metadata: match.metadata,
      id: match.id
    }));

    return context;
  } catch (error) {
    console.error('Context retrieval error:', error);
    throw error;
  }
}

/**
 * Retrieve high-performing approved copy for pattern learning
 */
export async function retrieveHighPerformingCopy(projectId, copyType = null, topK = 5) {
  try {
    const { index } = await initPinecone();
    const namespace = `project-${projectId}`;

    // Build filter for approved copy with metrics
    let filter = {
      type: { $eq: 'approved_copy' },
      has_metrics: { $eq: true }
    };

    if (copyType) {
      filter.copy_type = { $eq: copyType };
    }

    // Get all approved copy with metrics (we'll sort by performance)
    // Note: Pinecone doesn't support sorting by metadata, so we retrieve more and filter
    const results = await index.namespace(namespace).query({
      vector: new Array(1024).fill(0), // Dummy vector to get all
      topK: 100,
      includeMetadata: true,
      filter: filter
    });

    // Sort by avg_performance and take topK
    const sortedResults = results.matches
      .filter(match => match.metadata.avg_performance !== undefined)
      .sort((a, b) => b.metadata.avg_performance - a.metadata.avg_performance)
      .slice(0, topK);

    return sortedResults.map(match => ({
      content: match.metadata.content || match.metadata.text || '',
      score: match.metadata.avg_performance,
      metadata: match.metadata,
      id: match.id
    }));
  } catch (error) {
    console.error('High-performing copy retrieval error:', error);
    throw error;
  }
}

export default { retrieveContext, retrieveHighPerformingCopy };
