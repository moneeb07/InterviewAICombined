import express from 'express';
import { uploadCv, getParsedCv, parseExistingCv } from '../controllers/CvUploadAndParse';

const router = express.Router();

router.post('/upload', uploadCv);

router.get('/:interviewId', getParsedCv);

router.post('/:interviewId/parse', parseExistingCv);

export const cvRoutes = router;
