import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateCopyWithQualityControl } from '../services/copyChief.js';

const router = express.Router();

// Get all threads for a project
router.get('/:projectId/threads', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project ownership
    const projectCheck = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await db.query(
      'SELECT * FROM chat_threads WHERE project_id = $1 ORDER BY updated_at DESC',
      [projectId]
    );

    res.json({ threads: result.rows });
  } catch (error) {
    next(error);
  }
});

// Create new thread
router.post('/:projectId/threads', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title } = req.body;

    // Verify project ownership
    const projectCheck = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const threadId = uuidv4();
    const result = await db.query(
      'INSERT INTO chat_threads (id, project_id, title) VALUES ($1, $2, $3) RETURNING *',
      [threadId, projectId, title || 'New Conversation']
    );

    res.status(201).json({ thread: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Get messages for a thread
router.get('/threads/:threadId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { threadId } = req.params;

    // Verify thread ownership through project
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
      'SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at ASC',
      [threadId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
});

// Send message and generate copy
router.post('/threads/:threadId/messages', authenticateToken, async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { content, copyType } = req.body;

    if (!content || !copyType) {
      return res.status(400).json({ error: 'Message content and copy type required' });
    }

    // Verify thread ownership and get project
    const threadCheck = await db.query(
      `SELECT ct.*, p.id as project_id FROM chat_threads ct
       JOIN projects p ON ct.project_id = p.id
       WHERE ct.id = $1 AND p.user_id = $2`,
      [threadId, req.user.userId]
    );

    if (threadCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const thread = threadCheck.rows[0];
    const projectId = thread.project_id;

    // Save user message
    const userMessageId = uuidv4();
    await db.query(
      'INSERT INTO messages (id, thread_id, role, content) VALUES ($1, $2, $3, $4)',
      [userMessageId, threadId, 'user', content]
    );

    // Update thread title if it's the first message
    const messageCount = await db.query(
      'SELECT COUNT(*) FROM messages WHERE thread_id = $1',
      [threadId]
    );

    if (parseInt(messageCount.rows[0].count) === 1) {
      const autoTitle = content.substring(0, 50) + (content.length > 50 ? '...' : '');
      await db.query(
        'UPDATE chat_threads SET title = $1 WHERE id = $2',
        [autoTitle, threadId]
      );
    }

    // Generate copy using Copy Chief orchestrator
    console.log(`Generating ${copyType} for thread ${threadId}`);
    const result = await generateCopyWithQualityControl(content, copyType, projectId);

    // Save copy output
    const copyOutputId = uuidv4();
    await db.query(
      `INSERT INTO copy_outputs
       (id, thread_id, copy_type, content, quality_score, copy_brief, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        copyOutputId,
        threadId,
        copyType,
        JSON.stringify(result.draft),
        result.evaluation.total_score,
        JSON.stringify(result.brief),
        result.evaluation.approved
      ]
    );

    // Save assistant message
    const assistantMessageId = uuidv4();
    const responseContent = `I've generated ${copyType} copy for you.\n\nQuality Score: ${result.evaluation.total_score}/100\nAttempts: ${result.attempts}\n\n${result.warning ? '⚠ ' + result.warning : ''}`;

    await db.query(
      'INSERT INTO messages (id, thread_id, role, content) VALUES ($1, $2, $3, $4)',
      [assistantMessageId, threadId, 'assistant', responseContent]
    );

    // Update thread timestamp
    await db.query(
      'UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [threadId]
    );

    res.status(201).json({
      message: {
        id: assistantMessageId,
        role: 'assistant',
        content: responseContent
      },
      copyOutput: {
        id: copyOutputId,
        draft: result.draft,
        brief: result.brief,
        evaluation: result.evaluation,
        attempts: result.attempts,
        warning: result.warning
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete thread
router.delete('/threads/:threadId', authenticateToken, async (req, res, next) => {
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

    await db.query('DELETE FROM chat_threads WHERE id = $1', [threadId]);

    res.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
