import { Request, Response } from "express";
import { SystemDesignSubmission, SystemDesignSubmissionAIRequest } from "../types/SystemDesign";
import { AuthenticatedRequest } from "../types/Requests";
import { SYSTEM_DESIGN_QUESTIONS } from "../constants/SystemDesign";
import { uploadImagesToCloudinary } from "../utils/cloudinary.util";
import { aiService } from "../services/ai.service";
import { Interview } from "../models/Interview";
import mongoose from "mongoose";

interface SystemDesignRequest extends AuthenticatedRequest {
    body: {
        interviewId: string;
        submissions: SystemDesignSubmission[];
    }
}

export const submitSystemDesign = async (req: SystemDesignRequest, res: Response) => {
    try {
        const { interviewId, submissions } = req.body;

        // Validate interviewId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(interviewId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid interview ID'
            });
        }

        // Extract base64 images from the submissions
        const images = submissions.map(submission => submission.designed_system_image_base64);

        // Upload the images to cloudinary
        const uploadedImageUrls = await uploadImagesToCloudinary(images);

        // Map submissions to AI request format with Cloudinary URLs instead of base64
        const aiRequests: SystemDesignSubmissionAIRequest[] = submissions.map((submission, index) => ({
            question: submission.question,
            answer: submission.answer,
            designed_system_image_url: uploadedImageUrls[index]
        }));

        // Send to AI service for evaluation
        const evaluationResult = await aiService.evaluateSystemDesign(aiRequests);

        // Find the interview
        const interview = await Interview.findById(interviewId);
        if (!interview) {
            return res.status(404).json({
                status: 'error',
                message: 'Interview not found'
            });
        }

        // Find the SystemDesign round and update it
        const systemDesignRoundIndex = interview.rounds.findIndex(round => round.type === 'SystemDesign');
        
        if (systemDesignRoundIndex === -1) {
            return res.status(404).json({
                status: 'error',
                message: 'SystemDesign round not found in this interview'
            });
        }

        // Update the round with the evaluation results
        interview.rounds[systemDesignRoundIndex].score = evaluationResult.grade;
        interview.rounds[systemDesignRoundIndex].remarks = evaluationResult.feedback;
        interview.rounds[systemDesignRoundIndex].status = 'completed';
        
        // Save the updated interview
        await interview.save();

        res.status(200).json({ 
            status: 'success',
            message: "System design submitted and evaluated successfully"
        });
    } catch (error) {
        console.error("Error processing system design submission:", error);
        res.status(500).json({
            status: 'error',
            message: "Failed to process system design submission"
        });
    }
}

export const getSystemDesignQuestions = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 5;

        if (limit > SYSTEM_DESIGN_QUESTIONS.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Limit is greater than the number of questions'
            });
        }
        
        const questions = SYSTEM_DESIGN_QUESTIONS.slice(0, limit);
        
        res.status(200).json({
            status: 'success',
            data: questions
        });
    } catch (error) {
        console.error('Error fetching system design questions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch system design questions'
        });
    }
}