import { Router } from "express";
import { submitCode, getSubmission, getInterviewSubmissions } from "../controllers/submissionController";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Submit code for evaluation
router.post("/", submitCode);

// Get submission result
router.get("/:submissionId", getSubmission);

// Get all submissions for a specific interview
router.get("/interview/:interviewId", getInterviewSubmissions);

export const submissionRoutes = router;
