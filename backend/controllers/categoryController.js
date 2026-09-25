import Category from '../models/Category.js';
import Course from '../models/Course.js';
import { isDbConnected } from '../config/db.js';

const databaseUnavailable = (res) => res.status(503).json({ success: false, message: 'Category service is temporarily unavailable.' });
import memoryStore from '../services/memoryStore.js';
import slugify from 'slugify';

/**
 * @desc   Get all active categories
 * @route  GET /api/categories
 * @access Public
 */
export const getCategories = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    if (isDbConnected()) {
      const categories = await Category.find({ isActive: true })
        .populate('createdBy', 'name email role')
        .sort({ name: 1 });

      const categoriesWithCount = await Promise.all(
        categories.map(async (cat) => {
          const courseCount = await Course.countDocuments({ category: cat._id });
          return {
            ...cat.toObject(),
            courseCount,
          };
        })
      );

      return res.status(200).json({
        success: true,
        count: categoriesWithCount.length,
        categories: categoriesWithCount,
      });
    } else {
      const categories = memoryStore.getCategories();
      const categoriesWithCount = categories.map((cat) => {
        const count = memoryStore.courses.filter(
          (c) => c.category?._id?.toString() === cat._id.toString()
        ).length;
        return {
          ...cat,
          courseCount: count,
        };
      });

      return res.status(200).json({
        success: true,
        count: categoriesWithCount.length,
        categories: categoriesWithCount,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single category by ID or slug
 * @route  GET /api/categories/:id
 * @access Public
 */
export const getCategoryById = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { id } = req.params;

    if (isDbConnected()) {
      const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);
      const category = isObjectId
        ? await Category.findById(id).populate('createdBy', 'name email')
        : await Category.findOne({ slug: id }).populate('createdBy', 'name email');

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const courseCount = await Course.countDocuments({ category: category._id });

      return res.status(200).json({
        success: true,
        category: { ...category.toObject(), courseCount },
      });
    } else {
      const category = memoryStore.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const courseCount = memoryStore.courses.filter(
        (c) => c.category?._id?.toString() === category._id.toString()
      ).length;

      return res.status(200).json({
        success: true,
        category: { ...category, courseCount },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Create new category
 * @route  POST /api/categories
 * @access Private (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { name, description, icon } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    if (isDbConnected()) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: `Category with name '${name.trim()}' already exists`,
        });
      }

      const slug = slugify(name.trim(), { lower: true, strict: true });
      const category = await Category.create({
        name: name.trim(),
        slug,
        description: description ? description.trim() : '',
        icon: icon || 'Layers',
        createdBy: req.user._id,
      });

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category,
      });
    } else {
      const existing = memoryStore.categories.find(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Category with name '${name.trim()}' already exists`,
        });
      }

      const category = memoryStore.createCategory(
        { name: name.trim(), description, icon },
        req.user._id
      );

      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        category,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update category
 * @route  PUT /api/categories/:id
 * @access Private (Admin only)
 */
export const updateCategory = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    const { name, description, icon, isActive } = req.body;

    if (isDbConnected()) {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      if (name && name.trim() !== category.name) {
        const duplicate = await Category.findOne({
          _id: { $ne: category._id },
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        });

        if (duplicate) {
          return res.status(400).json({
            success: false,
            message: `Category with name '${name.trim()}' already exists`,
          });
        }

        category.name = name.trim();
        category.slug = slugify(name.trim(), { lower: true, strict: true });
      }

      if (description !== undefined) category.description = description.trim();
      if (icon !== undefined) category.icon = icon;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category,
      });
    } else {
      const updated = memoryStore.updateCategory(req.params.id, {
        name,
        description,
        icon,
        isActive,
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category: updated,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete category (only if safe - no courses attached)
 * @route  DELETE /api/categories/:id
 * @access Private (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    if (!isDbConnected()) return databaseUnavailable(res);
    if (isDbConnected()) {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const associatedCourses = await Course.countDocuments({ category: category._id });
      if (associatedCourses > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category: ${associatedCourses} course(s) are currently categorized under it. Reassign or delete those courses first.`,
        });
      }

      await Category.findByIdAndDelete(category._id);

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } else {
      const category = memoryStore.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const associatedCourses = memoryStore.courses.filter(
        (c) => c.category?._id?.toString() === category._id.toString()
      ).length;

      if (associatedCourses > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category: ${associatedCourses} course(s) are currently categorized under it. Reassign or delete those courses first.`,
        });
      }

      memoryStore.deleteCategory(req.params.id);

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    }
  } catch (error) {
    next(error);
  }
};
