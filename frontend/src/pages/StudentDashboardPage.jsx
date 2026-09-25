import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, Sparkles, UserRound, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [goalText, setGoalText] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/enrollments/my'), api.get('/progress/my'), api.get('/progress/certificates'), api.get('/auth/me'),
      api.get('/ai/recommendations'), api.get('/mentors/feedback'),
    ]).then((results) => {
      if (!active) return;
      const failures = [];
      results.forEach((result, index) => { if (result.status === 'rejected') failures.push(['enrollments', 'progress', 'certificates', 'profile', 'recommendations', 'mentor feedback'][index]); });
      setErrors(failures);
      if (results[0].status === 'fulfilled') setEnrollments(results[0].value.data.enrollments || []);
      if (results[1].status === 'fulfilled') setProgress(results[1].value.data.progress || []);
      if (results[2].status === 'fulfilled') setCertificates(results[2].value.data.certificates || []);
      if (results[3].status === 'fulfilled') setGoalText((results[3].value.data.user.profile?.learningGoals || []).join(', '));
      if (results[4].status === 'fulfilled') setRecommendations(results[4].value.data);
      if (results[5].status === 'fulfilled') setFeedback(results[5].value.data.feedback || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const saveGoals = async (event) => {
    event.preventDefault(); setGoalSaving(true); setGoalMessage('');
    try {
      const learningGoals = goalText.split(/[,\n]/).map((goal) => goal.trim()).filter(Boolean);
      await api.patch('/auth/me/profile', { learningGoals });
      setGoalMessage('Learning goals saved. Your recommendations will use them.');
    } catch (err) { setGoalMessage(err.message || 'Could not save learning goals.'); }
    finally { setGoalSaving(false); }
  };

  const progressFor = (courseId) => progress.find((item) => item.course?._id === courseId);

  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
    <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-indigo-900 p-7 sm:p-9 text-white"><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Your learning space</p><h1 className="mt-2 text-3xl font-extrabold">Welcome back, {user?.name?.split(' ')[0] || 'learner'}</h1><p className="mt-2 text-sm text-indigo-100">Keep moving through your courses. Your progress and next steps are below.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/courses" className="inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950">Explore courses</Link><Link to="/student/my-courses" className="inline-flex rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white">My courses</Link><Link to="/student/certificates" className="inline-flex rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white">Certificates</Link></div></section>
    {errors.length > 0 && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 flex gap-2"><AlertCircle className="w-4 h-4" />Some learning data could not be loaded: {errors.join(', ')}.</div>}
    {loading ? <p className="py-12 text-center text-sm text-slate-500">Loading your learning activity…</p> : <>
      <section className="grid sm:grid-cols-3 gap-4"><Stat icon={<BookOpen />} label="Enrolled courses" value={enrollments.length} /><Stat icon={<Award />} label="Certificates" value={certificates.length} /><Stat icon={<UserRound />} label="Mentor notes" value={feedback.length} /></section>
      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 items-start">
        <section><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Continue learning</h2><Link to="/courses" className="text-xs font-bold text-brand-700">Browse more</Link></div>{enrollments.length ? <div className="mt-4 space-y-3">{enrollments.map((item) => { const course = item.course; const courseProgress = progressFor(course?._id); return <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-bold text-slate-900">{course?.title || 'Course'}</h3><p className="mt-1 text-xs text-slate-500">{item.status === 'COMPLETED' ? 'Completed' : 'In progress'} · {courseProgress?.percentage || 0}%</p></div><Link to={`/courses/${course?._id}`} className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white">Open course</Link></div><div className="mt-3 h-2 rounded bg-slate-100"><div className="h-full rounded bg-brand-600" style={{ width: `${courseProgress?.percentage || 0}%` }} /></div></article>; })}</div> : <Empty title="No courses yet" text="Enroll in a published course to begin tracking progress." link="/courses" linkText="Browse courses" />}</section>
        <section className="rounded-2xl border border-indigo-100 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="w-5 h-5 text-indigo-600" /> Your next steps</h2>{recommendations?.message && <p className="mt-2 text-xs text-slate-500">{recommendations.message}</p>}{recommendations?.weakConcepts?.length ? <div className="mt-4 space-y-3">{recommendations.weakConcepts.slice(0, 4).map((item) => <div key={item.concept} className="rounded-xl bg-indigo-50 p-3"><p className="text-sm font-bold text-indigo-950">{item.concept}</p><p className="mt-1 text-xs text-indigo-800">{item.explanation}</p><p className="mt-1 text-[11px] text-indigo-700">{item.reason}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">Keep taking quizzes to identify concepts to review.</p>}{recommendations?.recommendedLessons?.length > 0 && <div className="mt-4"><p className="text-xs font-bold uppercase text-slate-500">Recommended lessons</p>{recommendations.recommendedLessons.slice(0, 4).map((lesson) => <Link key={lesson.id} to={`/courses/${lesson.courseId}`} className="mt-2 block rounded-lg border border-slate-100 p-3 text-sm font-semibold hover:border-indigo-300">{lesson.title}<span className="block text-xs font-normal text-slate-500">{lesson.courseTitle}</span></Link>)}</div>}</section>
      </div>
      <form onSubmit={saveGoals} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Learning goals</h2><p className="mt-1 text-sm text-slate-500">Add up to ten topics you want to learn. Personalized recommendations consider these goals and your actual course activity.</p><textarea value={goalText} onChange={(event) => setGoalText(event.target.value)} rows="2" maxLength={1100} placeholder="For example: React, data visualization, interview preparation" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"/><div className="mt-3 flex items-center justify-between gap-3"><p role="status" className="text-xs text-slate-600">{goalMessage}</p><button disabled={goalSaving} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{goalSaving ? 'Saving…' : 'Save goals'}</button></div></form>
      {recommendations?.recommendedPractice?.length > 0 && <section className="rounded-2xl border border-indigo-100 bg-white p-5"><h2 className="text-lg font-bold">Recommended practice</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{recommendations.recommendedPractice.slice(0, 4).map((quiz) => <Link key={quiz.id} to={`/student/quizzes/${quiz.id}`} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300"><p className="text-sm font-semibold">{quiz.title}</p><p className="mt-1 text-xs text-slate-500">{quiz.courseTitle}</p></Link>)}</div></section>}
      <div className="grid md:grid-cols-2 gap-6"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Certificates</h2>{certificates.length ? certificates.map((item) => <div key={item._id} className="mt-3 rounded-xl bg-emerald-50 p-3"><p className="text-sm font-bold text-emerald-900">{item.course?.title}</p><p className="mt-1 text-xs text-emerald-800">Certificate {item.certificateNumber}</p></div>) : <p className="mt-2 text-sm text-slate-500">Certificates appear when all course requirements are complete.</p>}<Link to="/student/certificates" className="mt-3 inline-block text-xs font-bold text-brand-700">View certificate history</Link></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Mentor support</h2><Link to="/student/mentor" className="text-xs font-bold text-brand-700">View details</Link></div>{feedback.length ? feedback.slice(0, 3).map((item) => <div key={item._id} className="mt-3 border-l-2 border-indigo-400 pl-3"><p className="text-xs text-slate-500">From {item.mentor?.name}</p><p className="mt-1 text-sm text-slate-800">{item.content}</p></div>) : <p className="mt-2 text-sm text-slate-500">Mentor feedback and sessions will show here when you are assigned.</p>}</section></div>
    </>}
  </main>;
}

function Stat({ icon, label, value }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-brand-700">{React.cloneElement(icon, { className: 'w-5 h-5' })}</span><p className="mt-4 text-2xl font-extrabold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>; }
function Empty({ title, text, link, linkText }) { return <div className="mt-4 rounded-2xl border border-dashed p-7"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p><Link to={link} className="mt-3 inline-block text-sm font-bold text-brand-700">{linkText} →</Link></div>; }
