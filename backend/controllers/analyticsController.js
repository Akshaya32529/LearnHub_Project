import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import CourseProgress from '../models/CourseProgress.js';
import { Quiz, QuizAttempt } from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import { Submission } from '../models/Assignment.js';
import { isDbConnected } from '../config/db.js';

const unavailable = (res) => res.status(503).json({ success: false, message: 'Analytics are temporarily unavailable.' });

const courseMetrics = async (course) => {
  const recentCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [enrollments, activeLearners, completedLearners, recentEngagedCount, progress, quizzes, assignments] = await Promise.all([
    Enrollment.countDocuments({ course: course._id, status: { $in: ['ACTIVE', 'COMPLETED'] } }),
    Enrollment.countDocuments({ course: course._id, status: 'ACTIVE' }),
    CourseProgress.countDocuments({ course: course._id, status: 'COMPLETED' }),
    CourseProgress.countDocuments({ course: course._id, updatedAt: { $gte: recentCutoff } }),
    CourseProgress.find({ course: course._id }).populate('student', 'name email').sort({ updatedAt: -1 }).limit(100),
    Quiz.find({ course: course._id }).select('_id title'),
    Assignment.find({ course: course._id }).select('_id title maxScore'),
  ]);
  const quizIds = quizzes.map((quiz) => quiz._id);
  const assignmentIds = assignments.map((assignment) => assignment._id);
  const [attempts, submissions, quizAggregate, assignmentAggregate] = await Promise.all([
    QuizAttempt.find({ quiz: { $in: quizIds }, submittedAt: { $ne: null } }).populate('student', 'name').populate('quiz', 'title').sort({ createdAt: -1 }).limit(500).lean(),
    Submission.find({ assignment: { $in: assignmentIds } }).populate('student', 'name').populate('assignment', 'title maxScore').sort({ submittedAt: -1 }).limit(500).lean(),
    QuizAttempt.aggregate([{ $match: { quiz: { $in: quizIds }, submittedAt: { $ne: null } } }, { $group: { _id: null, average: { $avg: '$percentage' } } }]),
    Submission.aggregate([
      { $match: { assignment: { $in: assignmentIds }, status: 'GRADED', score: { $ne: null } } },
      { $lookup: { from: 'assignments', localField: 'assignment', foreignField: '_id', as: 'assignment' } },
      { $unwind: '$assignment' },
      { $group: { _id: null, average: { $avg: { $multiply: [{ $divide: ['$score', '$assignment.maxScore'] }, 100] } } } },
    ]),
  ]);
  const averageQuizScore = quizAggregate.length ? Math.round(quizAggregate[0].average) : null;
  const averageAssignmentScore = assignmentAggregate.length ? Math.round(assignmentAggregate[0].average) : null;
  return {
    course: { id: course._id, title: course.title, status: course.status },
    totalEnrollments: enrollments,
    activeLearners,
    completedLearners,
    completionRate: enrollments ? Math.round((completedLearners / enrollments) * 100) : 0,
    averageQuizScore,
    assignmentPerformance: averageAssignmentScore,
    learnerEngagement: {
      learnersActiveLast7Days: recentEngagedCount,
      lastAccesses: progress.slice(0, 20).map((item) => ({ learner: item.student, percentage: item.percentage, status: item.status, lastAccessedAt: item.updatedAt })),
    },
    courseProgress: progress.map((item) => ({ learner: item.student, percentage: item.percentage, status: item.status, lastAccessedLesson: item.lastAccessedLesson, updatedAt: item.updatedAt })),
    assessmentResults: { quizzes: attempts, assignments: submissions },
  };
};

export const instructorAnalytics = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const query = req.user.role === 'admin' ? {} : { instructor: req.user._id };
    const courses = await Course.find(query).sort({ createdAt: -1 });
    const metrics = await Promise.all(courses.map(courseMetrics));
    const enrollments = metrics.reduce((sum, item) => sum + item.totalEnrollments, 0);
    const activeLearners = metrics.reduce((sum, item) => sum + item.activeLearners, 0);
    const completions = metrics.reduce((sum, item) => sum + item.completedLearners, 0);
    const scoreValues = metrics.map((item) => item.averageQuizScore).filter((value) => value !== null);
    return res.status(200).json({
      success: true,
      summary: {
        courseCount: courses.length,
        totalEnrollments: enrollments,
        activeLearners,
        completionRate: enrollments ? Math.round((completions / enrollments) * 100) : 0,
        averageQuizScore: scoreValues.length ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length) : null,
      },
      courses: metrics,
    });
  } catch (error) { next(error); }
};

export const courseAnalytics = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view analytics for your own courses.' });
    }
    return res.status(200).json({ success: true, ...(await courseMetrics(course)) });
  } catch (error) { next(error); }
};
