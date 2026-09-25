import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lessonCompletion: {
      type: Map,
      of: Boolean,
      default: {},
    },
    moduleCompletion: {
      type: Map,
      of: Boolean,
      default: {},
    },
    quizResults: {
      type: Map,
      of: Number,
      default: {},
    },
    assignmentResults: {
      type: Map,
      of: Number,
      default: {},
    },
    percentage: {
      type: Number,
      default: 0,
    },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
  },
  { timestamps: true }
);

courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
export default CourseProgress;
