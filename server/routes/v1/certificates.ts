import { Router } from 'express';
import { asyncHandler } from '../../utils/error-handler';
import { generateCertificate, downloadCertificate, getCertificateStatus } from '../../routes/certificate';

const router = Router();

// Certificate routes - EXACT SAME LOGIC as routes.ts
router.post('/generate', asyncHandler(generateCertificate));
router.get('/download/:filename', asyncHandler(downloadCertificate));
router.get('/status/:ventureId', asyncHandler(getCertificateStatus));

export default router;