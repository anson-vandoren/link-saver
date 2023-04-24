const express = require('express');
const multer = require('multer');
const {
  createLink, getLink, getLinks, updateLink, deleteLink, importLinks,
} = require('../controllers/link');
const authenticate = require('../middleware/authenticate');

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/', authenticate, createLink);
router.get('/', authenticate, getLinks);
router.get('/:id', authenticate, getLink);
router.put('/:id', authenticate, updateLink);
router.delete('/:id', authenticate, deleteLink);
// import links from Netscape HTML Bookmarks File
router.post('/import', authenticate, upload.single('file'), importLinks);

module.exports = router;
