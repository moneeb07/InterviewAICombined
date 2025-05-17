import { Router } from "express";
import { getSystemDesignQuestions, submitSystemDesign } from "../controllers/SystemDesign";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Submit code for evaluation
router.post("/", submitSystemDesign);

router.get("/", getSystemDesignQuestions);

export const systemDesignRoutes = router;
