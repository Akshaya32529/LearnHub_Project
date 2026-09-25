import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import api from '../services/api';

export default function ReviewerQueuePage() {
  const [courses, setCourses] = useState([]);
  const [publishedCourses, setPublishedCourses] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/reviews/queue'); setCourses(data.courses || []); setPublishedCourses(data.publishedCourses || []); }
    catch (err) { setError(err.message || 'Unable to load the review queue.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const review = async (course, action) => {
    setBusyId(course._id); setError('');
    try {
      await api.post(`/reviews/courses/${course._id}/review`, { action, comment: comments[course._id] || '' });
      setNotice(`${course.title} moved to ${action.toLowerCase().replace('_', ' ')}.`);
      await load();
    } catch (err) { setError(err.message || 'Could not update the review.'); }
    finally { setBusyId(''); }
  };

  const actions = (status) => status === 'PUBLISHED'
    ? ['ARCHIVED']
    : status === 'SUBMITTED'
    ? ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'REJECTED']
    : status === 'UNDER_REVIEW'
      ? ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED']
      : status === 'APPROVED'
        ? ['PUBLISHED']
        : [];

  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Content quality</p><h1 className="mt-2 text-3xl font-extrabold text-slate-900">Course review queue</h1><p className="mt-2 text-sm text-slate-600">Review submitted curricula, record feedback, and approve content for learners.</p>
    {error && <div role="alert" className="mt-5 p-3 rounded-xl bg-rose-50 text-rose-800 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}{notice && <div className="mt-5 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
    {loading ? <p className="py-20 text-center text-sm text-slate-500">Loading review queue…</p> : courses.length === 0 ? <div className="mt-7 rounded-2xl border border-dashed p-12 text-center"><ClipboardCheck className="mx-auto w-10 h-10 text-slate-300" /><h2 className="mt-3 font-bold">No courses waiting for review</h2><p className="mt-1 text-sm text-slate-500">Submitted courses will appear here.</p></div> : <div className="mt-7 space-y-4">{courses.map((course) => <article key={course._id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">{course.status}</span><h2 className="mt-1 text-lg font-bold text-slate-900">{course.title}</h2><p className="mt-1 text-xs text-slate-500">{course.category?.name} · By {course.instructor?.name}</p></div><a href={`/courses/${course._id}`} className="text-xs font-semibold text-brand-700 underline">Review curriculum</a></div><p className="mt-4 text-sm text-slate-600">{course.description}</p><textarea value={comments[course._id] ?? course.reviewComment ?? ''} onChange={(event) => setComments({ ...comments, [course._id]: event.target.value })} rows="2" placeholder="Reviewer comments (required for changes or rejection)" className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm" /><div className="mt-3 flex flex-wrap gap-2">{actions(course.status).map((action) => <button key={action} disabled={busyId === course._id || (['REJECTED', 'CHANGES_REQUESTED'].includes(action) && !(comments[course._id] || '').trim())} onClick={() => review(course, action)} className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40 ${action === 'REJECTED' ? 'bg-rose-100 text-rose-800' : action === 'CHANGES_REQUESTED' ? 'bg-amber-100 text-amber-800' : 'bg-brand-700 text-white'}`}>{busyId === course._id ? 'Saving…' : action.replace('_', ' ')}</button>)}</div></article>)}</div>}
    {publishedCourses.length > 0 && <section className="mt-12"><h2 className="text-xl font-bold">Published courses</h2><p className="mt-1 text-sm text-slate-600">Administrators and reviewers can archive courses that should leave the catalog.</p><div className="mt-4 space-y-3">{publishedCourses.map((course) => <article key={course._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4"><div><p className="text-sm font-bold">{course.title}</p><p className="mt-1 text-xs text-slate-500">{course.category?.name} · By {course.instructor?.name}</p></div><button disabled={busyId === course._id} onClick={() => review(course, 'ARCHIVED')} className="rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800">{busyId === course._id ? 'Saving…' : 'Archive'}</button></article>)}</div></section>}
  </main>;
}
