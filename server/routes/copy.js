import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateEmbedding } from '../services/embedding.js';
import { initPinecone } from '../config/pinecone.js';

const router = express.Router();

// Get copy output by ID
router.get('/:copyId', authenticateToken, async (req, res, next) => {
  try {
    const { copyId } = req.params;

    // Verify ownership
    const result = await db.query(
      `SELECT co.* FROM copy_outputs co
       JOIN chat_threads ct ON co.thread_id = ct.id
       JOIN projects p ON ct.project_id = p.id
       WHERE co.id = $1 AND p.user_id = $2`,
      [copyId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Copy not found' });
    }

    const copy = result.rows[0];

    // Parse JSON fields
    copy.content = JSON.parse(copy.content);
    copy.copy_brief = JSON.parse(copy.copy_brief);

    res.json({ copy });
  } catch (error) {
    next(error);
  }
});

// Approve copy and store in Pinecone
router.post('/:copyId/approve', authenticateToken, async (req, res, next) => {
  try {
    const { copyId } = req.params;

    // Verify ownership and get copy with project info
    const result = await db.query(
      `SELECT co.*, p.id as project_id, p.pinecone_namespace
       FROM copy_outputs co
       JOIN chat_threads ct ON co.thread_id = ct.id
       JOIN projects p ON ct.project_id = p.id
       WHERE co.id = $1 AND p.user_id = $2`,
      [copyId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Copy not found' });
    }

    const copy = result.rows[0];

    if (copy.approved) {
      return res.status(400).json({ error: 'Copy already approved' });
    }

    // Generate embedding for the copy content
    const copyText = typeof copy.content === 'string' ? copy.content : JSON.stringify(copy.content);
    const embedding = await generateEmbedding(copyText);

    // Store in Pinecone
    const { index } = await initPinecone();
    const vectorId = uuidv4();

    await index.namespace(copy.pinecone_namespace).upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: {
          type: 'approved_copy',
          project_id: copy.project_id,
          copy_type: copy.copy_type,
          quality_score: copy.quality_score,
          has_metrics: false,
          content: copyText,
          created_at: new Date().toISOString()
        }
      }
    ]);

    // Update database
    await db.query(
      `UPDATE copy_outputs
       SET approved = true, approved_at = CURRENT_TIMESTAMP, pinecone_id = $1
       WHERE id = $2`,
      [vectorId, copyId]
    );

    console.log(`✓ Copy ${copyId} approved and stored in Pinecone`);

    res.json({
      message: 'Copy approved successfully',
      pinecone_id: vectorId
    });
  } catch (error) {
    next(error);
  }
});

// Get all copy outputs for a thread
router.get('/thread/:threadId', authenticateToken, async (req, res, next) => {
  try {
    const { threadId } = req.params;

    // Verify ownership
    const threadCheck = await db.query(
      `SELECT ct.* FROM chat_threads ct
       JOIN projects p ON ct.project_id = p.id
       WHERE ct.id = $1 AND p.user_id = $2`,
      [threadId, req.user.userId]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = await db.query(
      'SELECT * FROM copy_outputs WHERE thread_id = $1 ORDER BY created_at DESC',
      [threadId]
    );

    const copies = result.rows.map(copy => ({
      ...copy,
      content: JSON.parse(copy.content),
      copy_brief: JSON.parse(copy.copy_brief)
    }));

    res.json({ copies });
  } catch (error) {
    next(error);
  }
});

export default router;
