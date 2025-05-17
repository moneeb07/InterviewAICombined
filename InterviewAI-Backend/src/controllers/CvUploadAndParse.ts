import { Request, Response } from 'express';
import { Interview } from '../models/Interview';
import { aiService } from '../services/ai.service';
import { v4 as uuidv4 } from 'uuid';
import { CVUploadRequest, CVResponse } from '../types/CV';
import { uploadPdfToCloudinary } from '../utils/cloudinary.util';
import { AuthenticatedRequest } from '../types/Requests';

/**
 * Upload a CV for an interview
 * @param req Request with interview ID and base64 CV data
 * @param res Response
 */
export const uploadCv = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { interviewId, cvBase64 } = req.body as CVUploadRequest;

    if (!interviewId || !cvBase64) {
      return res.status(400).json({
        status: 'error',
        message: 'Interview ID and CV data are required'
      });
    }

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        status: 'error', 
        message: 'Interview not found'
      });
    }

    // Convert base64 to buffer
    // Remove data:application/pdf;base64, prefix if present
    const base64Data = cvBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Upload PDF buffer to Cloudinary
    const cvUrl = await uploadPdfToCloudinary(pdfBuffer);

    // Save Cloudinary URL to interview
    interview.cv_url = cvUrl;
    await interview.save();

    // Parse CV with AI service and update interview record
    try {
      const parsedCv = await aiService.parseCv(cvUrl);
      interview.parsed_cv = parsedCv;
      await interview.save();
      
      const responseData: CVResponse = {
        interviewId,
        cvUrl,
        parsedCv
      };

      return res.status(200).json({
        status: 'success',
        data: responseData
      });
    } catch (parseError) {
      console.error('Error parsing CV:', parseError);
      
      // Return success for upload even if parsing fails
      const responseData: CVResponse = {
        interviewId,
        cvUrl,
        parsedCv: null
      };

      return res.status(200).json({
        status: 'partial_success',
        message: 'CV uploaded successfully but parsing failed',
        data: responseData
      });
    }
  } catch (error) {
    console.error('Error uploading CV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to upload CV'
    });
  }
};

/**
 * Get the parsed CV for an interview
 * @param req Request with interview ID
 * @param res Response
 */
export const getParsedCv = async (req: Request, res: Response) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        status: 'error',
        message: 'Interview ID is required'
      });
    }

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    // Check if CV exists
    if (!interview.cv_url) {
      return res.status(404).json({
        status: 'error',
        message: 'No CV found for this interview'
      });
    }

    // Return parsed CV if available, otherwise return only the URL
    const responseData: CVResponse = {
      interviewId,
      cvUrl: interview.cv_url,
      parsedCv: interview.parsed_cv || null
    };

    return res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Error getting parsed CV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get CV information'
    });
  }
};

/**
 * Manually trigger parsing for an interview CV that already has a URL
 * @param req Request with interview ID
 * @param res Response
 */
export const parseExistingCv = async (req: Request, res: Response) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId) {
      return res.status(400).json({
        status: 'error',
        message: 'Interview ID is required'
      });
    }

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    // Check if CV URL exists
    if (!interview.cv_url) {
      return res.status(404).json({
        status: 'error',
        message: 'No CV URL found for this interview'
      });
    }

    // Parse CV with AI service
    const parsedCv = await aiService.parseCv(interview.cv_url);
    
    // Update interview with parsed CV data
    interview.parsed_cv = parsedCv;
    await interview.save();

    const responseData: CVResponse = {
      interviewId,
      cvUrl: interview.cv_url,
      parsedCv
    };

    return res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Error parsing existing CV:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to parse CV'
    });
  }
};