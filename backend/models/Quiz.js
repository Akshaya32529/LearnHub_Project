import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    concept: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    questionType: {
      type: String,
      enum: ['MULTIPLE_CHOICE'],
      default: 'MULTIPLE_CHOICE',
    },
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: {
      type: String,
      default: '',
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    timeLimit: {
      type: Number,
      default: 30,
      min: 1,
    },
    attemptLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: {
      type: Array,
      default: [],
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 }, { unique: true });

const Question = mongoose.model('Question', questionSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export { Quiz, Question, QuizAttempt };
