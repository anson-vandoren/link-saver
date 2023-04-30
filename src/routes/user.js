import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { registerUser, loginUser, changePassword } from '../controllers/user.js';

const route = Router();

route.post('/register', registerUser);
route.post('/login', loginUser);
route.put('/change-password', authenticate, changePassword);

export default route;
