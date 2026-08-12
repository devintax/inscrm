import crypto from 'crypto';

const safeEqual = (actual, expected) => {
  const left = Buffer.from(actual || '');
  const right = Buffer.from(expected || '');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

export default function externalLeadAuth(req, res, next) {
  const configured = process.env.LEAD_INGEST_SECRET;
  const authorization = req.get('authorization') || '';
  const bearer = authorization.replace(/^Bearer\s+/i, '');
  // InsForge Realtime webhooks cannot attach custom Authorization headers.
  // Keep this server-to-server fallback scoped to the ingest route.
  const supplied = bearer || req.query.ingest_token || '';

  if (!configured || !safeEqual(supplied, configured)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
}
