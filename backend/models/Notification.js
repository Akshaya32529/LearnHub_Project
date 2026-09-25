import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'ENROLLMENT',
        'COURSE_APPROVED',
        'COURSE_REJECTED',
        'CHANGES_REQUESTED',
        'COURSE_PUBLISHED',
        'QUIZ_RESULT',
        'ASSIGNMENT_SUBMISSION',
        'ASSIGNMENT_GRADED',
        'MENTOR_FEEDBACK',
        'MENTOR_SESSION',
        'CERTIFICATE_ISSUED',
        'AI_RECOMMENDATION',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
