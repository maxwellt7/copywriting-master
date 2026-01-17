import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { updateCopyPerformance } from '../services/metricsProcessor.js';

const router = express.Router();

// Submit performance metrics for copy
router.post('/:copyId', authenticateToken, async (req, res, next) => {
  try {
    const { copyId } = req.params;
    const { metricType, metricValue, notes } = req.body;

    if (!metricType || metricValue === undefined) {
      return res.status(400).json({ error: 'Metric type and value required' });
    }

    // Verify ownership and get copy info
    const copyCheck = await db.query(
      `SELECT co.*, p.id as project_id
       FROM copy_outputs co
       JOIN chat_threads ct ON co.thread_id = ct.id
       JOIN projects p ON ct.project_id = p.id
       WHERE co.id = $1 AND p.user_id = $2`,
      [copyId, req.user.userId]
    );

    if (copyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Copy not found' });
    }

    const copy = copyCheck.rows[0];

    if (!copy.approved) {
      return res.status(400).json({ error: 'Can only submit metrics for approved copy' });
    }

    // Save metric
    const metricId = uuidv4();
    await db.query(
      'INSERT INTO copy_metrics (id, copy_output_id, metric_type, metric_value, notes) VALUES ($1, $2, $3, $4, $5)',
      [metricId, copyId, metricType, metricValue, notes]
    );

    // Update Pinecone metadata
    if (copy.pinecone_id) {
      await updateCopyPerformance(copyId, copy.pinecone_id, copy.project_id);
    }

    console.log(`✓ Metrics submitted for copy ${copyId}: ${metricType} = ${metricValue}`);

    res.status(201).json({
      message: 'Metrics submitted successfully',
      metric: {
        id: metricId,
        metric_type: metricType,
        metric_value: metricValue
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all metrics for a copy
router.get('/:copyId', authenticateToken, async (req, res, next) => {
  try {
    const { copyId } = req.params;

    // Verify ownership
    const copyCheck = await db.query(
      `SELECT co.* FROM copy_outputs co
       JOIN chat_threads ct ON co.thread_id = ct.id
       JOIN projects p ON ct.project_id = p.id
       WHERE co.id = $1 AND p.user_id = $2`,
      [copyId, req.user.userId]
    );

    if (copyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Copy not found' });
    }

    const result = await db.query(
      'SELECT * FROM copy_metrics WHERE copy_output_id = $1 ORDER BY recorded_at DESC',
      [copyId]
    );

    res.json({ metrics: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
