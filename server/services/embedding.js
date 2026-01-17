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
 */
export async function generateEmbeddings(texts) {
  try {
    const response = await cohere.embed({
      texts: texts,
      model: 'embed-english-v3.0',
      inputType: 'search_document'
    });

    return response.embeddings;
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
