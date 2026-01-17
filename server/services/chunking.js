import { callClaude } from '../config/anthropic.js';
import { DOCUMENT_CHUNKING_PROMPT } from '../utils/prompts.js';

/**
 * AI-powered document chunking service
 * Uses Claude to intelligently split documents into semantic chunks
 */
export async function chunkDocument(documentText, filename) {
  try {
    const userPrompt = `Document to chunk:\n\n${documentText}`;

    const response = await callClaude(DOCUMENT_CHUNKING_PROMPT, userPrompt, 0.3, 8000);

    // Parse JSON response
    let chunks;
    try {
      chunks = JSON.parse(response);
    } catch (parseError) {
      // If response isn't valid JSON, try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        chunks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse chunking response');
      }
    }

    // Add filename to metadata
    chunks = chunks.map((chunk, index) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        filename,
        chunk_index: index,
        total_chunks: chunks.length
      }
    }));

    return chunks;
  } catch (error) {
    console.error('Document chunking error:', error);
    throw error;
  }
}

/**
 * Simple fallback chunking (if AI chunking fails)
 * Splits text into ~1000 character chunks at sentence boundaries
 */
export function simpleChunk(text, chunkSize = 1000) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunk_index: chunks.length,
          type: 'auto',
          key_concepts: []
        }
      });
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunk_index: chunks.length,
        type: 'auto',
        key_concepts: []
      }
    });
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      chunk_index: index,
      total_chunks: chunks.length
    }
  }));
}

export default { chunkDocument, simpleChunk };
