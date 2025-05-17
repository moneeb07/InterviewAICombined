import { Router } from 'express';
import {
  getAllCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../controllers/Company';


const router = Router();

// GET /api/company - Get all companies
router.get('/',getAllCompanies);

// POST /api/company - Create a new company
router.post('/',createCompany);

// GET /api/company/:id - Get a company by ID
router.get('/:id',getCompanyById);

// PUT /api/company/:id - Update a company by ID
router.put('/:id',updateCompany);

// DELETE /api/company/:id - Delete a company by ID
router.delete('/:id',deleteCompany);

export const companyRoutes = router;
