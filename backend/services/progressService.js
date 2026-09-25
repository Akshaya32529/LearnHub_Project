import Course from '../models/Course.js';
import CourseModule from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import { Quiz, QuizAttempt } from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import { Submission } from '../models/Assignment.js';
import CourseProgress from '../models/CourseProgress.js';
import Enrollment from '../models/Enrollment.js';
import Certificate from '../models/Certificate.js';
import Notification from '../models/Notification.js';

const ASSIGNMENT_PASS_RATE = 0.7;

export const recomputeCourseProgress = async (studentId, courseId) => {
  const [course, modules, lessons, quizzes, assignments, progress] = await Promise.all([
    Course.findById(courseId),
    CourseModule.find({ course: courseId, isActive: true }).select('_id title orderIndex'),
    Lesson.find({ course: courseId, isActive: true }).select('_id module'),
    Quiz.find({ course: courseId, isPublished: true }).select('_id'),
    Assignment.find({ course: courseId }).select('_id maxScore'),
    CourseProgress.findOne({ student: studentId, course: courseId }),
  ]);
  if (!course) return null;

  const current = progress || new CourseProgress({ student: studentId, course: courseId });
  const completedLessons = lessons.filter((lesson) => current.lessonCompletion.get(lesson._id.toString()) === true).length;
  for (const module of modules) {
    const moduleLessons = lessons.filter((lesson) => lesson.module?.toString() === module._id.toString());
    current.moduleCompletion.set(module._id.toString(), moduleLessons.length > 0 && moduleLessons.every((lesson) => current.lessonCompletion.get(lesson._id.toString()) === true));
  }
  const passedQuizzes = await Promise.all(quizzes.map((quiz) => QuizAttempt.exists({ quiz: quiz._id, student: studentId, passed: true })));
  const gradedAssignments = await Promise.all(assignments.map((assignment) => Submission.exists({
    assignment: assignment._id,
    student: studentId,
    status: 'GRADED',
    score: { $gte: assignment.maxScore * ASSIGNMENT_PASS_RATE },
  })));

  const totalUnits = lessons.length + quizzes.length + assignments.length;
  const completedUnits = completedLessons + passedQuizzes.filter(Boolean).length + gradedAssignments.filter(Boolean).length;
  current.percentage = totalUnits ? Math.round((completedUnits / totalUnits) * 100) : 0;
  current.status = totalUnits > 0 && completedUnits === totalUnits ? 'COMPLETED' : 'IN_PROGRESS';
  current.completedAt = current.status === 'COMPLETED' ? (current.completedAt || new Date()) : null;
  await current.save();

  if (current.status === 'COMPLETED') {
    await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId, status: 'ACTIVE' },
      { $set: { status: 'COMPLETED', completedAt: current.completedAt } }
    );
    if (course.status === 'PUBLISHED') {
      const existingCertificate = await Certificate.findOne({ student: studentId, course: courseId });
      if (!existingCertificate) {
        const certificate = await Certificate.findOneAndUpdate(
          { student: studentId, course: courseId },
          { $setOnInsert: { certificateNumber: `LH-${Date.now()}-${studentId.toString().slice(-6)}-${courseId.toString().slice(-4)}`, issuedAt: new Date(), completionDate: current.completedAt } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (certificate) await Notification.create({ recipient: studentId, type: 'CERTIFICATE_ISSUED', title: 'Certificate issued', message: `Your certificate for ${course.title} is ready.`, link: '/student/certificates' });
        return { ...current.toObject(), certificate };
      }
    }
  }
  return current;
};

export const getCourseCompletionRequirements = async (studentId, courseId) => {
  const [lessons, quizzes, assignments, progress] = await Promise.all([
    Lesson.find({ course: courseId, isActive: true }).select('_id title'),
    Quiz.find({ course: courseId, isPublished: true }).select('_id title'),
    Assignment.find({ course: courseId }).select('_id title maxScore'),
    CourseProgress.findOne({ student: studentId, course: courseId }),
  ]);

  const completedLessonIds = new Set(
    Array.from(progress?.lessonCompletion || []).filter(([, complete]) => complete).map(([id]) => id)
  );
  const [quizStatus, assignmentStatus] = await Promise.all([
    Promise.all(quizzes.map(async (quiz) => ({
      title: quiz.title,
      complete: Boolean(await QuizAttempt.exists({ quiz: quiz._id, student: studentId, passed: true })),
    }))),
    Promise.all(assignments.map(async (assignment) => ({
      title: assignment.title,
      complete: Boolean(await Submission.exists({
        assignment: assignment._id,
        student: studentId,
        status: 'GRADED',
        score: { $gte: assignment.maxScore * ASSIGNMENT_PASS_RATE },
      })),
    }))),
  ]);
  const lessonsComplete = lessons.every((lesson) => completedLessonIds.has(lesson._id.toString()));
  return {
    complete: lessons.length + quizzes.length + assignments.length > 0 && lessonsComplete && quizStatus.every((item) => item.complete) && assignmentStatus.every((item) => item.complete),
    lessons: { required: lessons.length, completed: lessons.filter((lesson) => completedLessonIds.has(lesson._id.toString())).length },
    quizzes: quizStatus,
    assignments: assignmentStatus,
  };
};
