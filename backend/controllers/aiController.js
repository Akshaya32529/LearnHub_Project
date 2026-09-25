import mongoose from 'mongoose';
import { isDbConnected } from '../config/db.js';
import { getLearningPath, getWeakConcepts, getRecommendations, getAttemptFeedback } from '../services/aiLearningService.js';

const requireDatabase = (res) => !isDbConnected() && res.status(503).json({ success: false, message: 'Learning recommendations are temporarily unavailable.' });

export const learningPath = async (req, res, next) => {
  try {
    if (requireDatabase(res)) return;
    return res.status(200).json({ success: true, ...(await getLearningPath(req.user._id)) });
  } catch (error) { next(error); }
};

export const weakConcepts = async (req, res, next) => {
  try {
    if (requireDatabase(res)) return;
    return res.status(200).json({ success: true, ...(await getWeakConcepts(req.user._id)) });
  } catch (error) { next(error); }
};

export const recommendations = async (req, res, next) => {
  try {
    if (requireDatabase(res)) return;
    return res.status(200).json({ success: true, ...(await getRecommendations(req.user._id)) });
  } catch (error) { next(error); }
};

export const assessmentFeedback = async (req, res, next) => {
  try {
    if (requireDatabase(res)) return;
    const { quizId, attemptId } = req.body;
    if (!mongoose.isValidObjectId(quizId) || !mongoose.isValidObjectId(attemptId)) {
      return res.status(400).json({ success: false, message: 'Valid quiz and attempt identifiers are required.' });
    }
    const feedback = await getAttemptFeedback({ studentId: req.user._id, quizId, attemptId });
    if (!feedback) return res.status(404).json({ success: false, message: 'Assessment attempt not found.' });
    return res.status(200).json({ success: true, feedback });
  } catch (error) { next(error); }
};
