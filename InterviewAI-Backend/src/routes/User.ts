import { Router } from 'express';
import { createUser, deleteUser, getUser, getUserByEmail, updateUser, updateUserDetails } from '../controllers/User';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', createUser);

router.get('/:id', getUser);

router.get('/email/:email', getUserByEmail);

router.post('/update', updateUser);

// New route to update user details - requires authentication
router.put('/:id', updateUserDetails);

router.delete('/delete', deleteUser);

export const userRoutes = router;