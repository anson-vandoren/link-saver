const express = require('express');
const multer = require('multer');
const {
  createLink, exportLinks, getLink, getLinks, updateLink, deleteLink, importLinks,
} = require('../controllers/link');
const { authenticate, authenticateOptional } = require('../middleware/authenticate');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', authenticate, createLink);
router.get('/', authenticateOptional, getLinks);
router.get('/export', authenticate, exportLinks);
router.get('/:id', authenticate, getLink);
router.put('/:id', authenticate, updateLink);
router.delete('/:id', authenticate, deleteLink);
// import links from Netscape HTML Bookmarks File
router.post('/import', authenticate, upload.single('file'), importLinks);

module.exports = router;
