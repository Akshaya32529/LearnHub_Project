import mongoose from 'mongoose';

const mentorAssignmentSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'REMOVED'],
      default: 'ACTIVE',
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const mentorFeedbackSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['GENERAL', 'PROGRESS', 'SESSION'],
      default: 'GENERAL',
    },
  },
  { timestamps: true }
);

const mentoringSessionSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const MentorAssignment = mongoose.model('MentorAssignment', mentorAssignmentSchema);
const MentorFeedback = mongoose.model('MentorFeedback', mentorFeedbackSchema);
const MentoringSession = mongoose.model('MentoringSession', mentoringSessionSchema);

export { MentorAssignment, MentorFeedback, MentoringSession };
