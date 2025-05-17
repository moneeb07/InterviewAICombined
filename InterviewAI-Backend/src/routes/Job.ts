import { Router } from 'express';
import {
  getAllJobs,
  createJob,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/Job';
const router = Router();

// GET /api/jobs - Get all jobs for the user

router.get('/', getAllJobs);

// POST /api/jobs - Create a new job
router.post('/', createJob);

// GET /api/jobs/:id - Get a job by ID
router.get('/:id', getJobById);

// PUT /api/jobs/:id - Update a job by ID
router.put('/:id', updateJob);

// DELETE /api/jobs/:id - Delete a job by ID
router.delete('/:id', deleteJob);

export const jobRoutes = router;
