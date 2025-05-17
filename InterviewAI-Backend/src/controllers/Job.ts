import { Response } from 'express';
import { AuthenticatedRequest } from '../types/Requests';
import { Job } from '../models/Job';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { Interview } from '../models/Interview';
import mongoose from 'mongoose';

// GET /api/jobs - Get all jobs for a user (applied for, owned companies, employed at)
export const getAllJobs = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    
    const userId = req.user._id;
    // 1. Find jobs the user has applied for (has interviews for)
    const userInterviews = await Interview.find({ user_id: userId });
    const appliedJobIds = userInterviews.map(interview => interview.job_id);
    const appliedJobs = await Job.find({ _id: { $in: appliedJobIds } }).populate('company_id');
    
    // 2. Find companies where user is an owner
    const ownedCompanies = await Company.find({ owner_id: userId });
    const ownedCompanyIds = ownedCompanies.map(company => company._id);
    
    // 3. Find companies where user is an employee
    const employeeRecords = await Employee.find({ user_id: userId });
    const employeeCompanyIds = employeeRecords.map(record => record.company_id);
    
    // 4. Find jobs posted by companies where user is owner or employee
    const companyJobs = await Job.find({
      company_id: { $in: [...ownedCompanyIds, ...employeeCompanyIds] }
    }).populate('company_id');
    
    // 5. Categorize the jobs
    const ownedCompanyJobs = companyJobs.filter(job => 
      ownedCompanyIds.some(id => id.toString() === job.company_id._id.toString())
    );
    
    const employeeCompanyJobs = companyJobs.filter(job => 
      employeeCompanyIds.some(id => id.toString() === job.company_id._id.toString())
    );
    
    // 6. Return categorized jobs
    res.status(200).json({
      status: 'success',
      data: {
        appliedJobs,
        ownedCompanyJobs,
        employeeCompanyJobs
      }
    });
  } catch (error) {
    console.error('Error in getAllJobs:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve jobs'
    });
  }
};
// POST /api/jobs - Create a new job (for company owners or employees)
export const createJob = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { name, description, company_id, role, framework, roundTypes, deadline } = req.body;
    
    // Validate required fields
    if (!name || !description || !company_id || !role || !framework || !deadline) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Job name, description, company ID, role, framework, and deadline are required'
      });
    }
    
    // Check if deadline is a valid date
    if (isNaN(Date.parse(deadline))) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_DATE_FORMAT',
        message: 'Deadline must be a valid date'
      });
    }
    
    // Validate roundTypes if provided
    if (roundTypes && !Array.isArray(roundTypes)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_FORMAT',
        message: 'Round types must be an array'
      });
    }
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(company_id)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid company ID format'
      });
    }
    
    // Verify company exists
    const company = await Company.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }
    
    // Check if user is the owner of the company
    const isOwner = company.owner_id.toString() === userId.toString();
    
    // Check if user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can create jobs'
      });
    }

    console.log("ROUND TYPES", roundTypes)
    
    // Create the job
    const newJob = new Job({
      name,
      description,
      company_id,
      role,
      framework,
      roundTypes: roundTypes,
      deadline
    });
    
    await newJob.save();
    
    res.status(201).json({
      status: 'success',
      data: newJob
    });
  } catch (error) {
    console.error('Error in createJob:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create job'
    });
  }
};

// GET /api/jobs/:id - Get a job by ID (only for owners or employees)
export const getJobById = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: jobId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job ID format'
      });
    }
    
    // Find the job and populate company info
    const job = await Job.findById(jobId).populate('company_id');
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = job.company_id._id;
    
    // Check if user is the owner of the company
    const company = await Company.findById(companyId);
    const isOwner = company?.owner_id.toString() === userId.toString();
    
    // Check if user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // Check if user has applied to this job
    const hasApplied = await Interview.exists({
      job_id: jobId,
      user_id: userId
    });
    
    // If user is neither owner nor employee nor applicant, deny access
    if (!isOwner && !isEmployee && !hasApplied) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this job'
      });
    }
    
    // Include user's relationship to the job
    const result = {
      ...job.toObject(),
      relationship: isOwner ? 'owner' : (isEmployee ? 'employee' : 'applicant')
    };
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getJobById:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve job'
    });
  }
};

// PUT /api/jobs/:id - Update a job (only for owners or employees)
export const updateJob = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: jobId } = req.params;
    const updates = req.body;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job ID format'
      });
    }
    
    // Find the job
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = job.company_id;
    
    // Check if user is the owner of the company
    const company = await Company.findById(companyId);
    const isOwner = company?.owner_id.toString() === userId.toString();
    
    // Check if user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can update jobs'
      });
    }
    
    // Permitted fields to update
    const allowedUpdates = ['name', 'description', 'role', 'framework', 'roundTypes', 'deadline'];
    
    // Filter updates to only include allowed fields
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);
    
    // Check if deadline is a valid date
    if (filteredUpdates.deadline && isNaN(Date.parse(filteredUpdates.deadline))) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_DATE_FORMAT',
        message: 'Deadline must be a valid date'
      });
    }
    
    // Validate roundTypes if provided
    if (filteredUpdates.roundTypes !== undefined) {
      if (!Array.isArray(filteredUpdates.roundTypes)) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_FORMAT',
          message: 'Round types must be an array'
        });
      }
    }
    
    // Update the job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      filteredUpdates,
      { new: true }
    ).populate('company_id');
    
    res.status(200).json({
      status: 'success',
      data: updatedJob
    });
  } catch (error) {
    console.error('Error in updateJob:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update job'
    });
  }
};

// DELETE /api/jobs/:id - Delete a job (only for owners or employees)
export const deleteJob = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: jobId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid job ID format'
      });
    }
    
    // Find the job
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        status: 'error',
        code: 'JOB_NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    // Get the company ID from the job
    const companyId = job.company_id;
    
    // Check if user is the owner of the company
    const company = await Company.findById(companyId);
    const isOwner = company?.owner_id.toString() === userId.toString();
    
    // Check if user is an employee of the company
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners or employees can delete jobs'
      });
    }
    
    // Start a transaction to delete job and related interviews
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete all interviews associated with this job
      await Interview.deleteMany({ job_id: jobId }).session(session);
      
      // Delete the job
      await Job.findByIdAndDelete(jobId).session(session);
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        status: 'success',
        message: 'Job successfully deleted along with all associated interviews'
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteJob:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete job'
    });
  }
};
