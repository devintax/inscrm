import { Router } from 'express';
import Users from '../controllers/users';
import auth from '../middlewares/auth';
import rateLimit from 'express-rate-limit';
import visitorKey from '../middlewares/visitorKey';
const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT || 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: visitorKey,
  skipSuccessfulRequests: true,
  message: { message: 'Too many failed login attempts. Try again later.' },
});

router.get('/list', auth, Users.index)
router.get('/view/:id', auth, Users.view)
router.put('/edit/:id', auth, Users.edit)
router.delete('/delete/:id', auth, Users.deleteData)
router.post('/register', auth, Users.register)
router.post('/login', loginLimiter, Users.login)

export default router
