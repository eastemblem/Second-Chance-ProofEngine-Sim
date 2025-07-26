import { Router } from 'express';
import { asyncHandler } from '../../utils/error-handler';
import { generateReport } from '../../routes/report';

const router = Router();

// Report routes - EXACT SAME LOGIC as routes.ts
router.post('/generate', asyncHandler(generateReport));

export default router;