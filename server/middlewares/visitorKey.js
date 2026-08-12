export default function visitorKey(req) {
  return req.get('cf-connecting-ip') || req.socket.remoteAddress || 'unknown';
}
