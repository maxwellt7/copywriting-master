import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all projects for current user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get single project
router.get('/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Create new project
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name required' });
    }

    const projectId = uuidv4();
    const pineconeNamespace = `project-${projectId}`;

    const result = await db.query(
      'INSERT INTO projects (id, user_id, name, pinecone_namespace) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, req.user.userId, name, pineconeNamespace]
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;

    const result = await db.query(
      'UPDATE projects SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [name, projectId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:projectId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // TODO: Also delete from Pinecone namespace
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
      [projectId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
