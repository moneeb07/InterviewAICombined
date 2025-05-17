import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/Requests';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { Interview } from '../models/Interview';
import { Job } from '../models/Job';
import mongoose from 'mongoose';

// GET /api/company - Get all companies
export const getAllCompanies = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Find companies owned by the user
    const ownedCompanies = await Company.find({ owner_id: userId });
    
    // Find companies where user is an employee
    const employeeRecords = await Employee.find({ user_id: userId });
    const employeeCompanyIds = employeeRecords.map(record => record.company_id);
    const employeeCompanies = await Company.find({ 
      _id: { $in: employeeCompanyIds }
    });
    
    // Find companies where user is interviewing
    // First, find jobs for which the user has interviews
    const interviews = await Interview.find({ user_id: userId });
    const jobIds = interviews.map(interview => interview.job_id);
    
    // Then find the companies associated with those jobs
    const jobs = await Job.find({ _id: { $in: jobIds } });
    const interviewCompanyIds = jobs.map(job => job.company_id);
    const interviewCompanies = await Company.find({
      _id: { $in: interviewCompanyIds }
    });
    
    // Format companies with role field
    const formattedOwnedCompanies = ownedCompanies.map(company => ({
      ...company.toObject(),
      role: 'owner'
    }));
    
    const formattedEmployeeCompanies = employeeCompanies.map(company => ({
      ...company.toObject(),
      role: 'employee'
    }));
    
    const formattedInterviewCompanies = interviewCompanies.map(company => ({
      ...company.toObject(),
      role: 'interviewing'
    }));
    
    // Combine all companies into a single flat array
    const allCompanies = [
      ...formattedOwnedCompanies,
      ...formattedEmployeeCompanies,
      ...formattedInterviewCompanies
    ];
    
    // Remove duplicate companies (keeping the highest priority role)
    // Priority: owner > employee > interviewing
    const uniqueCompanies = allCompanies.reduce((unique, company) => {
      const existingIndex = unique.findIndex(
        item => item._id.toString() === company._id.toString()
      );
      
      if (existingIndex === -1) {
        // Company doesn't exist in unique array, add it
        unique.push(company);
      } else {
        // Company exists, keep the one with higher priority role
        const existingRole = unique[existingIndex].role;
        if (
          (company.role === 'owner') || 
          (company.role === 'employee' && existingRole === 'interviewing')
        ) {
          unique[existingIndex] = company;
        }
      }
      
      return unique;
    }, [] as any[]);
    
    res.status(200).json({
      status: 'success',
      data: uniqueCompanies
    });
  } catch (error) {
    console.error('Error in getAllCompanies:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve companies'
    });
  }
};

// POST /api/company - Create a new company
export const createCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { name, description } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Company name is required'
      });
    }
    
    // Create the company with current user as owner
    const newCompany = new Company({
      name,
      description,
      owner_id: userId
    });
    
    await newCompany.save();
    
    res.status(201).json({
      status: 'success',
      data: newCompany
    });
  } catch (error) {
    console.error('Error in createCompany:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create company'
    });
  }
};

// GET /api/company/:id - Get a company by ID
export const getCompanyById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user._id;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid company ID format'
      });
    }
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }
    
    // Check if user is owner
    const isOwner = company.owner_id.toString() === userId.toString();
    
    // Check if user is employee
    const isEmployee = await Employee.exists({
      company_id: companyId,
      user_id: userId
    });
    
    // If user is neither owner nor employee, deny access
    if (!isOwner && !isEmployee) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'You do not have permission to view this company'
      });
    }
    
    // Include role information with company data
    const result = {
      ...company.toObject(),
      role: isOwner ? 'owner' : 'employee'
    };
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error in getCompanyById:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve company'
    });
  }
};

// PUT /api/company/:id - Update a company by ID
export const updateCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user._id;
    const updates = req.body;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid company ID format'
      });
    }
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }
    
    // Check if user is the owner
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only the company owner can update company details'
      });
    }
    
    // Remove fields that shouldn't be updated
    const { _id, owner_id, ...allowedUpdates } = updates;
    
    // Update the company
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: updatedCompany
    });
  } catch (error) {
    console.error('Error in updateCompany:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update company'
    });
  }
};

// DELETE /api/company/:id - Delete a company by ID
export const deleteCompany = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: companyId } = req.params;
    const userId = req.user._id;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid company ID format'
      });
    }
    
    // Find the company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Company not found'
      });
    }
    
    // Check if user is the owner
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only the company owner can delete the company'
      });
    }
    
    // Start a transaction to delete company and related records
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Delete the company
      await Company.findByIdAndDelete(companyId).session(session);
      
      // Delete associated employees
      await Employee.deleteMany({ company_id: companyId }).session(session);
      
      // Find jobs associated with the company
      const jobs = await Job.find({ company_id: companyId }).session(session);
      const jobIds = jobs.map(job => job._id);
      
      // Delete interviews associated with those jobs
      await Interview.deleteMany({ job_id: { $in: jobIds } }).session(session);
      
      // Delete the jobs
      await Job.deleteMany({ company_id: companyId }).session(session);
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.status(200).json({
        status: 'success',
        message: 'Company and all associated data successfully deleted'
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteCompany:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete company'
    });
  }
};
