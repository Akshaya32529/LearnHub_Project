import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import CourseModule from '../models/Module.js';
import { Submission } from '../models/Assignment.js';
import { isDbConnected } from '../config/db.js';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import { canViewCourse } from '../utils/courseAccess.js';
import { recomputeCourseProgress } from '../services/progressService.js';
import { canEditCourseContent } from '../utils/courseAccess.js';
import CourseProgress from '../models/CourseProgress.js';

const assignmentUnavailable = (res) => res.status(503).json({ success: false, message: 'Assignment service is temporarily unavailable.' });

export const getCourseAssignments = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!isDbConnected()) return assignmentUnavailable(res);

    const course = await Course.findById(courseId);
    if (!course || !canViewCourse(course, req.user)) return res.status(404).json({ success: false, message: 'Course not found.' });
    const isManager = req.user && (req.user.role === 'admin' || course.instructor.toString() === req.user._id.toString());
    if (!isManager && (!req.user || !await Enrollment.exists({ student: req.user._id, course: courseId, status: { $in: ['ACTIVE', 'COMPLETED'] } }))) {
      return res.status(403).json({ success: false, message: 'Enroll in this course to view assignments.' });
    }

    const assignments = await Assignment.find({ course: courseId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: assignments.length, assignments });
  } catch (error) {
    next(error);
  }
};

export const createAssignment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructions, dueDate, maxScore, allowedSubmissionType, moduleId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ success: false, message: 'Assignment title and course are required.' });
    }
    if (!isDbConnected()) return assignmentUnavailable(res);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only instructors and admins can create assignments.' });
    }
    if (!canEditCourseContent(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You can only create assignments for your own course.' });
    }
    if (dueDate && (Number.isNaN(Date.parse(dueDate)) || new Date(dueDate) <= new Date())) return res.status(400).json({ success: false, message: 'Due date must be a valid future date.' });
    if (maxScore !== undefined && (!Number.isFinite(Number(maxScore)) || Number(maxScore) < 1)) {
      return res.status(400).json({ success: false, message: 'Maximum score must be a positive number.' });
    }

    if (moduleId && !await CourseModule.exists({ _id: moduleId, course: courseId })) return res.status(400).json({ success: false, message: 'Assignment module must belong to this course.' });
    const assignment = await Assignment.create({
      course: courseId,
      module: moduleId || null,
      title: title.trim(),
      description: description || '',
      instructions: instructions || '',
      dueDate: dueDate || null,
      maxScore: Number(maxScore) || 100,
      allowedSubmissionType: allowedSubmissionType || 'TEXT',
    });

    return res.status(201).json({ success: true, message: 'Assignment created successfully.', assignment });
  } catch (error) {
    next(error);
  }
};

export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, fileUrl } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const course = await Course.findById(assignment.course);
    if (!course || course.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Assignment not found.' });
    const enrollment = await Enrollment.exists({ student: req.user._id, course: course._id, status: 'ACTIVE' });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in this course before submitting.' });
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Submission content is required.' });

    const prior = await Submission.findOne({ assignment: assignment._id, student: req.user._id });
    if (prior && prior.status !== 'REJECTED') return res.status(409).json({ success: false, message: 'A submission already exists for this assignment.' });

    const submittedAt = new Date();
    const submission = prior || new Submission({
      assignment: assignment._id,
      student: req.user._id,
    });
    submission.content = content.trim();
    submission.fileUrl = fileUrl || '';
    submission.status = assignment.dueDate && submittedAt > assignment.dueDate ? 'LATE' : 'SUBMITTED';
    submission.submittedAt = submittedAt;
    submission.score = null;
    submission.feedback = '';
    await submission.save();

    const instructors = [course.instructor];
    for (const instructor of instructors) await Notification.create({ recipient: instructor, type: 'ASSIGNMENT_SUBMISSION', title: 'Assignment submitted', message: `${req.user.name} submitted ${assignment.title}.`, link: `/instructor/courses/${course._id}` });

    return res.status(201).json({ success: true, message: 'Assignment submitted successfully.', submission });
  } catch (error) {
    next(error);
  }
};

export const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Only the course instructor can grade this work.' });
    }
    const assignment = await Assignment.findById(submission.assignment);
    const course = assignment && await Course.findById(assignment.course);
    if (!assignment || !course || (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: 'You cannot grade submissions for this course.' });
    }
    if (!Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > assignment.maxScore) {
      return res.status(400).json({ success: false, message: `Score must be between 0 and ${assignment.maxScore}.` });
    }

    submission.score = score !== undefined ? Number(score) : submission.score;
    submission.feedback = feedback || submission.feedback;
    submission.status = 'GRADED';
    submission.evaluatedBy = req.user._id;
    submission.evaluatedAt = new Date();
    await submission.save();
    await Notification.create({ recipient: submission.student, type: 'ASSIGNMENT_GRADED', title: 'Assignment graded', message: `${assignment.title} was graded: ${submission.score}/${assignment.maxScore}.`, link: `/courses/${course._id}` });
    const progress = await CourseProgress.findOneAndUpdate(
      { student: submission.student, course: course._id },
      { $setOnInsert: { status: 'IN_PROGRESS' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    progress.assignmentResults.set(assignment._id.toString(), submission.score);
    await progress.save();
    await recomputeCourseProgress(submission.student, course._id);

    return res.status(200).json({ success: true, message: 'Submission graded successfully.', submission });
  } catch (error) {
    next(error);
  }
};

export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    const course = assignment && await Course.findById(assignment.course);
    if (!assignment || !course || (req.user.role !== 'admin' && (req.user.role !== 'instructor' || course.instructor.toString() !== req.user._id.toString()))) {
      return res.status(403).json({ success: false, message: 'You cannot view submissions for this assignment.' });
    }
    const submissions = await Submission.find({ assignment: id }).populate('student', 'name email role');
    return res.status(200).json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req, res, next) => {
  try {
    if (!isDbConnected()) return assignmentUnavailable(res);
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    const course = await Course.findById(assignment.course);
    if (!canEditCourseContent(course, req.user)) return res.status(403).json({ success: false, message: 'You cannot edit this assignment.' });
    const { title, description, instructions, dueDate, maxScore } = req.body;
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ success: false, message: 'Assignment title is required.' });
      assignment.title = title.trim();
    }
    if (description !== undefined) assignment.description = String(description);
    if (instructions !== undefined) assignment.instructions = String(instructions);
    if (dueDate !== undefined) {
      if (dueDate && (Number.isNaN(Date.parse(dueDate)) || new Date(dueDate) <= new Date())) return res.status(400).json({ success: false, message: 'Due date must be a valid future date.' });
      assignment.dueDate = dueDate || null;
    }
    if (maxScore !== undefined) {
      if (!Number.isFinite(Number(maxScore)) || Number(maxScore) < 1) return res.status(400).json({ success: false, message: 'Maximum score must be a positive number.' });
      assignment.maxScore = Number(maxScore);
    }
    await assignment.save();
    return res.status(200).json({ success: true, assignment });
  } catch (error) { next(error); }
};

export const deleteAssignment = async (req, res, next) => {
  try {
    if (!isDbConnected()) return assignmentUnavailable(res);
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found.' });
    const course = await Course.findById(assignment.course);
    if (!canEditCourseContent(course, req.user)) return res.status(403).json({ success: false, message: 'You cannot delete this assignment.' });
    await Submission.deleteMany({ assignment: assignment._id });
    await CourseProgress.updateMany({ course: assignment.course }, { $unset: { [`assignmentResults.${assignment._id}`]: 1 } });
    await assignment.deleteOne();
    return res.status(200).json({ success: true, message: 'Assignment and its submissions deleted.' });
  } catch (error) { next(error); }
};

export const getMyAssignmentSubmission = async (req, res, next) => {
  try {
    const submission = await Submission.findOne({ assignment: req.params.id, student: req.user._id });
    return res.status(200).json({ success: true, submission: submission || null });
  } catch (error) {
    next(error);
  }
};
