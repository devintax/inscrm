import { Router } from 'express';
import Email from '../controllers/email'
import auth from '../middlewares/auth'
const router = Router();

router.get('/list', auth, Email.index)
router.post('/add', auth, Email.add)
router.get('/view/:id', auth, Email.view)
router.delete('/delete/:id', auth, Email.deleteData)
router.post('/deletemany', auth, Email.deleteMany)


export default router
