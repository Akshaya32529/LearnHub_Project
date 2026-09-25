import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { AlertCircle, CalendarDays, MessageSquareText, UsersRound } from 'lucide-react';

export default function MentorDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isMentor = user?.role === 'mentor';
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [learnerId, setLearnerId] = useState('');
  const [message, setMessage] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([api.get('/mentors/assignments'), api.get('/mentors/sessions'), api.get('/mentors/feedback')]);
    const failed = results.find((item) => item.status === 'rejected');
    if (failed) setError(failed.reason.message || 'Unable to load mentoring data.');
    if (results[0].status === 'fulfilled') setAssignments(results[0].value.data.assignments || []);
    if (results[1].status === 'fulfilled') setSessions(results[1].value.data.sessions || []);
    if (results[2].status === 'fulfilled') setFeedback(results[2].value.data.feedback || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const shareFeedback = async (event) => {
    event.preventDefault(); setError('');
    try { await api.post('/mentors/feedback', { studentId: learnerId, content: message, type: 'GENERAL' }); setMessage(''); setNotice('Feedback sent to the learner.'); await load(); }
    catch (err) { setError(err.message || 'Could not send feedback.'); }
  };
  const scheduleSession = async (event) => {
    event.preventDefault(); setError('');
    try { await api.post('/mentors/sessions', { studentId: learnerId, title: sessionTitle, scheduledAt: new Date(scheduledAt).toISOString(), duration: 30 }); setSessionTitle(''); setNotice('Mentor session scheduled.'); await load(); }
    catch (err) { setError(err.message || 'Could not schedule the session.'); }
  };

  const updateSession = async (session, status) => {
    setError('');
    try { await api.patch(`/mentors/sessions/${session._id}`, { status }); setNotice(`Session marked ${status.toLowerCase()}.`); await load(); }
    catch (err) { setError(err.message || 'Could not update the session.'); }
  };

  const learners = assignments.map((item) => item.student).filter(Boolean);
  const myStudentAssignment = assignments[0];

  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
    <section className="rounded-3xl bg-gradient-to-r from-teal-950 to-slate-900 p-8 text-white"><p className="text-xs font-bold uppercase tracking-widest text-teal-300">Learner support</p><h1 className="mt-2 text-3xl font-extrabold">{isMentor ? 'Mentor workspace' : 'Your mentor space'}</h1><p className="mt-2 text-sm text-teal-100">{isMentor ? 'Track assigned learners, review progress, and provide focused guidance.' : 'See mentor sessions and feedback connected to your learning.'}</p></section>
    {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}{notice && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {loading ? <p className="py-16 text-center text-sm text-slate-500">Loading mentoring information…</p> : <>
      {isMentor ? <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start"><section><h2 className="flex items-center gap-2 text-xl font-bold"><UsersRound className="w-5 h-5 text-teal-700" /> Assigned learners</h2>{assignments.length ? <div className="mt-4 space-y-4">{assignments.map((assignment) => <article key={assignment._id} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">{assignment.student?.name}</h3><p className="mt-1 text-xs text-slate-500">{assignment.student?.email} · {assignment.status}</p><div className="mt-4 grid sm:grid-cols-2 gap-3">{assignment.learnerProgress?.length ? assignment.learnerProgress.map((item) => <div key={item._id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold">{item.course?.title}</p><p className="mt-1 text-xs text-slate-500">{item.percentage}% · {item.status}</p><div className="mt-2 h-1.5 rounded bg-slate-200"><div className="h-full rounded bg-teal-600" style={{ width: `${item.percentage}%` }} /></div><p className="mt-2 text-[11px] text-slate-600">Quiz average: {item.averageQuizScore === null ? 'No attempts' : `${item.averageQuizScore}% (${item.quizAttemptCount})`} � Assignment average: {item.averageAssignmentScore === null ? 'No grades' : `${item.averageAssignmentScore} points (${item.assignmentResultCount})`}</p></div>) : <p className="text-xs text-slate-500">No course progress recorded yet.</p>}</div></article>)}</div> : <Empty text="An administrator will assign learners here." />}</section>
        <section className="space-y-5"><form onSubmit={shareFeedback} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><MessageSquareText className="w-4 h-4 text-teal-700" /> Share feedback</h2><select required value={learnerId} onChange={(event) => setLearnerId(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 p-2.5 text-sm"><option value="">Choose learner</option>{learners.map((learner) => <option key={learner._id} value={learner._id}>{learner.name}</option>)}</select><textarea required value={message} onChange={(event) => setMessage(event.target.value)} rows="4" placeholder="Write practical, supportive feedback…" className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm" /><button disabled={!learners.length} className="mt-3 w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Send feedback</button></form>
          <form onSubmit={scheduleSession} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><CalendarDays className="w-4 h-4 text-teal-700" /> Schedule a session</h2><select required value={learnerId} onChange={(event) => setLearnerId(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 p-2.5 text-sm"><option value="">Choose learner</option>{learners.map((learner) => <option key={learner._id} value={learner._id}>{learner.name}</option>)}</select><input required value={sessionTitle} onChange={(event) => setSessionTitle(event.target.value)} placeholder="Session topic" className="mt-3 w-full rounded-xl border border-slate-200 p-2.5 text-sm" /><input required type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 p-2.5 text-sm" /><button disabled={!learners.length} className="mt-3 w-full rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">Schedule session</button></form></section></div> : <div className="grid lg:grid-cols-2 gap-6"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Upcoming sessions</h2><p className="mt-1 text-sm text-slate-600">Assigned mentor: {myStudentAssignment?.mentor?.name || 'Not assigned yet'}</p>{sessions.length ? sessions.map((session) => <div key={session._id} className="mt-3 rounded-xl bg-slate-50 p-4"><p className="font-semibold">{session.title}</p><p className="mt-1 text-xs text-slate-500">With {session.mentor?.name} · {new Date(session.scheduledAt).toLocaleString()}</p></div>) : <Empty text="No sessions have been scheduled yet." />}</section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Mentor feedback</h2>{feedback.length ? feedback.map((item) => <div key={item._id} className="mt-3 rounded-xl border-l-2 border-teal-500 bg-slate-50 p-4"><p className="text-xs text-slate-500">From {item.mentor?.name} · {new Date(item.createdAt).toLocaleDateString()}</p><p className="mt-2 text-sm">{item.content}</p></div>) : <Empty text="Feedback from your mentor will appear here." />}</section></div>}
      {isMentor && <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Mentor sessions</h2>{sessions.length ? sessions.map((session) => <div key={session._id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span>{session.title} · {session.student?.name}<small className="block text-xs text-slate-500">{new Date(session.scheduledAt).toLocaleString()} · {session.status}</small></span>{session.status === 'SCHEDULED' && <span className="flex gap-2"><button onClick={() => updateSession(session, 'COMPLETED')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">Complete</button><button onClick={() => updateSession(session, 'CANCELLED')} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800">Cancel</button></span>}</div>) : <p className="mt-2 text-sm text-slate-500">No sessions scheduled.</p>}</section>}
    </>}
  </main>;
}
function Empty({ text }) { return <p className="mt-3 rounded-xl border border-dashed p-5 text-sm text-slate-500">{text}</p>; }
