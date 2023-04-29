import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/user.js';

const route = Router();

// Register route
route.post('/register', registerUser);

// Login route
route.post('/login', loginUser);

export default route;
