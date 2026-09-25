import CourseProgress from '../models/CourseProgress.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';
import { isDbConnected } from '../config/db.js';
import { recomputeCourseProgress, getCourseCompletionRequirements } from '../services/progressService.js';

const progressUnavailable = (res) => res.status(503).json({ success: false, message: 'Learning progress is temporarily unavailable.' });

export const getMyProgress = async (req, res, next) => {
  try {
    if (!isDbConnected()) return progressUnavailable(res);
    const progress = await CourseProgress.find({ student: req.user._id }).populate('course', 'title slug');
    return res.status(200).json({ success: true, count: progress.length, progress });
  } catch (error) {
    next(error);
  }
};

export const updateProgressLesson = async (req, res, next) => {
  try {
    if (!isDbConnected()) return progressUnavailable(res);
    const { courseId } = req.params;
    const { lessonId, completed = true } = req.body;
    if (!lessonId || typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, message: 'A lesson and boolean completion value are required.' });
    }

    const course = await Course.findById(courseId);
    if (!course || course.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Course not found.' });
    const enrollment = await Enrollment.exists({ student: req.user._id, course: courseId, status: { $in: ['ACTIVE', 'COMPLETED'] } });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in this course to update progress.' });
    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId, isActive: true });
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found in this course.' });

    const progress = await CourseProgress.findOneAndUpdate(
      { student: req.user._id, course: courseId },
      { $setOnInsert: { status: 'IN_PROGRESS' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    progress.lessonCompletion.set(lesson._id.toString(), completed);
    progress.lastAccessedLesson = lesson._id;
    await progress.save();

    const updated = await recomputeCourseProgress(req.user._id, courseId);
    return res.status(200).json({ success: true, message: 'Progress updated.', progress: updated });
  } catch (error) {
    next(error);
  }
};

export const issueCertificate = async (req, res, next) => {
  try {
    if (!isDbConnected()) return progressUnavailable(res);
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course || course.status !== 'PUBLISHED') return res.status(404).json({ success: false, message: 'Course not found.' });

    const enrollment = await Enrollment.exists({ student: req.user._id, course: courseId, status: { $in: ['ACTIVE', 'COMPLETED'] } });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in this course before requesting a certificate.' });
    const progress = await recomputeCourseProgress(req.user._id, courseId);
    const requirements = await getCourseCompletionRequirements(req.user._id, courseId);
    if (!requirements.complete) {
      return res.status(409).json({ success: false, message: 'Complete all lessons, quizzes, and assignments before requesting a certificate.', requirements });
    }

    const existing = await Certificate.findOne({ student: req.user._id, course: courseId });
    if (existing) return res.status(200).json({ success: true, message: 'Certificate already issued.', certificate: existing });

    if (progress?.status !== 'COMPLETED') return res.status(409).json({ success: false, message: 'Complete all requirements first.', requirements });
    const issued = await Certificate.findOneAndUpdate(
      { student: req.user._id, course: course._id },
      { $setOnInsert: { certificateNumber: `LH-${Date.now()}-${req.user._id.toString().slice(-6)}-${course._id.toString().slice(-4)}`, issuedAt: new Date(), completionDate: progress.completedAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Notification.create({ recipient: req.user._id, type: 'CERTIFICATE_ISSUED', title: 'Certificate issued', message: `Your certificate for ${course.title} is ready.`, link: '/student/certificates' });
    return res.status(201).json({ success: true, message: 'Certificate issued successfully.', certificate: issued });
  } catch (error) {
    next(error);
  }
};

export const getStudentCertificates = async (req, res, next) => {
  try {
    if (!isDbConnected()) return progressUnavailable(res);
    const certificates = await Certificate.find({ student: req.user._id }).populate('course', 'title slug').populate('student', 'name');
    return res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    next(error);
  }
};
