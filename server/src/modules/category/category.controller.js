import * as categoryService from './category.service.js';

export const getCategories = async (req, res, next) => {
  try {
    const result = await categoryService.getAllCategories(req.query);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const result = await categoryService.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo Category thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await categoryService.updateCategory(id, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật thành công',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await categoryService.deleteCategory(id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};