import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fileUpload from 'express-fileupload';
import pdfParse from 'pdf-parse';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { chunkDocument, simpleChunk } from '../services/chunking.js';
import { generateEmbeddings } from '../services/embedding.js';
import { initPinecone } from '../config/pinecone.js';

const router = express.Router();

// Enable file upload
router.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true
}));

// Get all documents for a project
router.get('/:projectId', authenticateToken, async (req, res, next) => {
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
      'SELECT * FROM uploaded_documents WHERE project_id = $1 ORDER BY upload_date DESC',
      [projectId]
    );

    res.json({ documents: result.rows });
  } catch (error) {
    next(error);
  }
});

// Upload and process documents
router.post('/:projectId/upload', authenticateToken, async (req, res, next) => {
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

    const project = projectCheck.rows[0];

    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    const filename = file.name;
    const fileType = file.mimetype;

    // Extract text based on file type
    let text = '';

    if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(file.data);
      text = pdfData.text;
    } else if (fileType === 'text/plain' || fileType === 'text/markdown' || filename.endsWith('.md')) {
      text = file.data.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload .txt, .md, or .pdf files.' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text content found in file' });
    }

    // Chunk the document using AI
    console.log(`Chunking document: ${filename}`);
    let chunks;
    try {
      chunks = await chunkDocument(text, filename);
    } catch (chunkError) {
      console.error('AI chunking failed, using simple chunking:', chunkError);
      chunks = simpleChunk(text);
      chunks = chunks.map(chunk => ({
        ...chunk,
        metadata: { ...chunk.metadata, filename }
      }));
    }

    // Generate embeddings for all chunks
    console.log(`Generating embeddings for ${chunks.length} chunks`);
    const chunkTexts = chunks.map(chunk => chunk.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    // Store in Pinecone
    console.log(`Storing chunks in Pinecone namespace: ${project.pinecone_namespace}`);
    const { index } = await initPinecone();
    const vectors = chunks.map((chunk, i) => ({
      id: uuidv4(),
      values: embeddings[i],
      metadata: {
        type: 'source_document',
        project_id: projectId,
        filename: filename,
        chunk_index: chunk.metadata.chunk_index,
        total_chunks: chunks.length,
        content: chunk.content,
        chunk_type: chunk.metadata.type || 'auto',
        key_concepts: chunk.metadata.key_concepts || [],
        created_at: new Date().toISOString()
      }
    }));

    await index.namespace(project.pinecone_namespace).upsert(vectors);

    // Save document record
    const docId = uuidv4();
    await db.query(
      'INSERT INTO uploaded_documents (id, project_id, filename, file_type, chunk_count) VALUES ($1, $2, $3, $4, $5)',
      [docId, projectId, filename, fileType, chunks.length]
    );

    console.log(`✓ Document processed successfully: ${filename} (${chunks.length} chunks)`);

    res.status(201).json({
      message: 'Document uploaded and processed successfully',
      document: {
        id: docId,
        filename,
        chunk_count: chunks.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:projectId/:documentId', authenticateToken, async (req, res, next) => {
  try {
    const { projectId, documentId } = req.params;

    // Verify project ownership
    const projectCheck = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, req.user.userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete document
    // TODO: Also delete from Pinecone
    const result = await db.query(
      'DELETE FROM uploaded_documents WHERE id = $1 AND project_id = $2 RETURNING *',
      [documentId, projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
