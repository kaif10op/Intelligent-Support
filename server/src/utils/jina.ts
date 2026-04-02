import axios from 'axios';
import { logger } from './logger.js';

const JINA_API_KEY = process.env.JINA_API_KEY;

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  if (!JINA_API_KEY) throw new Error('JINA_API_KEY is not set');

  try {
    const response = await axios.post(
      'https://api.jina.ai/v1/embeddings',
      {
        model: 'jina-embeddings-v2-base-en',
        input: texts,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${JINA_API_KEY}`,
        },
      }
    );

    return response.data.data.map((item: any) => item.embedding);
  } catch (error: any) {
    logger.error('Error fetching embeddings from Jina', { 
      error: error.response?.data || error.message,
      stack: error.stack 
    });
    throw new Error('Failed to generate embeddings');
  }
};
