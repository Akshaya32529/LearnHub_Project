import Enrollment from '../models/Enrollment.js';
import { isDbConnected } from '../config/db.js';

export const canViewCourse = (course, user) => {
  if (course?.status === 'PUBLISHED') return true;
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();
  if (role === 'admin' || role === 'reviewer') return true;

  const instructorId = course?.instructor?._id || course?.instructor;
  return role === 'instructor' && instructorId?.toString() === user._id?.toString();
};

export const isCourseManager = (course, user) => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin' || role === 'reviewer') return true;
  const instructorId = course?.instructor?._id || course?.instructor;
  return role === 'instructor' && instructorId?.toString() === user._id?.toString();
};

export const hasCourseContentAccess = async (course, user) => {
  if (isCourseManager(course, user)) return true;
  if (!course || user?.role !== 'student' || !isDbConnected()) return false;
  return Boolean(await Enrollment.exists({ student: user._id, course: course._id, status: { $in: ['ACTIVE', 'COMPLETED'] } }));
};

export const isPreviewLesson = (lesson) => Boolean(lesson.isPreview || lesson.isFreePreview);

export const canEditCourseContent = (course, user) => {
  if (!course || !user) return false;
  if (String(user.role).toLowerCase() === 'admin') return true;
  const instructorId = course.instructor?._id || course.instructor;
  return String(user.role).toLowerCase() === 'instructor' &&
    instructorId?.toString() === user._id?.toString() &&
    ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(course.status);
};
