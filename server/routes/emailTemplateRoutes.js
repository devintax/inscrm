import { Router } from 'express';
import emailTemplate from '../controllers/emailTemplate';
import auth from '../middlewares/auth';
const router = Router();

router.get('/list', auth, emailTemplate.index)
router.post('/add', auth, emailTemplate.add)
router.get('/view/:id', auth, emailTemplate.view)
router.put('/edit/:id', auth, emailTemplate.edit)
router.delete('/delete/:id', auth, emailTemplate.deleteData)
router.post('/deletemanny', auth, emailTemplate.deleteMany)


export default router
