import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Timer } from 'lucide-react';
import api from '../services/api';

export default function QuizAttemptPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get(`/quizzes/${quizId}`);
        if (!active) return;
        setQuiz(data.quiz);
        const started = await api.post(`/quizzes/${quizId}/start`);
        if (active) setAttempt(started.data);
      } catch (err) { if (active) setError(err.message || 'Unable to start this quiz.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [quizId]);

  useEffect(() => {
    if (!attempt || result) return undefined;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - new Date(attempt.startedAt).getTime()) / 1000);
      setRemaining(Math.max(0, attempt.timeLimit * 60 - elapsed));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result]);

  const submit = async (event) => {
    event.preventDefault();
    if (!attempt) return;
    setSubmitting(true); setError('');
    try {
      const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const { data } = await api.post(`/quizzes/${quizId}/attempts`, { attemptId: attempt.attemptId, answers: payload });
      setResult(data);
      try {
        const response = await api.post('/ai/assessment-feedback', { quizId, attemptId: data.attempt._id });
        setFeedback(response.data.feedback);
      } catch { /* Keep the scored result if the AI service is unavailable. */ }
    } catch (err) { setError(err.message || 'Could not submit this quiz.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="py-24 text-center text-sm text-slate-500">Loading assessment…</div>;
  if (!quiz) return <main className="max-w-3xl mx-auto p-12 text-center text-rose-700">{error || 'Quiz not found.'}</main>;
  const clock = remaining === null ? `${quiz.timeLimit}:00` : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  return <main className="max-w-3xl mx-auto px-4 py-10">
    <Link to="/student" className="text-sm font-semibold text-brand-700">← Student dashboard</Link>
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">LearnHub assessment</p><h1 className="mt-2 text-2xl font-extrabold text-slate-900">{quiz.title}</h1></div><span className={`flex items-center gap-1 text-xs font-bold ${remaining !== null && remaining < 60 ? 'text-rose-600' : 'text-slate-500'}`}><Timer className="w-4 h-4" />{clock}</span></div>
      {quiz.instructions && <p className="mt-4 text-sm text-slate-600">{quiz.instructions}</p>}
      {error && <div role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {!result ? <form onSubmit={submit} className="mt-7 space-y-6">{quiz.questions?.map((question, index) => <fieldset key={question._id} className="rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold text-slate-800">{index + 1}. {question.questionText} <span className="font-normal text-slate-500">({question.points} pts)</span></legend><div className="mt-3 space-y-2">{question.options.map((option) => <label key={option} className="flex cursor-pointer gap-3 rounded-xl border border-slate-100 p-3 text-sm hover:bg-slate-50"><input required type="radio" name={question._id} checked={answers[question._id] === option} onChange={() => setAnswers({ ...answers, [question._id]: option })} />{option}</label>)}</div></fieldset>)}<button disabled={submitting || !attempt} className="w-full rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{submitting ? 'Submitting…' : 'Submit answers'}</button></form> : <section className="mt-7">
        <div className={`rounded-2xl p-5 ${result.passed ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}><div className="flex items-center gap-2 font-bold"><CheckCircle2 className="w-5 h-5" />{result.expired ? 'Time expired' : result.passed ? 'You passed' : 'Keep practicing'} · {result.percentage}%</div><p className="mt-1 text-sm">Passing score: {quiz.passingScore}%</p></div>
        {feedback && <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><h2 className="font-bold text-indigo-950">Personalized feedback</h2><p className="mt-2 text-sm text-indigo-900">{feedback.explanation}</p>{feedback.message && <p className="mt-2 text-xs text-indigo-700">{feedback.message}</p>}</div>}
        <div className="mt-5 space-y-3">{result.results?.map((item) => <div key={item.questionId} className="rounded-xl border border-slate-200 p-4"><p className={`text-sm font-bold ${item.correct ? 'text-emerald-700' : 'text-rose-700'}`}>{item.correct ? 'Correct' : 'Review this answer'}</p><p className="mt-1 text-xs text-slate-600">Your answer: {item.selectedAnswer || 'No answer'} · Correct answer: {item.correctAnswer}</p>{item.explanation && <p className="mt-2 text-xs text-slate-500">{item.explanation}</p>}</div>)}</div>
        <Link to="/student" className="mt-6 inline-block rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">Back to learning</Link>
      </section>}
    </div>
  </main>;
}
