import express from 'express';
import { userRoutes } from './User';
import { companyRoutes } from './Company';
import { employeeRoutes } from './Employee';
import { jobRoutes } from './Job';
import { interviewRoutes } from './Interview';
import { submissionRoutes } from './Submission';
import { systemDesignRoutes } from './SystemDesign';
import { cvRoutes } from './CvUploadAndParse';

const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to InterviewAI API' });
});

// API Routes
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/employees', employeeRoutes);
router.use('/jobs', jobRoutes);
router.use('/interviews', interviewRoutes);
router.use('/submissions', submissionRoutes);
router.use('/system-design', systemDesignRoutes);
router.use('/cv', cvRoutes);

export default router;
