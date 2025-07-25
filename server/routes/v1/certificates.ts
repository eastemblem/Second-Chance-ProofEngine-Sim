import { Router } from 'express';
import { asyncHandler } from '../middleware/error';
import { generateCertificate, downloadCertificate, getCertificateStatus } from '../../routes/certificate';

const router = Router();

// Certificate routes - EXACT SAME LOGIC as routes.ts
router.post('/generate', asyncHandler(generateCertificate));
router.get('/download/:filename', asyncHandler(downloadCertificate));
router.get('/status/:ventureId', asyncHandler(getCertificateStatus));

export default router;