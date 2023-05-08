import { Router } from 'express';
import multer from 'multer';
import {
  createLink, exportLinks, getLink, getLinks,
  importLinks,
} from '../controllers/link.js';
import { authenticate, authenticateOptional } from '../middleware/authenticate.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/', authenticate, createLink);
router.get('/', authenticateOptional, getLinks);
// Export links as Netscape HTML Bookmarks File
// Must be above the get('/:id') route
router.get('/export', authenticate, exportLinks);
router.get('/:id', authenticate, getLink);
// import links from Netscape HTML Bookmarks File
router.post('/import', authenticate, upload.single('file'), importLinks);

export default router;
