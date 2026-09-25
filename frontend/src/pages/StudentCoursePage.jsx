import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, GraduationCap, PlayCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

export default function StudentCoursePage() {
  const { courseId } = useParams();
  const user = useAuthStore((state) => state.user);
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizHistory, setQuizHistory] = useState({});
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.course);
      if (user?.role === 'student') {
        const enrollmentResponse = await api.get('/enrollments/my');
        const matching = enrollmentResponse.data.enrollments?.find((item) => item.course?._id === courseId);
        setEnrolled(Boolean(matching));
        const progressResponse = await api.get('/progress/my');
        const courseProgress = progressResponse.data.progress?.find((item) => item.course?._id === courseId);
        setProgress(courseProgress || null);
        if (matching) {
          const [quizResponse, assignmentResponse] = await Promise.all([
            api.get(`/courses/${courseId}/quizzes`),
            api.get(`/courses/${courseId}/assignments`),
          ]);
          setQuizzes(quizResponse.data.quizzes || []);
          const historyResults = await Promise.allSettled((quizResponse.data.quizzes || []).map((quiz) => api.get(`/quizzes/${quiz._id}/history`)));
          setQuizHistory(Object.fromEntries((quizResponse.data.quizzes || []).map((quiz, index) => [quiz._id, historyResults[index].status === 'fulfilled' ? historyResults[index].value.data.attempts || [] : []])));
          setAssignments(assignmentResponse.data.assignments || []);
          const submissionsResponse = await Promise.all((assignmentResponse.data.assignments || []).map((assignment) => api.get(`/assignments/${assignment._id}/my-submission`)));
          setSubmissions(Object.fromEntries((assignmentResponse.data.assignments || []).map((assignment, index) => [assignment._id, submissionsResponse[index].data.submission])));
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load this course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [courseId, user?._id]);

  const enroll = async () => {
    setBusy('enroll'); setError('');
    try {
      await api.post(`/enrollments/courses/${courseId}/enroll`);
      setEnrolled(true); setNotice('You are enrolled. Your learning progress is ready.');
      await load();
    } catch (err) { setError(err.message || 'Could not enroll in this course.'); }
    finally { setBusy(''); }
  };

  const completeLesson = async (lessonId) => {
    setBusy(lessonId); setError('');
    try {
      const response = await api.post(`/progress/courses/${courseId}/lesson-progress`, { lessonId, completed: true });
      setProgress(response.data.progress); setNotice('Lesson marked complete.');
    } catch (err) { setError(err.message || 'Could not update your progress.'); }
    finally { setBusy(''); }
  };

  const submitAssignment = async (assignmentId) => {
    const content = drafts[assignmentId]?.trim();
    if (!content) { setError('Write your response before submitting.'); return; }
    setBusy(assignmentId); setError('');
    try {
      const response = await api.post(`/assignments/${assignmentId}/submit`, { content });
      setSubmissions((previous) => ({ ...previous, [assignmentId]: response.data.submission }));
      setNotice('Assignment submitted successfully.');
    } catch (err) { setError(err.message || 'Could not submit the assignment.'); }
    finally { setBusy(''); }
  };

  if (loading) return <div className="py-24 text-center text-sm text-slate-500">Loading course…</div>;
  if (error && !course) return <div className="max-w-3xl mx-auto p-12 text-center text-rose-700">{error}</div>;
  if (!course) return null;
  const completedLessons = progress?.lessonCompletion || {};
  const completedModules = progress?.moduleCompletion || {};

  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
    <Link to="/courses" className="text-sm text-brand-700 font-semibold">← Browse courses</Link>
    {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-800 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
    {notice && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
    <section className="rounded-3xl bg-slate-900 text-white p-7 sm:p-10">
      <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">{course.category?.name} · {String(course.level).toLowerCase()}</div>
      <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold">{course.title}</h1>
      <p className="mt-4 max-w-3xl text-sm text-slate-300 leading-6">{course.description}</p>
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-300"><span>Instructor: {course.instructor?.name}</span><span className="flex gap-1"><Clock className="w-3.5 h-3.5" />{course.duration}</span><span>{course.modules?.length || 0} modules</span></div>
      {user?.role === 'student' && !enrolled && <button onClick={enroll} disabled={busy === 'enroll'} className="mt-7 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950 disabled:opacity-60">{busy === 'enroll' ? 'Enrolling…' : 'Enroll for free'}</button>}
      {!user && <Link to="/login" state={{ from: `/courses/${courseId}` }} className="mt-7 inline-block rounded-xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-slate-950">Sign in to enroll</Link>}
      {progress && <div className="mt-6 max-w-lg"><div className="flex justify-between text-xs"><span>Course progress</span><span>{progress.percentage}%</span></div><div className="mt-2 h-2 rounded bg-white/20"><div className="h-full rounded bg-cyan-300" style={{ width: `${progress.percentage}%` }} /></div></div>}
    </section>

    <div className="grid lg:grid-cols-[1fr_320px] gap-7 items-start">
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Course curriculum</h2>
        {course.modules?.length ? course.modules.map((module) => <article key={module._id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Module {module.order || module.orderIndex}: {module.title}</h3>{completedModules[module._id] && <span className="text-[11px] font-bold text-emerald-700">Module complete</span>}</div><p className="mt-1 text-xs text-slate-500">{module.description}</p></div>
          <div className="divide-y divide-slate-100">{module.lessons?.length ? module.lessons.map((lesson) => <div key={lesson._id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <button onClick={() => setSelectedLessonId(selectedLessonId === lesson._id ? '' : lesson._id)} className="flex gap-3 text-left"><PlayCircle className="mt-0.5 w-4 h-4 text-brand-700" /><span><span className="block text-sm font-semibold text-slate-800">{lesson.order || lesson.orderIndex}. {lesson.title}</span><span className="mt-1 block text-xs text-slate-500">{lesson.duration} min · {lesson.isPreview || lesson.isFreePreview ? 'Preview' : lesson.type || lesson.contentType}</span></span></button>
              {enrolled ? <button onClick={() => completeLesson(lesson._id)} disabled={busy === lesson._id || completedLessons[lesson._id]} className="shrink-0 text-xs font-bold text-emerald-700 disabled:text-slate-400">{completedLessons[lesson._id] ? 'Completed' : busy === lesson._id ? 'Saving…' : 'Mark complete'}</button> : <span className="text-[11px] text-slate-400">{lesson.isPreview || lesson.isFreePreview ? 'Preview' : 'Enroll to unlock'}</span>}
            </div>
            {selectedLessonId === lesson._id && <div className="mt-4 ml-7 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{lesson.videoUrl && <a className="mb-3 block text-brand-700 underline" href={lesson.videoUrl} target="_blank" rel="noreferrer">Open lesson video</a>}{lesson.resourceUrl && <a className="mb-3 block text-brand-700 underline" href={lesson.resourceUrl} target="_blank" rel="noreferrer">Open lesson resource</a>}<div className="whitespace-pre-wrap">{lesson.content || lesson.description || 'Lesson content has not been added yet.'}</div></div>}
          </div>) : <p className="p-4 text-xs text-slate-500">{enrolled ? 'No lessons have been added to this module yet.' : 'Enroll to view the complete lesson list.'}</p>}</div>
        </article>) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Curriculum is being prepared.</div>}
      </section>

      {enrolled && <aside className="space-y-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-brand-700" /> Assessments</h2>
          <div className="mt-4 space-y-3">{quizzes.map((quiz) => <div key={quiz._id} className="rounded-xl border border-slate-200 p-3"><Link to={`/student/quizzes/${quiz._id}`} className="block hover:text-brand-700"><span className="text-sm font-semibold">{quiz.title}</span><span className="block mt-1 text-[11px] text-slate-500">{quiz.timeLimit} min · Pass {quiz.passingScore}%</span></Link>{quizHistory[quiz._id]?.length > 0 && <p className="mt-2 border-t pt-2 text-[11px] text-slate-600">Latest: {quizHistory[quiz._id][0].percentage}% · {quizHistory[quiz._id].length} completed attempt(s)</p>}</div>)}{!quizzes.length && <p className="text-xs text-slate-500">No published quizzes yet.</p>}</div>
        </section>
        <section className="bg-white border border-slate-200 rounded-2xl p-5"><h2 className="font-bold">Assignments</h2>
          <div className="mt-4 space-y-4">{assignments.map((assignment) => <div key={assignment._id} className="rounded-xl border border-slate-200 p-3"><p className="text-sm font-semibold">{assignment.title}</p><p className="mt-1 text-xs text-slate-500">{assignment.instructions || assignment.description}</p>{submissions[assignment._id] && submissions[assignment._id].status !== 'REJECTED' ? <><p className="mt-3 text-xs font-bold text-emerald-700">Status: {submissions[assignment._id].status}{submissions[assignment._id].score !== null ? ` · ${submissions[assignment._id].score}/${assignment.maxScore}` : ''}</p>{submissions[assignment._id].feedback && <p className="mt-2 text-xs text-slate-700">Feedback: {submissions[assignment._id].feedback}</p>}</> : <><textarea value={drafts[assignment._id] || ''} onChange={(event) => setDrafts({ ...drafts, [assignment._id]: event.target.value })} rows="3" placeholder="Write your assignment response…" className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-xs" /><button disabled={busy === assignment._id} onClick={() => submitAssignment(assignment._id)} className="mt-2 rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white">Submit response</button></>}</div>)}{!assignments.length && <p className="text-xs text-slate-500">No assignments have been added yet.</p>}</div>
        </section>
        {progress?.status === 'COMPLETED' && <Link to="/student/certificates" className="block rounded-xl bg-emerald-700 p-4 text-center text-sm font-bold text-white">View your certificate</Link>}
      </aside>}
    </div>
  </main>;
}
