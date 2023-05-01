import { Router } from 'express';
import { getTags, purgeUnusedTags } from '../controllers/tag.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', getTags);
router.delete('/purge-unused', authenticate, purgeUnusedTags);

export default router;
