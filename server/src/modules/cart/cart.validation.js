import { body, param } from 'express-validator';
import mongoose from 'mongoose';

export const addToCartValidation = [
    body('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid course ID format');
            }
            return true;
        })
];

export const removeFromCartValidation = [
    param('courseId')
        .notEmpty()
        .withMessage('Course ID is required')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid course ID format');
            }
            return true;
        })
];
