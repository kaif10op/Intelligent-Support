import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth.js';
import { createKB, getMyKBs, getKBDetails, deleteKB, deleteDocument, reindexDocuments, createKBVersion, getKBVersions, getKBVersionDetails } from '../controllers/kb.js';
import { uploadDocument } from '../controllers/upload.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth as any);

router.post('/', createKB as any);
router.get('/', getMyKBs as any);
router.get('/:id', getKBDetails as any);
router.delete('/:id', deleteKB as any);
router.delete('/doc/:id', deleteDocument as any);
router.put('/:id/reindex', reindexDocuments as any);

// KB Versioning routes
router.post('/:id/versions', createKBVersion as any);
router.get('/:id/versions', getKBVersions as any);
router.get('/:id/versions/:versionNumber', getKBVersionDetails as any);

router.post('/upload', upload.single('file'), uploadDocument as any);


export default router;
