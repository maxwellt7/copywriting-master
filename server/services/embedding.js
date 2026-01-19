import cohere from '../config/cohere.js';

/**
 * Generate embeddings using Cohere embed-english-v3.0 (1024 dimensions)
 */
export async function generateEmbedding(text) {
  try {
    const response = await cohere.embed({
      texts: [text],
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    });

    return response.embeddings[0];
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Cohere has a limit of 96 texts per batch, so we batch them
 */
export async function generateEmbeddings(texts) {
  try {
    const BATCH_SIZE = 96; // Cohere's maximum batch size
    const allEmbeddings = [];

    // Process in batches of 96
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      console.log(`Generating embeddings for batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} texts)`);

      const response = await cohere.embed({
        texts: batch,
        model: 'embed-english-v3.0',
        inputType: 'search_document'
      });

      allEmbeddings.push(...response.embeddings);
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Batch embedding generation error:', error);
    throw error;
  }
}

/**
 * Generate query embedding (different input type for retrieval)
 */
export async function generateQueryEmbedding(query) {
  try {
    const response = await cohere.embed({
      texts: [query],
      model: 'embed-english-v3.0',
      inputType: 'search_query'
    });

    return response.embeddings[0];
  } catch (error) {
    console.error('Query embedding generation error:', error);
    throw error;
  }
}

export default { generateEmbedding, generateEmbeddings, generateQueryEmbedding };
