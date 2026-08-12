import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import externalLeadAuth from '../middlewares/externalLeadAuth';
import { ingest } from '../controllers/externalLeads';
import visitorKey from '../middlewares/visitorKey';

const router = Router();
router.post('/leads', externalLeadAuth, rateLimit({
  windowMs: 60_000, max: Number(process.env.LEAD_INGEST_RATE_LIMIT || 60),
  standardHeaders: true, legacyHeaders: false, keyGenerator: visitorKey,
}), ingest);
export default router;
