import { Response } from 'express';
import { AuthenticatedRequest } from '../types/Requests';
import { Interview } from '../models/Interview';
import { Job } from '../models/Job';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { aiService } from '../services/ai.service';
import { FinalInterviewRequest } from '../types/Interview';

// GET /api/interviews - Get all interviews for the user
export const getAllInterviews = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user.id;
    
    // 1. Find all interviews where the user is the interviewee
    const intervieweeInterviews = await Interview.find({ user_id: userId })
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id',
          select: 'name'
        }
      })
      .populate('user_id')
      .sort({ date: 1 }); // Sort by date, upcoming first
    
    // Add role to each interview
    const intervieweeResults = intervieweeInterviews.map(interview => ({
      ...interview.toObject(),
      role: 'interviewee'
    }));
    
    // 2. Find companies owned by the user
    const ownedCompanies = await Company.find({ owner_id: userId });
    const ownedCompanyIds = ownedCompanies.map(company => company._id);
    
    // 3. Find companies where user is an employee
    const employeeRecords = await Employee.find({ user_id: userId });
    const employeeCompanyIds = employeeRecords.map(record => record.company_id);
    
    // 4. Find jobs from these companies
    const companyIds = [...ownedCompanyIds, ...employeeCompanyIds];
    const jobs = await Job.find({ company_id: { $in: companyIds } });
    const jobIds = jobs.map(job => job._id);
    
    // 5. Find interviews for these jobs (excluding where user is the interviewee)
    const interviewerInterviews = await Interview.find({
      job_id: { $in: jobIds },
      user_id: { $ne: userId } // Exclude interviews where user is the interviewee
    })
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id',
          select: 'name'
        }
      })
      .populate('user_id')
      .sort({ date: 1 });
    
    // Add role to each interview
    const interviewerResults = interviewerInterviews.map(interview => ({
      ...interview.toObject(),
      role: 'interviewer'
    }));
    
    // 6. Combine results
    const allInterviews = [...intervieweeResults, ...interviewerResults];
    
    res.status(200).json({
      status: 'success',
      data: allInterviews
    });
  } catch (error) {
    console.error('Error in getAllInterviews:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve interviews'
    });
  }
};

// POST /api/interviews - Create a new interview (only for company owners or employees)
export const createInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { job_id, user_id } = req.body;
    
    // Validate required fields
    if (!job_id || !user_id) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Job ID, User ID are required'
      });
    }
    
    // Check if valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(job_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job or user ID format'
      });
    }
    
    // Verify job exists
    const job = await Job.findById(job_id).populate('company_id');
    if (!job) {
      return res.status(404).json({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    // Verify user exists
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(404).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = job.company_id._id;
    
    // Check if current user is the owner of the company
    const isOwner = job.company_id.owner_id.toString() === userId.toString();
    
    // Check if current user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can create interviews'
      });
    }
    
    // Check if interview already exists
    const existingInterview = await Interview.findOne({
      job_id,
      user_id,
    });
    
    if (existingInterview) {
      return res.status(409).json({
        status: 'error',
        code: 'INTERVIEW_EXISTS',
        message: 'An interview already exists for this user and job on the given date'
      });
    }
    
    // Initialize rounds based on job's roundTypes
    const rounds = job.roundTypes.map(type => ({
      type,
      score: undefined,
      remarks: undefined,
      status: 'pending'
    }));
    
    // Create the interview
    const newInterview = new Interview({
      job_id,
      user_id,
      rounds
    });
    
    await newInterview.save();
    
    // Populate the job and company details for the response
    const populatedInterview = await Interview.findById(newInterview._id)
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id',
          select: 'name'
        }
      })
      .populate('user_id'); // Fully populate user data
    
    res.status(201).json({
      status: 'success',
      data: populatedInterview
    });
  } catch (error) {
    console.error('Error in createInterview:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create interview'
    });
  }
};

// GET /api/interviews/:id - Get an interview by ID (company owners/employees or the interviewee)
export const getInterviewById = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: interviewId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid interview ID format'
      });
    }
    
    // Find the interview with populated data
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id'
        }
      })
      .populate('user_id'); // Fully populate user data
    
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        code: 'INTERVIEW_NOT_FOUND',
        message: 'Interview not found'
      });
    }
    
    // Check if the current user is the interviewee
    const isInterviewee = interview.user_id._id.toString() === userId.toString();
    
    // Get the company ID from the job
    const companyId = interview.job_id.company_id._id;
    
    // Check if current user is the owner of the company
    const isOwner = interview.job_id.company_id.owner_id.toString() === userId.toString();
    
    // Check if current user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee nor interviewee, deny access
    if (!isOwner && !isEmployee && !isInterviewee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this interview'
      });
    }
    
    // Add the user's relationship to the interview data
    const result = {
      ...interview.toObject(),
      userRole: isInterviewee ? 'interviewee' : (isOwner ? 'owner' : 'employee')
    };
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getInterviewById:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve interview'
    });
  }
};

// PUT /api/interviews/:id - Update an interview (only for company owners or employees)
export const updateInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: interviewId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid interview ID format'
      });
    }
    
    // Find the interview
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id'
        }
      });
    
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        code: 'INTERVIEW_NOT_FOUND',
        message: 'Interview not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = interview.job_id.company_id._id;
    
    // Check if current user is the owner of the company
    const isOwner = interview.job_id.company_id.owner_id.toString() === userId.toString();
    
    // Check if current user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can update interviews'
      });
    }
    
    // Prepare update object
    const updateData: any = {};

    // Update the interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate({
      path: 'job_id',
      populate: {
        path: 'company_id',
        select: 'name'
      }
    })
    .populate('user_id'); // Fully populate user data
    
    res.status(200).json({
      status: 'success',
      data: updatedInterview
    });
  } catch (error) {
    console.error('Error in updateInterview:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update interview'
    });
  }
};

// DELETE /api/interviews/:id - Delete an interview (only for company owners or employees)
export const deleteInterview = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: interviewId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid interview ID format'
      });
    }
    
    // Find the interview
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id'
        }
      });
    
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        code: 'INTERVIEW_NOT_FOUND',
        message: 'Interview not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = interview.job_id.company_id._id;
    
    // Check if current user is the owner of the company
    const isOwner = interview.job_id.company_id.owner_id.toString() === userId.toString();
    
    // Check if current user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can delete interviews'
      });
    }
    
    // Delete the interview
    await Interview.findByIdAndDelete(interviewId);
    
    res.status(200).json({
      status: 'success',
      message: 'Interview successfully deleted'
    });
  } catch (error) {
    console.error('Error in deleteInterview:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete interview'
    });
  }
};

// PUT /api/interviews/:id/rounds - Update interview rounds (only for company owners or employees)
export const updateInterviewRounds = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { rounds } = req.body;

    // Validate request body
    if (!rounds || !Array.isArray(rounds)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request format. Rounds array is required.'
      });
    }

    // Find and update the interview
    const interview = await Interview.findById(id);
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        message: 'Interview not found'
      });
    }

    // Update only the relevant round and make sure that the rest are not deleted 
    const updatedRounds = interview.rounds.map(round => {
      const updatedRound = rounds.find(r => r.type === round.type);
      return updatedRound ? { ...round, ...updatedRound } : round;
    });

    // Update rounds
    interview.rounds = updatedRounds;
    await interview.save();

    res.status(200).json({
      status: 'success',
      data: interview
    });
  } catch (error) {
    console.error('Error updating interview rounds:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update interview rounds'
    });
  }
};

// PUT /api/interviews/:id/evaluate-final - Calculate final interview score
export const evaluateFinalInterviewScore = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: interviewId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid interview ID format'
      });
    }
    
    // Find the interview with populated data
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'job_id',
        populate: {
          path: 'company_id'
        }
      })
      .populate('user_id');
    
    if (!interview) {
      return res.status(404).json({
        status: 'error',
        code: 'INTERVIEW_NOT_FOUND',
        message: 'Interview not found'
      });
    }
    
    // Check if the current user is the interviewee or an authorized person
    const isInterviewee = interview.user_id._id.toString() === userId.toString();
    const companyId = interview.job_id.company_id._id;
    const isOwner = interview.job_id.company_id.owner_id.toString() === userId.toString();
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee nor interviewee, deny access
    if (!isOwner && !isEmployee && !isInterviewee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to evaluate this interview'
      });
    }

    // Check if all rounds are completed
    const allRoundsCompleted = interview.rounds.every(round => round.status === 'completed');
    if (!allRoundsCompleted) {
      return res.status(400).json({
        status: 'error',
        code: 'INCOMPLETE_ROUNDS',
        message: 'All interview rounds must be completed before final evaluation'
      });
    }

    // Prepare the data for AI evaluation
    const job = interview.job_id;
    const jobFramework = job.framework.join(', ');

    const finalInterviewData: FinalInterviewRequest = {
      job_description: job.description,
      job_role: job.role,
      framework: jobFramework,
      parsed_cv: interview.parsed_cv,
      rounds: interview.rounds.map(round => ({
        type: round.type,
        score: round.score || 0,
        remarks: round.remarks || 'No remarks provided'
      }))
    };

    // Call the AI service to evaluate
    const evaluation = await aiService.evaluateFinalInterview(finalInterviewData);

    // Update the interview with the evaluation results
    interview.score = evaluation.score;
    interview.remarks = evaluation.remarks;
    interview.status = 'completed';
    await interview.save();

    res.status(200).json({
      status: 'success',
      data: {
        score: evaluation.score,
        remarks: evaluation.remarks
      }
    });
  } catch (error) {
    console.error('Error evaluating final interview:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to evaluate final interview'
    });
  }
};