import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Course from '../models/Course.js';
import CourseModule from '../models/Module.js';
import Lesson from '../models/Lesson.js';
import { Quiz, Question } from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import { MentorAssignment } from '../models/Mentor.js';
import Enrollment from '../models/Enrollment.js';
import CourseProgress from '../models/CourseProgress.js';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  throw new Error('The development seed cannot run when NODE_ENV is production.');
}
const seedPassword = process.env.SEED_DEMO_PASSWORD;
if (!seedPassword || seedPassword.length < 12) {
  throw new Error('Set SEED_DEMO_PASSWORD to a password of at least 12 characters before seeding.');
}

const accounts = [
  ['Platform Admin', 'admin@local.learnhub.test', 'admin'],
  ['Course Instructor', 'instructor@local.learnhub.test', 'instructor'],
  ['Content Reviewer', 'reviewer@local.learnhub.test', 'reviewer'],
  ['Sample Student', 'student@local.learnhub.test', 'student'],
  ['Learning Mentor', 'mentor@local.learnhub.test', 'mentor'],
];

try {
  await connectDB();
  if (!isDbConnected()) throw new Error('Could not connect to MongoDB. Check MONGO_URI.');

  const users = {};
  for (const [name, email, role] of accounts) {
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name, email, password: seedPassword, role });
    users[role] = user;
  }

  const category = await Category.findOneAndUpdate(
    { slug: 'web-development' },
    { $set: { name: 'Web Development', description: 'Frontend and backend application development.', createdBy: users.admin._id, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const course = await Course.findOneAndUpdate(
    { slug: 'learnhub-mern-development' },
    { $set: {
      title: 'LearnHub MERN Development', slug: 'learnhub-mern-development',
      shortDescription: 'Build web applications with the MERN stack.',
      description: 'A development course with curriculum, quiz, assignment, and learner progress examples.',
      category: category._id, instructor: users.instructor._id, level: 'BEGINNER', duration: '6 hours',
      status: 'PUBLISHED', requirements: ['Basic computer skills'], learningOutcomes: ['Build a structured web application'], tags: ['MERN', 'JavaScript'],
    } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const module = await CourseModule.findOneAndUpdate(
    { course: course._id, title: 'Getting Started' },
    { $set: { description: 'Start with the application structure.', order: 1, orderIndex: 1, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await Lesson.findOneAndUpdate(
    { module: module._id, title: 'MERN platform overview' },
    { $set: { course: course._id, description: 'Understand how the platform parts fit together.', content: 'Explore the React client, Express API, and MongoDB persistence.', type: 'TEXT', contentType: 'article', duration: 15, order: 1, orderIndex: 1, isPreview: true, isFreePreview: true, isActive: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const quiz = await Quiz.findOneAndUpdate(
    { course: course._id, title: 'MERN fundamentals' },
    { $set: { description: 'Check the platform basics.', instructions: 'Choose the best answer.', timeLimit: 10, attemptLimit: 3, passingScore: 70, isPublished: true } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await Question.findOneAndUpdate(
    { quiz: quiz._id, questionText: 'Which database does the MERN stack use?' },
    { $set: { concept: 'MERN stack components', questionType: 'MULTIPLE_CHOICE', options: ['MongoDB', 'PostgreSQL', 'Redis', 'SQLite'], correctAnswer: 'MongoDB', points: 1, explanation: 'MERN includes MongoDB, Express, React, and Node.js.' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const assignment = await Assignment.findOneAndUpdate(
    { course: course._id, title: 'Describe the request path' },
    { $set: { instructions: 'Describe how a page request reaches the API and database.', maxScore: 100, allowedSubmissionType: 'TEXT' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await MentorAssignment.findOneAndUpdate(
    { mentor: users.mentor._id, student: users.student._id, status: 'ACTIVE' },
    { $setOnInsert: { assignedBy: users.admin._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await Enrollment.findOneAndUpdate(
    { student: users.student._id, course: course._id },
    { $setOnInsert: { status: 'ACTIVE' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  await CourseProgress.findOneAndUpdate(
    { student: users.student._id, course: course._id },
    { $setOnInsert: { status: 'IN_PROGRESS' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log('Development sample data is ready. Credentials use SEED_DEMO_PASSWORD from the environment.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
