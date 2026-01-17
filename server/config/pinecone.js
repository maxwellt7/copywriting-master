import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

let pinecone = null;
let index = null;

async function initPinecone() {
  if (pinecone) return { pinecone, index };

  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    console.log('✓ Connected to Pinecone');

    return { pinecone, index };
  } catch (error) {
    console.error('Failed to initialize Pinecone:', error);
    throw error;
  }
}

export { initPinecone };
export default { initPinecone };
