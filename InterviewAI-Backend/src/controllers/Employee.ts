import { Response } from 'express';
import { AuthenticatedRequest } from '../types/Requests';
import { Employee } from '../models/Employee';
import { Company } from '../models/Company';
import { User } from '../models/User';
import mongoose from 'mongoose';

// GET /api/employees - Get all employees (only for company owners)
export const getAllEmployees = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    
    // Find all companies owned by the user
    const ownedCompanies = await Company.find({ owner_id: userId });
    
    if (ownedCompanies.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: []
      });
    }
    
    // Get the IDs of all companies owned by the user
    const companyIds = ownedCompanies.map(company => company._id);
    
    // Fetch employees for all companies owned by the user
    const employees = await Employee.find({ company_id: { $in: companyIds } })
      .populate('user_id', 'name email')
      .populate('company_id', 'name');
    
    res.status(200).json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve employees'
    });
  }
};

// POST /api/employees - Create a new employee (only for company owners)
export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { company_id, user_id, role } = req.body;
    
    // Validate required fields
    if (!company_id || !user_id || !role) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Company ID, User ID, and role are required'
      });
    }
    
    // Check if valid ObjectIds
    if (!mongoose.Types.ObjectId.isValid(company_id) || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid company or user ID format'
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
    
    // Verify user is the owner of the company
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners can add employees'
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
    
    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ company_id, user_id });
    if (existingEmployee) {
      return res.status(409).json({
        status: 'error',
        code: 'EMPLOYEE_EXISTS',
        message: 'This user is already an employee at this company'
      });
    }
    
    // Create the employee
    const newEmployee = new Employee({
      company_id,
      user_id,
      role
    });
    
    await newEmployee.save();
    
    res.status(201).json({
      status: 'success',
      data: newEmployee
    });
  } catch (error) {
    console.error('Error in createEmployee:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create employee'
    });
  }
};

// GET /api/employees/:id - Get an employee by ID (only for company owners)
export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: employeeId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid employee ID format'
      });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId).populate('user_id', 'name email');
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found'
      });
    }
    
    // Verify company exists
    const company = await Company.findById(employee.company_id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Associated company not found'
      });
    }
    
    // Verify user is the owner of the company
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners can view employee details'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to retrieve employee'
    });
  }
};

// PUT /api/employees/:id - Update an employee (only for company owners)
export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: employeeId } = req.params;
    const { role } = req.body;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid employee ID format'
      });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found'
      });
    }
    
    // Verify company exists
    const company = await Company.findById(employee.company_id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Associated company not found'
      });
    }
    
    // Verify user is the owner of the company
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners can update employee details'
      });
    }
    
    // Check if role is provided
    if (!role) {
      return res.status(400).json({
        status: 'error',
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Role is required'
      });
    }
    
    // Update the employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { role },
      { new: true, runValidators: true }
    ).populate('user_id', 'name email');
    
    res.status(200).json({
      status: 'success',
      data: updatedEmployee
    });
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to update employee'
    });
  }
};

// DELETE /api/employees/:id - Delete an employee (only for company owners)
export const deleteEmployee = async (req: AuthenticatedRequest, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user._id;
    const { id: employeeId } = req.params;
    
    // Check if valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID',
        message: 'Invalid employee ID format'
      });
    }
    
    // Find the employee
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        status: 'error',
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found'
      });
    }
    
    // Verify company exists
    const company = await Company.findById(employee.company_id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        code: 'COMPANY_NOT_FOUND',
        message: 'Associated company not found'
      });
    }
    
    // Verify user is the owner of the company
    if (company.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCESS_DENIED',
        message: 'Only company owners can remove employees'
      });
    }
    
    // Delete the employee
    await Employee.findByIdAndDelete(employeeId);
    
    res.status(200).json({
      status: 'success',
      message: 'Employee successfully removed'
    });
  } catch (error) {
    console.error('Error in deleteEmployee:', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to delete employee'
    });
  }
};
