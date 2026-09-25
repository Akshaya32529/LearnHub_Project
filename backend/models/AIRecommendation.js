import mongoose from 'mongoose';

const aiRecommendationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

aiRecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AIRecommendation', aiRecommendationSchema);
