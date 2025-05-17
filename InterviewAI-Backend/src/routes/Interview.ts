import { Router } from 'express';
import {
  getAllInterviews,
  createInterview,
  getInterviewById,
  updateInterview,
  deleteInterview,
  updateInterviewRounds,
  evaluateFinalInterviewScore,
} from '../controllers/Interview';

const router = Router();

// GET /api/interview - Get all interviews
router.get('/', getAllInterviews);

// POST /api/interview - Create a new interview
router.post('/',  createInterview);

// GET /api/interview/:id - Get an interview by ID
router.get('/:id',  getInterviewById);

// PUT /api/interview/:id - Update an interview by ID
router.put('/:id',  updateInterview);

// PUT /api/interview/:id/rounds - Update interview rounds
router.put('/:id/rounds', updateInterviewRounds);

// PUT /api/interview/:id/evaluate-final - Calculate final interview score
router.put('/:id/evaluate-final', evaluateFinalInterviewScore);

// DELETE /api/interview/:id - Delete an interview by ID
router.delete('/:id',  deleteInterview);

export const interviewRoutes = router;
