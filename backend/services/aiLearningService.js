import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import CourseProgress from '../models/CourseProgress.js';
import Lesson from '../models/Lesson.js';
import { Quiz, Question, QuizAttempt } from '../models/Quiz.js';
import AIRecommendation from '../models/AIRecommendation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Assignment, { Submission } from '../models/Assignment.js';
import { requestStructuredAdvice } from './aiProvider.js';

const FALLBACK_MESSAGE = 'Personalized AI advice is temporarily unavailable. These recommendations are based on your LearnHub activity.';

const getLearnerActivity = async (studentId) => {
  const [user, enrollments, attempts, progress] = await Promise.all([
    User.findById(studentId).select('profile.learningGoals').lean(),
    Enrollment.find({ student: studentId, status: { $in: ['ACTIVE', 'COMPLETED'] } }).populate('course', 'title status'),
    QuizAttempt.find({ student: studentId, submittedAt: { $ne: null } }).sort({ createdAt: -1 }).limit(100).lean(),
    CourseProgress.find({ student: studentId }).lean(),
  ]);
  const attemptQuizIds = [...new Set(attempts.map((attempt) => attempt.quiz.toString()))];
  const quizzes = await Quiz.find({ _id: { $in: attemptQuizIds } }).select('title course');
  const quizById = new Map(quizzes.map((quiz) => [quiz._id.toString(), quiz]));
  const questionIds = [...new Set(attempts.flatMap((attempt) => (attempt.answers || []).map((answer) => String(answer.questionId))))];
  const questions = await Question.find({ _id: { $in: questionIds } }).select('questionText correctAnswer explanation concept quiz');
  const questionById = new Map(questions.map((question) => [question._id.toString(), question]));

  const weak = new Map();
  for (const attempt of attempts) {
    const quiz = quizById.get(attempt.quiz.toString());
    for (const answer of attempt.answers || []) {
      const question = questionById.get(String(answer.questionId));
      if (!question || String(answer.answer) === question.correctAnswer) continue;
      const concept = String(question.concept || quiz?.title || 'Core course concepts').slice(0, 100);
      const current = weak.get(concept) || { concept, wrongAnswers: 0, quizTitles: new Set(), evidence: [] };
      current.wrongAnswers += 1;
      if (quiz?.title) current.quizTitles.add(quiz.title);
      current.evidence.push({ quiz: quiz?.title || 'Assessment', question: question.questionText, explanation: question.explanation });
      weak.set(concept, current);
    }
  }
  const weakConcepts = [...weak.values()].map((item) => ({
    concept: item.concept,
    reason: `${item.wrongAnswers} incorrect answer${item.wrongAnswers === 1 ? '' : 's'} across ${[...item.quizTitles].join(', ') || 'your assessments'}.`,
    wrongAnswers: item.wrongAnswers,
    evidence: item.evidence.slice(0, 5),
  })).sort((a, b) => b.wrongAnswers - a.wrongAnswers);

  const progressByCourse = new Map(progress.map((item) => [item.course.toString(), item]));
  const courseIds = enrollments.map((item) => item.course?._id).filter(Boolean);
  const lessons = await Lesson.find({ course: { $in: courseIds }, isActive: true }).populate('course', 'title').sort({ orderIndex: 1 }).lean();
  const incompleteLessons = lessons.filter((lesson) => {
    const completion = progressByCourse.get(lesson.course._id.toString())?.lessonCompletion;
    const isComplete = completion instanceof Map
      ? completion.get(lesson._id.toString())
      : completion?.[lesson._id.toString()];
    return isComplete !== true;
  });
  const practice = await Quiz.find({ course: { $in: courseIds }, isPublished: true }).select('title course passingScore').populate('course', 'title').lean();
  const assignments = await Assignment.find({ course: { $in: courseIds } }).select('title course maxScore').lean();
  const assignmentById = new Map(assignments.map((assignment) => [assignment._id.toString(), assignment]));
  const submissions = await Submission.find({ student: studentId, assignment: { $in: assignments.map((assignment) => assignment._id) } })
    .select('assignment status score feedback submittedAt evaluatedAt').sort({ submittedAt: -1 }).limit(50).lean();
  const quizPerformance = attempts.slice(0, 30).map((attempt) => {
    const quiz = quizById.get(attempt.quiz.toString());
    return { quiz: quiz?.title || 'Assessment', course: enrollments.find((item) => item.course?._id?.toString() === quiz?.course?.toString())?.course?.title || 'Enrolled course', percentage: attempt.percentage, passed: attempt.passed, submittedAt: attempt.submittedAt };
  });
  const assignmentPerformance = submissions.map((submission) => {
    const assignment = assignmentById.get(submission.assignment.toString());
    return { assignment: assignment?.title || 'Assignment', course: enrollments.find((item) => item.course?._id?.toString() === assignment?.course?.toString())?.course?.title || 'Enrolled course', status: submission.status, score: submission.score, maxScore: assignment?.maxScore, feedback: String(submission.feedback || '').slice(0, 500) };
  });

  return {
    learningGoals: user?.profile?.learningGoals || [],
    quizPerformance,
    assignmentPerformance,
    weakConcepts,
    recommendedLessons: incompleteLessons.slice(0, 8).map((lesson) => ({ id: lesson._id, title: lesson.title, courseId: lesson.course._id, courseTitle: lesson.course.title })),
    recommendedPractice: practice.slice(0, 8).map((quiz) => ({ id: quiz._id, title: quiz.title, courseId: quiz.course._id, courseTitle: quiz.course.title })),
    courses: enrollments.map((item) => ({ id: item.course?._id, title: item.course?.title, status: item.status, completion: progressByCourse.get(item.course?._id.toString())?.percentage || 0 })),
  };
};

const normalizeExplanations = (raw, concepts) => {
  const explanationByName = new Map(concepts.map((item) => [item.concept.toLowerCase(), item]));
  const generated = Array.isArray(raw?.weakConcepts) ? raw.weakConcepts : [];
  const weakConcepts = concepts.map((item) => {
    const match = generated.find((candidate) => typeof candidate?.concept === 'string' && explanationByName.has(candidate.concept.toLowerCase()) && candidate.concept.toLowerCase() === item.concept.toLowerCase());
    const explanation = typeof match?.explanation === 'string' ? match.explanation.slice(0, 1000) : '';
    return { ...item, explanation: explanation || 'Review the related lessons and try the practice questions again.' };
  });
  return {
    weakConcepts,
    recommendedLessons: typeof raw?.recommendedLessons === 'string' ? raw.recommendedLessons.slice(0, 1000) : 'Continue with the next incomplete lesson in your enrolled courses.',
    recommendedPractice: typeof raw?.recommendedPractice === 'string' ? raw.recommendedPractice.slice(0, 1000) : 'Retake a published quiz after reviewing the related lessons.',
    explanation: typeof raw?.explanation === 'string' ? raw.explanation.slice(0, 1500) : FALLBACK_MESSAGE,
  };
};

const generateAdvice = async (activity) => {
  try {
    const output = await requestStructuredAdvice({
      system: 'You are a learning coach. Use the supplied learner goals, quiz scores, assignment scores and feedback, incomplete lessons, and course progress to prioritize advice. Use only supplied concepts and activity. Do not invent course, lesson, or quiz identifiers. Return JSON with weakConcepts [{concept, explanation}], recommendedLessons (short rationale), recommendedPractice (short rationale), and explanation (brief summary).',
      input: {
        learningGoals: activity.learningGoals,
        weakConcepts: activity.weakConcepts,
        recentQuizPerformance: activity.quizPerformance,
        assignmentPerformance: activity.assignmentPerformance,
        enrolledCourseProgress: activity.courses,
        incompleteLessonCount: activity.recommendedLessons.length,
      },
    });
    return { ...normalizeExplanations(output || {}, activity.weakConcepts), aiAvailable: Boolean(output) };
  } catch {
    return { ...normalizeExplanations({}, activity.weakConcepts), aiAvailable: false };
  }
};

export const getRecommendations = async (studentId) => {
  const cached = await AIRecommendation.findOne({ student: studentId, expiresAt: { $gt: new Date() } }).lean();
  if (cached) return { ...cached.payload, generatedAt: cached.generatedAt, cached: true };

  const activity = await getLearnerActivity(studentId);
  const advice = await generateAdvice(activity);
  const payload = {
    weakConcepts: advice.weakConcepts,
    reason: advice.weakConcepts.map((item) => item.reason).join(' ') || 'No repeated wrong answers have been recorded yet.',
    recommendedLessons: activity.recommendedLessons,
    recommendedPractice: activity.recommendedPractice,
    explanation: advice.explanation,
    guidance: { lessons: advice.recommendedLessons, practice: advice.recommendedPractice },
    aiAvailable: advice.aiAvailable,
    message: advice.aiAvailable ? undefined : FALLBACK_MESSAGE,
  };
  const generatedAt = new Date();
  await AIRecommendation.findOneAndUpdate(
    { student: studentId },
    { $set: { payload, generatedAt, expiresAt: new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Notification.create({ recipient: studentId, type: 'AI_RECOMMENDATION', title: 'Learning recommendations updated', message: 'New personalized lesson and practice suggestions are ready.', link: '/student' });
  return { ...payload, generatedAt, cached: false };
};

export const getLearningPath = async (studentId) => {
  const activity = await getLearnerActivity(studentId);
  return { courses: activity.courses, recommendedLessons: activity.recommendedLessons, ...await getRecommendations(studentId) };
};

export const getWeakConcepts = async (studentId) => {
  const activity = await getLearnerActivity(studentId);
  const advice = await generateAdvice(activity);
  return { weakConcepts: advice.weakConcepts, reason: advice.weakConcepts.map((item) => item.reason).join(' ') || 'No repeated wrong answers have been recorded yet.', explanation: advice.explanation, aiAvailable: advice.aiAvailable, message: advice.aiAvailable ? undefined : FALLBACK_MESSAGE };
};

export const getAttemptFeedback = async ({ studentId, quizId, attemptId }) => {
  const attempt = await QuizAttempt.findOne({ _id: attemptId, quiz: quizId, student: studentId }).lean();
  if (!attempt) return null;
  const [quiz, questions] = await Promise.all([
    Quiz.findById(quizId).select('title course'),
    Question.find({ quiz: quizId }).select('questionText correctAnswer explanation concept'),
  ]);
  const answerById = new Map((attempt.answers || []).map((answer) => [String(answer.questionId), answer.answer]));
  const incorrect = questions.filter((question) => String(answerById.get(question._id.toString())) !== question.correctAnswer).map((question) => ({ concept: question.concept || quiz?.title || question.questionText.slice(0, 80), question: question.questionText, explanation: question.explanation }));
  let explanation = `You scored ${attempt.percentage}%. Review the highlighted concepts and use the related lessons before your next attempt.`;
  let aiAvailable = false;
  try {
    const output = await requestStructuredAdvice({ system: 'Give concise, kind assessment feedback using only the supplied incorrect concepts and explanations. Return JSON with explanation.', input: { score: attempt.percentage, passed: attempt.passed, incorrect } });
    if (typeof output?.explanation === 'string') { explanation = output.explanation.slice(0, 1500); aiAvailable = true; }
  } catch { /* Keep the deterministic feedback if the provider is unavailable. */ }
  return { score: attempt.percentage, passed: attempt.passed, weakConcepts: incorrect.map((item) => item.concept), explanation, aiAvailable, message: aiAvailable ? undefined : FALLBACK_MESSAGE };
};
