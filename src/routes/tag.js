import { Router } from 'express';
import getTags from '../controllers/tag.js';

const router = Router();

router.get('/', getTags);

export default router;
