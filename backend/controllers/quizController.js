import Course from '../models/Course.js';
import CourseModule from '../models/Module.js';
import { Quiz, Question, QuizAttempt } from '../models/Quiz.js';
import CourseProgress from '../models/CourseProgress.js';
import { isDbConnected } from '../config/db.js';
import Enrollment from '../models/Enrollment.js';
import Notification from '../models/Notification.js';
import { canViewCourse } from '../utils/courseAccess.js';
import { recomputeCourseProgress } from '../services/progressService.js';
import { canEditCourseContent } from '../utils/courseAccess.js';

const isCourseManager = (course, user) => Boolean(user && (
  user.role === 'admin' || course.instructor?.toString() === user._id.toString()
));

const unavailable = (res) => res.status(503).json({ success: false, message: 'Quiz service is temporarily unavailable.' });

export const getCourseQuizzes = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!isDbConnected()) return unavailable(res);
    const course = await Course.findById(courseId);
    if (!course || !canViewCourse(course, req.user)) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }
    const query = { course: courseId };
    if (!isCourseManager(course, req.user) && req.user?.role !== 'reviewer') query.isPublished = true;
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 }).lean();
    if (isCourseManager(course, req.user)) {
      const withQuestions = await Promise.all(quizzes.map(async (quiz) => ({ ...quiz, questions: await Question.find({ quiz: quiz._id }).sort({ createdAt: 1 }).lean() })));
      return res.status(200).json({ success: true, count: withQuestions.length, quizzes: withQuestions });
    }
    return res.status(200).json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    next(error);
  }
};

export const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) return unavailable(res);

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.course);
    if (!course || !canViewCourse(course, req.user)) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }
    const manager = isCourseManager(course, req.user) || req.user?.role === 'reviewer';
    if (!manager) {
      const enrollment = await Enrollment.findOne({ student: req.user?._id, course: course._id, status: { $in: ['ACTIVE', 'COMPLETED'] } });
      if (!enrollment || !quiz.isPublished) {
        return res.status(403).json({ success: false, message: 'Enroll in this course to access its quizzes.' });
      }
    }

    const questions = await Question.find({ quiz: quiz._id }).sort({ createdAt: 1 });
    const safeQuestions = manager
      ? questions
      : questions.map(({ _id, questionText, questionType, options, points }) => ({ _id, questionText, questionType, options, points }));
    if (!manager) {
      for (let i = safeQuestions.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [safeQuestions[i], safeQuestions[j]] = [safeQuestions[j], safeQuestions[i]];
      }
      for (const question of safeQuestions) {
        for (let i = question.options.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [question.options[i], question.options[j]] = [question.options[j], question.options[i]];
        }
      }
    }
    return res.status(200).json({ success: true, quiz: { ...quiz.toObject(), questions: safeQuestions } });
  } catch (error) {
    next(error);
  }
};

export const createQuiz = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructions, timeLimit, attemptLimit, passingScore, isPublished, moduleId } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ success: false, message: 'Quiz title and course are required.' });
    }
    if (
      (timeLimit !== undefined && (!Number.isFinite(Number(timeLimit)) || Number(timeLimit) < 1)) ||
      (attemptLimit !== undefined && (!Number.isFinite(Number(attemptLimit)) || Number(attemptLimit) < 1)) ||
      (passingScore !== undefined && (!Number.isFinite(Number(passingScore)) || Number(passingScore) < 0 || Number(passingScore) > 100))
    ) return res.status(400).json({ success: false, message: 'Quiz limits and passing score are invalid.' });

    if (!isDbConnected()) return unavailable(res);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (!canEditCourseContent(course, req.user)) {
      return res.status(403).json({ success: false, message: 'You can only create quizzes for your own course.' });
    }

    if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only instructors and admins can create quizzes.' });
    }

    if (moduleId && !await CourseModule.exists({ _id: moduleId, course: courseId })) return res.status(400).json({ success: false, message: 'Quiz module must belong to this course.' });
    const quiz = await Quiz.create({
      course: courseId,
      module: moduleId || null,
      title: title.trim(),
      description: description || '',
      instructions: instructions || '',
      timeLimit: Number(timeLimit) || 30,
      attemptLimit: Number(attemptLimit) || 1,
      passingScore: passingScore === undefined ? 70 : Number(passingScore),
      isPublished: isPublished === true || isPublished === 'true',
    });

    return res.status(201).json({ success: true, message: 'Quiz created successfully.', quiz });
  } catch (error) {
    next(error);
  }
};

export const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) return unavailable(res);

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.course);
    const isOwner = course && course.instructor && course.instructor.toString() === req.user._id.toString();
    if (!canEditCourseContent(course, req.user)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this quiz.' });
    }

    if ((req.body.title !== undefined && (typeof req.body.title !== 'string' || !req.body.title.trim())) ||
      (req.body.timeLimit !== undefined && (!Number.isFinite(Number(req.body.timeLimit)) || Number(req.body.timeLimit) < 1)) ||
      (req.body.attemptLimit !== undefined && (!Number.isFinite(Number(req.body.attemptLimit)) || Number(req.body.attemptLimit) < 1)) ||
      (req.body.passingScore !== undefined && (!Number.isFinite(Number(req.body.passingScore)) || Number(req.body.passingScore) < 0 || Number(req.body.passingScore) > 100))) {
      return res.status(400).json({ success: false, message: 'Quiz title, limits, or passing score are invalid.' });
    }

    const fields = ['title', 'description', 'instructions', 'timeLimit', 'attemptLimit', 'passingScore', 'isPublished'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        quiz[field] = field === 'isPublished'
          ? req.body[field] === true || req.body[field] === 'true'
          : req.body[field];
      }
    });

    await quiz.save();
    return res.status(200).json({ success: true, message: 'Quiz updated successfully.', quiz });
  } catch (error) {
    next(error);
  }
};

export const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isDbConnected()) return unavailable(res);

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.course);
    const isOwner = course && course.instructor && course.instructor.toString() === req.user._id.toString();
    if (!canEditCourseContent(course, req.user)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this quiz.' });
    }

    await Question.deleteMany({ quiz: quiz._id });
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await CourseProgress.updateMany({ course: quiz.course }, { $unset: { [`quizResults.${quiz._id}`]: 1 } });
    await quiz.deleteOne();

    return res.status(200).json({ success: true, message: 'Quiz deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { questionText, options, correctAnswer, points, explanation, concept } = req.body;

    if (!questionText || typeof questionText !== 'string' || !Array.isArray(options) || options.length < 2 || options.some((option) => typeof option !== 'string' || !option.trim())) {
      return res.status(400).json({ success: false, message: 'Question text and options are required.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const course = await Course.findById(quiz.course);
    const isOwner = course && course.instructor && course.instructor.toString() === req.user._id.toString();
    if (!canEditCourseContent(course, req.user)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to add questions.' });
    }

    if (!correctAnswer || !options.includes(String(correctAnswer))) {
      return res.status(400).json({ success: false, message: 'Correct answer must match one of the answer options.' });
    }
    if (points !== undefined && (!Number.isFinite(Number(points)) || Number(points) < 1)) {
      return res.status(400).json({ success: false, message: 'Question points must be a positive number.' });
    }

    const question = await Question.create({
      quiz: quizId,
      questionText,
      concept: String(concept || '').slice(0, 100),
      questionType: 'MULTIPLE_CHOICE',
      options,
      correctAnswer: String(correctAnswer),
      points: Number(points) || 1,
      explanation: explanation || '',
    });

    return res.status(201).json({ success: true, message: 'Question added successfully.', question });
  } catch (error) {
    next(error);
  }
};

export const startQuizAttempt = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const enrollment = await Enrollment.exists({ student: req.user._id, course: quiz.course, status: { $in: ['ACTIVE', 'COMPLETED'] } });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in this course before taking its quiz.' });
    const openAttempt = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user._id, submittedAt: null }).sort({ createdAt: -1 });
    if (openAttempt) {
      if (Date.now() - openAttempt.startedAt.getTime() <= quiz.timeLimit * 60 * 1000) {
        return res.status(200).json({ success: true, attemptId: openAttempt._id, startedAt: openAttempt.startedAt, timeLimit: quiz.timeLimit, resumed: true });
      }
      openAttempt.score = 0;
      openAttempt.percentage = 0;
      openAttempt.passed = false;
      openAttempt.submittedAt = new Date();
      await openAttempt.save();
      await Notification.create({ recipient: req.user._id, type: 'QUIZ_RESULT', title: 'Quiz time expired', message: `Your time expired for ${quiz.title}.`, link: `/student/quizzes/${quiz._id}` });
      await recomputeCourseProgress(req.user._id, quiz.course);
    }
    const previousAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id, student: req.user._id });
    if (previousAttempts >= quiz.attemptLimit) return res.status(409).json({ success: false, message: 'You have reached the attempt limit for this quiz.' });
    if (!await Question.exists({ quiz: quiz._id })) return res.status(400).json({ success: false, message: 'This quiz has no questions yet.' });
    const attempt = await QuizAttempt.create({ quiz: quiz._id, student: req.user._id, attemptNumber: previousAttempts + 1 });
    return res.status(201).json({ success: true, attemptId: attempt._id, startedAt: attempt.startedAt, timeLimit: quiz.timeLimit });
  } catch (error) { next(error); }
};

export const updateQuestion = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    const quiz = await Quiz.findById(question.quiz);
    const course = quiz && await Course.findById(quiz.course);
    if (!course || !canEditCourseContent(course, req.user)) return res.status(403).json({ success: false, message: 'You cannot edit this question.' });
    const { questionText, options, correctAnswer, points, explanation, concept } = req.body;
    if (options !== undefined && (!Array.isArray(options) || options.length < 2 || options.some((item) => typeof item !== 'string' || !item.trim()))) return res.status(400).json({ success: false, message: 'Provide at least two non-empty answer options.' });
    if (questionText !== undefined) question.questionText = String(questionText).trim();
    if (options !== undefined) question.options = options.map((item) => item.trim());
    if (correctAnswer !== undefined) question.correctAnswer = String(correctAnswer);
    if (!question.options.includes(question.correctAnswer)) return res.status(400).json({ success: false, message: 'Correct answer must match one of the answer options.' });
    if (points !== undefined) {
      if (!Number.isFinite(Number(points)) || Number(points) < 1) return res.status(400).json({ success: false, message: 'Question points must be a positive number.' });
      question.points = Number(points);
    }
    if (explanation !== undefined) question.explanation = String(explanation);
    if (concept !== undefined) question.concept = String(concept).slice(0, 100);
    await question.save();
    return res.status(200).json({ success: true, question });
  } catch (error) { next(error); }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const question = await Question.findById(req.params.questionId);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' });
    const quiz = await Quiz.findById(question.quiz);
    const course = quiz && await Course.findById(quiz.course);
    if (!course || !canEditCourseContent(course, req.user)) return res.status(403).json({ success: false, message: 'You cannot delete this question.' });
    await question.deleteOne();
    return res.status(200).json({ success: true, message: 'Question deleted.' });
  } catch (error) { next(error); }
};

export const getStudentQuizHistory = async (req, res, next) => {
  try {
    if (!isDbConnected()) return unavailable(res);
    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const enrolled = await Enrollment.exists({ student: req.user._id, course: quiz.course, status: { $in: ['ACTIVE', 'COMPLETED'] } });
    if (!enrolled) return res.status(403).json({ success: false, message: 'Enroll in this course to view quiz history.' });
    const attempts = await QuizAttempt.find({ quiz: quiz._id, student: req.user._id, submittedAt: { $ne: null } }).sort({ submittedAt: -1 }).select('-answers');
    return res.status(200).json({ success: true, attempts });
  } catch (error) { next(error); }
};

export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers = [], attemptId } = req.body;

    if (!isDbConnected()) return unavailable(res);
    if (!Array.isArray(answers)) return res.status(400).json({ success: false, message: 'Answers must be a list.' });

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (!quiz.isPublished) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const enrollment = await Enrollment.findOne({ student: req.user._id, course: quiz.course, status: { $in: ['ACTIVE', 'COMPLETED'] } });
    if (!enrollment) return res.status(403).json({ success: false, message: 'Enroll in this course before taking its quiz.' });

    if (!attemptId) return res.status(400).json({ success: false, message: 'Start the quiz before submitting your answers.' });
    const attempt = await QuizAttempt.findOne({ _id: attemptId, quiz: quiz._id, student: req.user._id, submittedAt: null });
    if (!attempt) return res.status(409).json({ success: false, message: 'This quiz attempt is unavailable or already submitted.' });

    const questions = await Question.find({ quiz: quiz._id });
    if (!questions.length) return res.status(400).json({ success: false, message: 'This quiz has no questions yet.' });
    const elapsed = Date.now() - attempt.startedAt.getTime();
    if (elapsed > quiz.timeLimit * 60 * 1000) {
      attempt.answers = [];
      attempt.score = 0;
      attempt.percentage = 0;
      attempt.passed = false;
      attempt.submittedAt = new Date();
      await attempt.save();
      await Notification.create({ recipient: req.user._id, type: 'QUIZ_RESULT', title: 'Quiz time expired', message: `Your time expired for ${quiz.title}.`, link: `/student/quizzes/${quiz._id}` });
      await recomputeCourseProgress(req.user._id, quiz.course);
      const results = questions.map((question) => ({ questionId: question._id, correct: false, selectedAnswer: null, correctAnswer: question.correctAnswer, explanation: question.explanation }));
      return res.status(200).json({ success: true, expired: true, message: 'The quiz time limit expired.', attempt, percentage: 0, passed: false, results });
    }
    const questionById = new Map(questions.map((question) => [question._id.toString(), question]));
    const answerIds = answers.map((entry) => String(entry?.questionId || ''));
    if (answers.some((entry) => !questionById.has(String(entry?.questionId || ''))) || new Set(answerIds).size !== answerIds.length) {
      return res.status(400).json({ success: false, message: 'Answers contain an invalid or repeated question.' });
    }

    let score = 0;
    const totalPoints = questions.reduce((total, question) => total + question.points, 0);
    const results = questions.map((question) => {
      const selected = answers.find((entry) => String(entry.questionId) === question._id.toString())?.answer;
      const correct = selected !== undefined && String(selected) === question.correctAnswer;
      if (correct) score += question.points;
      return { questionId: question._id, correct, selectedAnswer: selected ?? null, correctAnswer: question.correctAnswer, explanation: question.explanation };
    });

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    attempt.answers = answers;
    attempt.score = score;
    attempt.percentage = percentage;
    attempt.passed = passed;
    attempt.submittedAt = new Date();
    await attempt.save();

    const courseProgress = await CourseProgress.findOneAndUpdate(
      { student: req.user._id, course: quiz.course },
      { $setOnInsert: { status: 'IN_PROGRESS' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    courseProgress.quizResults.set(quiz._id.toString(), percentage);
    await courseProgress.save();
    await recomputeCourseProgress(req.user._id, quiz.course);

    await Notification.create({ recipient: req.user._id, type: 'QUIZ_RESULT', title: 'Quiz result ready', message: `You scored ${percentage}% on ${quiz.title}.`, link: `/student/quizzes/${quiz._id}` });
    return res.status(200).json({ success: true, message: passed ? 'Quiz passed.' : 'Quiz submitted. Continue learning and retake when ready.', attempt, percentage, passed, results });
  } catch (error) {
    next(error);
  }
};

export const getQuizAttempts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Quiz not found.' });
    if (!isCourseManager(course, req.user) && req.user.role !== 'reviewer') return res.status(403).json({ success: false, message: 'You cannot view attempts for this quiz.' });
    const attempts = await QuizAttempt.find({ quiz: id, submittedAt: { $ne: null } }).populate('student', 'name email');
    return res.status(200).json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    next(error);
  }
};
