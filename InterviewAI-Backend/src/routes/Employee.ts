import { Router } from 'express';
import {
  getAllEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from '../controllers/Employee';


const router = Router();

// GET /api/employees - Get all employees
router.get('/',  getAllEmployees);

// POST /api/employees - Create a new employee
router.post('/',  createEmployee);

// GET /api/employees/:id - Get an employee by ID
router.get('/:id',  getEmployeeById);

// PUT /api/employees/:id - Update an employee by ID
router.put('/:id',  updateEmployee);

// DELETE /api/employees/:id - Delete an employee by ID
router.delete('/:id',  deleteEmployee);

export const employeeRoutes = router;
