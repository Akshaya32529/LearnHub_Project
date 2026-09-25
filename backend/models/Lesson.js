import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Associated module is required for a lesson'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Associated course is required for a lesson'],
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [150, 'Lesson title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Lesson description cannot exceed 500 characters'],
      default: '',
    },
    contentType: {
      type: String,
      enum: ['video', 'article', 'document', 'TEXT', 'VIDEO', 'RESOURCE'],
      default: 'TEXT',
    },
    type: {
      type: String,
      enum: ['TEXT', 'VIDEO', 'RESOURCE'],
      default: 'TEXT',
    },
    content: {
      type: String,
      default: '', // Lesson text, markdown, or summary
    },
    videoUrl: {
      type: String,
      default: '',
    },
    resourceUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in minutes
      default: 10,
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
