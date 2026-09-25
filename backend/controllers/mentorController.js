import { MentorAssignment, MentorFeedback, MentoringSession } from '../models/Mentor.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import CourseProgress from '../models/CourseProgress.js';

export const assignMentor = async (req, res, next) => {
  try {
    const { studentId, mentorId } = req.body;

    if (!studentId || !mentorId) {
      return res.status(400).json({ success: false, message: 'Student and mentor identifiers are required.' });
    }

    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can assign mentors.' });

    const student = await User.findById(studentId);
    const mentor = await User.findById(mentorId);
    if (!student || !mentor) {
      return res.status(404).json({ success: false, message: 'Student or mentor not found.' });
    }
    if (student.role !== 'student' || mentor.role !== 'mentor') {
      return res.status(400).json({ success: false, message: 'Select a student account and a mentor account.' });
    }
    const existing = await MentorAssignment.findOne({ mentor: mentor._id, student: student._id, status: 'ACTIVE' });
    if (existing) return res.status(409).json({ success: false, message: 'This mentor is already assigned to the student.' });

    const assignment = await MentorAssignment.create({
      mentor: mentor._id,
      student: student._id,
      assignedBy: req.user._id,
      status: 'ACTIVE',
    });

    return res.status(201).json({ success: true, message: 'Mentor assigned successfully.', assignment });
  } catch (error) {
    next(error);
  }
};

export const getMentorAssignments = async (req, res, next) => {
  try {
    const query = req.user.role === 'mentor'
      ? { mentor: req.user._id, status: 'ACTIVE' }
      : req.user.role === 'student'
        ? { student: req.user._id, status: 'ACTIVE' }
        : {};
    if (req.user.role !== 'admin' && req.user.role !== 'mentor' && req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized to view mentor assignments.' });
    }
    const assignments = await MentorAssignment.find(query).populate('student', 'name email role').populate('mentor', 'name email role');
    const studentIds = assignments.map((assignment) => assignment.student?._id).filter(Boolean);
    const progress = await CourseProgress.find({ student: { $in: studentIds } }).populate('course', 'title').lean();
    const progressByStudent = new Map();
    for (const item of progress) {
      const key = item.student.toString();
      progressByStudent.set(key, [...(progressByStudent.get(key) || []), item]);
    }
    const withProgress = assignments.map((assignment) => ({
      ...assignment.toObject(),
      learnerProgress: (progressByStudent.get(assignment.student._id.toString()) || []).map((item) => {
        const quizValues = Object.values(item.quizResults || {});
        const assignmentValues = Object.values(item.assignmentResults || {});
        return {
          ...item,
          quizAttemptCount: quizValues.length,
          averageQuizScore: quizValues.length ? Math.round(quizValues.reduce((sum, score) => sum + Number(score || 0), 0) / quizValues.length) : null,
          assignmentResultCount: assignmentValues.length,
          averageAssignmentScore: assignmentValues.length ? Math.round(assignmentValues.reduce((sum, score) => sum + Number(score || 0), 0) / assignmentValues.length) : null,
        };
      }),
    }));
    return res.status(200).json({ success: true, count: withProgress.length, assignments: withProgress });
  } catch (error) {
    next(error);
  }
};

export const createMentorFeedback = async (req, res, next) => {
  try {
    const { studentId, content, type, courseId } = req.body;

    if (!studentId || !content) {
      return res.status(400).json({ success: false, message: 'Student and feedback content are required.' });
    }

    const assigned = await MentorAssignment.exists({ mentor: req.user._id, student: studentId, status: 'ACTIVE' });
    if (!assigned) return res.status(403).json({ success: false, message: 'You can only message learners assigned to you.' });

    const feedback = await MentorFeedback.create({
      mentor: req.user._id,
      student: studentId,
      course: courseId || null,
      content,
      type: type || 'GENERAL',
    });
    await Notification.create({ recipient: studentId, type: 'MENTOR_FEEDBACK', title: 'New mentor feedback', message: 'Your mentor shared new feedback with you.', link: '/student/mentor' });

    return res.status(201).json({ success: true, message: 'Feedback shared successfully.', feedback });
  } catch (error) {
    next(error);
  }
};

export const createMentoringSession = async (req, res, next) => {
  try {
    const { studentId, title, description, scheduledAt, duration } = req.body;

    if (!studentId || !title || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Student, title, and scheduled time are required.' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return res.status(400).json({ success: false, message: 'Session time must be a valid future date.' });
    }
    const assigned = await MentorAssignment.exists({ mentor: req.user._id, student: studentId, status: 'ACTIVE' });
    if (!assigned) return res.status(403).json({ success: false, message: 'You can only schedule sessions with learners assigned to you.' });

    const sessionDuration = duration === undefined ? 30 : Number(duration);
    if (!Number.isInteger(sessionDuration) || sessionDuration < 10 || sessionDuration > 240) return res.status(400).json({ success: false, message: 'Session duration must be between 10 and 240 minutes.' });

    const session = await MentoringSession.create({
      mentor: req.user._id,
      student: studentId,
      title,
      description: description || '',
      scheduledAt: scheduledDate,
      duration: sessionDuration,
      status: 'SCHEDULED',
    });
    await Notification.create({ recipient: studentId, type: 'MENTOR_SESSION', title: 'Mentor session scheduled', message: `${title} is scheduled for ${scheduledDate.toLocaleString()}.`, link: '/student/mentor' });

    return res.status(201).json({ success: true, message: 'Mentoring session scheduled successfully.', session });
  } catch (error) {
    next(error);
  }
};

export const updateMentorAssignment = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'COMPLETED', 'REMOVED'].includes(status)) return res.status(400).json({ success: false, message: 'Assignment status is invalid.' });
    const assignment = await MentorAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Mentor assignment not found.' });
    assignment.status = status;
    await assignment.save();
    return res.status(200).json({ success: true, assignment });
  } catch (error) { next(error); }
};

export const getMentorFeedback = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : req.user.role === 'mentor'
        ? { mentor: req.user._id }
        : { student: req.user._id };
    const feedback = await MentorFeedback.find(query)
      .populate('mentor', 'name')
      .populate('student', 'name')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: feedback.length, feedback });
  } catch (error) {
    next(error);
  }
};

export const getMySessions = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : req.user.role === 'mentor' ? { mentor: req.user._id } : { student: req.user._id };
    const sessions = await MentoringSession.find(query).populate('mentor', 'name email role').populate('student', 'name email role');
    return res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

export const updateMentoringSession = async (req, res, next) => {
  try {
    const session = await MentoringSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Mentoring session not found.' });
    if (req.user.role !== 'admin' && (req.user.role !== 'mentor' || session.mentor.toString() !== req.user._id.toString())) return res.status(403).json({ success: false, message: 'You cannot manage this session.' });
    const { status, notes, scheduledAt, duration } = req.body;
    if (status !== undefined) {
      if (!['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) return res.status(400).json({ success: false, message: 'Session status is invalid.' });
      session.status = status;
    }
    if (notes !== undefined) session.notes = String(notes).slice(0, 5000);
    if (scheduledAt !== undefined) {
      const date = new Date(scheduledAt);
      if (Number.isNaN(date.getTime()) || date <= new Date()) return res.status(400).json({ success: false, message: 'Scheduled time must be a valid future date.' });
      session.scheduledAt = date;
    }
    if (duration !== undefined) {
      if (!Number.isInteger(Number(duration)) || Number(duration) < 10 || Number(duration) > 240) return res.status(400).json({ success: false, message: 'Duration must be between 10 and 240 minutes.' });
      session.duration = Number(duration);
    }
    await session.save();
    return res.status(200).json({ success: true, session });
  } catch (error) { next(error); }
};
