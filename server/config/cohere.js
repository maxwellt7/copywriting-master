import { CohereClient } from 'cohere-ai';
import dotenv from 'dotenv';

dotenv.config();

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

console.log('✓ Cohere client initialized');

export default cohere;
