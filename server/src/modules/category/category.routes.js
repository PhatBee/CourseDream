import express from 'express';
import * as categoryController from './category.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/all', categoryController.getAllCategoriesSimple); // New endpoint for dropdowns

router.post('/', verifyToken, checkRole('admin'), categoryController.createCategory);
router.put('/:id', verifyToken, checkRole('admin'), categoryController.updateCategory);
router.delete('/:id', verifyToken, checkRole('admin'), categoryController.deleteCategory);

export default router;