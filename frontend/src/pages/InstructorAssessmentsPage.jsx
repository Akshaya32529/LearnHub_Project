import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, CheckCircle2, Plus, ClipboardList } from 'lucide-react';

export default function InstructorAssessmentsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [questionDrafts, setQuestionDrafts] = useState({});
  const [quizTitle, setQuizTitle] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState(100);
  const [quizModuleId, setQuizModuleId] = useState('');
  const [assignmentModuleId, setAssignmentModuleId] = useState('');
  const [quizSettings, setQuizSettings] = useState({ timeLimit: 30, attemptLimit: 2, passingScore: 70 });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [courseResult, quizResult, assignmentResult] = await Promise.all([
        api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/quizzes`), api.get(`/courses/${courseId}/assignments`),
      ]);
      setCourse(courseResult.data.course); setQuizzes(quizResult.data.quizzes || []); setAssignments(assignmentResult.data.assignments || []);
    } catch (err) { setError(err.message || 'Unable to load course assessments.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [courseId]);

  const createQuiz = async (event) => {
    event.preventDefault(); setBusy('quiz'); setError('');
    try { await api.post(`/courses/${courseId}/quizzes`, { title: quizTitle, moduleId: quizModuleId || undefined, ...quizSettings }); setQuizTitle(''); setNotice('Quiz created. Add questions before publishing.'); await load(); }
    catch (err) { setError(err.message || 'Could not create the quiz.'); }
    finally { setBusy(''); }
  };

  const addQuestion = async (quizId, event) => {
    event.preventDefault(); const draft = questionDrafts[quizId] || {};
    const options = (draft.options || '').split('\n').map((option) => option.trim()).filter(Boolean);
    setBusy(quizId); setError('');
    try { await api.post(`/quizzes/${quizId}/questions`, { questionText: draft.questionText, concept: draft.concept, options, correctAnswer: draft.correctAnswer, explanation: draft.explanation, points: Number(draft.points || 1) }); setQuestionDrafts({ ...questionDrafts, [quizId]: {} }); setNotice('Question added to the quiz.'); await load(); }
    catch (err) { setError(err.message || 'Could not add the question.'); }
    finally { setBusy(''); }
  };

  const publishQuiz = async (quiz) => {
    setBusy(quiz._id); setError('');
    try { await api.put(`/quizzes/${quiz._id}`, { isPublished: !quiz.isPublished }); setNotice(quiz.isPublished ? 'Quiz unpublished.' : 'Quiz published for enrolled learners.'); await load(); }
    catch (err) { setError(err.message || 'Could not update quiz publishing.'); }
    finally { setBusy(''); }
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete quiz “${quiz.title}” and its questions?`)) return;
    try { await api.delete(`/quizzes/${quiz._id}`); setNotice('Quiz deleted.'); await load(); }
    catch (err) { setError(err.message || 'Could not delete the quiz.'); }
  };

  const editQuiz = async (quiz) => {
    const title = window.prompt('Quiz title', quiz.title);
    if (title === null) return;
    const timeLimit = Number(window.prompt('Time limit in minutes', quiz.timeLimit));
    const attemptLimit = Number(window.prompt('Maximum attempts', quiz.attemptLimit));
    const passingScore = Number(window.prompt('Passing score (0–100)', quiz.passingScore));
    if (![timeLimit, attemptLimit, passingScore].every(Number.isFinite)) return;
    try { await api.put(`/quizzes/${quiz._id}`, { title, timeLimit, attemptLimit, passingScore }); setNotice('Quiz settings updated.'); await load(); }
    catch (err) { setError(err.message || 'Could not update quiz settings.'); }
  };

  const editQuestion = async (quiz, question) => {
    const questionText = window.prompt('Question', question.questionText);
    if (questionText === null) return;
    const optionsText = window.prompt('Options (one per line)', question.options.join('\n'));
    if (optionsText === null) return;
    const options = optionsText.split('\n').map((item) => item.trim()).filter(Boolean);
    const correctAnswer = window.prompt('Correct answer (must match an option)', question.correctAnswer);
    if (correctAnswer === null) return;
    try { await api.put(`/quizzes/${quiz._id}/questions/${question._id}`, { questionText, options, correctAnswer, points: question.points, explanation: question.explanation, concept: question.concept }); setNotice('Question updated.'); await load(); }
    catch (err) { setError(err.message || 'Could not update the question.'); }
  };

  const deleteQuestion = async (quiz, question) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/quizzes/${quiz._id}/questions/${question._id}`); setNotice('Question deleted.'); await load(); }
    catch (err) { setError(err.message || 'Could not delete the question.'); }
  };

  const editAssignment = async (assignment) => {
    const title = window.prompt('Assignment title', assignment.title);
    if (title === null) return;
    const instructions = window.prompt('Instructions', assignment.instructions || '');
    if (instructions === null) return;
    const maxScore = Number(window.prompt('Maximum score', assignment.maxScore));
    if (!Number.isFinite(maxScore)) return;
    const dueDate = window.prompt('Due date (ISO date/time), or leave blank for none', assignment.dueDate ? new Date(assignment.dueDate).toISOString() : '');
    if (dueDate === null) return;
    try { await api.put(`/assignments/${assignment._id}`, { title, instructions, maxScore, dueDate: dueDate || null }); setNotice('Assignment updated.'); await load(); }
    catch (err) { setError(err.message || 'Could not update the assignment.'); }
  };

  const deleteAssignment = async (assignment) => {
    if (!window.confirm(`Delete assignment “${assignment.title}” and submissions?`)) return;
    try { await api.delete(`/assignments/${assignment._id}`); setNotice('Assignment and submissions deleted.'); await load(); }
    catch (err) { setError(err.message || 'Could not delete the assignment.'); }
  };

  const createAssignment = async (event) => {
    event.preventDefault(); setBusy('assignment'); setError('');
    try { await api.post(`/courses/${courseId}/assignments`, { title: assignmentTitle, instructions: assignmentInstructions, moduleId: assignmentModuleId || undefined, dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null, maxScore: Number(assignmentMaxScore) }); setAssignmentTitle(''); setAssignmentInstructions(''); setAssignmentDueDate(''); setNotice('Assignment created.'); await load(); }
    catch (err) { setError(err.message || 'Could not create the assignment.'); }
    finally { setBusy(''); }
  };

  const loadSubmissions = async (assignmentId) => {
    setBusy(assignmentId); setError('');
    try { const { data } = await api.get(`/assignments/${assignmentId}/submissions`); setSubmissions({ ...submissions, [assignmentId]: data.submissions || [] }); }
    catch (err) { setError(err.message || 'Could not load submissions.'); }
    finally { setBusy(''); }
  };

  const grade = async (submission) => {
    const score = Number(window.prompt(`Score (0–100) for ${submission.student?.name}:`, submission.score ?? 0));
    if (!Number.isFinite(score)) return;
    const feedback = window.prompt('Feedback for the learner:', submission.feedback || '') ?? '';
    setBusy(submission._id); setError('');
    try { await api.post(`/assignments/submissions/${submission._id}/grade`, { score, feedback }); setNotice('Assignment graded and learner notified.'); await loadSubmissions(submission.assignment); }
    catch (err) { setError(err.message || 'Could not grade this submission.'); }
    finally { setBusy(''); }
  };

  if (loading) return <p className="py-20 text-center text-sm text-slate-500">Loading assessments…</p>;
  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7"><Link to={`/instructor/courses/${courseId}`} className="text-sm font-semibold text-brand-700">← Back to curriculum</Link><div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Course assessments</p><h1 className="mt-2 text-3xl font-extrabold">{course?.title || 'Assessments'}</h1></div>
    {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}{notice && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Quizzes</h2><form onSubmit={createQuiz} className="mt-4 flex flex-col sm:flex-row gap-2"><input required value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} placeholder="New quiz title" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select aria-label="Quiz module" value={quizModuleId} onChange={(event) => setQuizModuleId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Course level</option>{course?.modules?.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}</select><input aria-label="Time limit in minutes" type="number" min="1" value={quizSettings.timeLimit} onChange={(event) => setQuizSettings({ ...quizSettings, timeLimit: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-200 px-2 py-2 text-sm" /><input aria-label="Attempt limit" type="number" min="1" value={quizSettings.attemptLimit} onChange={(event) => setQuizSettings({ ...quizSettings, attemptLimit: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-200 px-2 py-2 text-sm" /><input aria-label="Passing score" type="number" min="0" max="100" value={quizSettings.passingScore} onChange={(event) => setQuizSettings({ ...quizSettings, passingScore: Number(event.target.value) })} className="w-24 rounded-xl border border-slate-200 px-2 py-2 text-sm" /><button disabled={busy === 'quiz'} className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-bold text-white"><Plus className="mr-1 inline w-4 h-4" />Create quiz</button></form><div className="mt-5 space-y-4">{quizzes.map((quiz) => <article key={quiz._id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">{quiz.title}</h3><p className="mt-1 text-xs text-slate-500">{quiz.timeLimit} min · {quiz.attemptLimit} attempts · pass at {quiz.passingScore}% · {quiz.isPublished ? 'Published' : 'Draft'}</p></div><div className="flex gap-2"><button onClick={() => publishQuiz(quiz)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800">{quiz.isPublished ? 'Unpublish' : 'Publish'}</button><button onClick={() => editQuiz(quiz)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Edit settings</button><button onClick={() => api.get(`/quizzes/${quiz._id}/attempts`).then(({ data }) => setNotice(`${data.count} quiz attempts recorded.`)).catch((err) => setError(err.message))} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">View attempts</button><button onClick={() => deleteQuiz(quiz)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Delete</button></div></div>{quiz.questions?.map((question) => <div key={question._id} className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold">{question.questionText}</p><span className="flex gap-2"><button onClick={() => editQuestion(quiz, question)} className="text-xs font-bold text-brand-700">Edit</button><button onClick={() => deleteQuestion(quiz, question)} className="text-xs font-bold text-rose-700">Delete</button></span></div>)}<form onSubmit={(event) => addQuestion(quiz._id, event)} className="mt-4 grid sm:grid-cols-2 gap-2"><input required value={questionDrafts[quiz._id]?.questionText || ''} onChange={(event) => setQuestionDrafts({ ...questionDrafts, [quiz._id]: { ...questionDrafts[quiz._id], questionText: event.target.value } })} placeholder="Question prompt" className="sm:col-span-2 rounded-lg border border-slate-200 p-2 text-xs" /><input value={questionDrafts[quiz._id]?.concept || ''} onChange={(event) => setQuestionDrafts({ ...questionDrafts, [quiz._id]: { ...questionDrafts[quiz._id], concept: event.target.value } })} placeholder="Concept tag for AI feedback" className="rounded-lg border border-slate-200 p-2 text-xs" /><input required value={questionDrafts[quiz._id]?.correctAnswer || ''} onChange={(event) => setQuestionDrafts({ ...questionDrafts, [quiz._id]: { ...questionDrafts[quiz._id], correctAnswer: event.target.value } })} placeholder="Correct answer (must match an option)" className="rounded-lg border border-slate-200 p-2 text-xs" /><textarea required value={questionDrafts[quiz._id]?.options || ''} onChange={(event) => setQuestionDrafts({ ...questionDrafts, [quiz._id]: { ...questionDrafts[quiz._id], options: event.target.value } })} placeholder="Answer options, one per line (minimum two)" rows="3" className="rounded-lg border border-slate-200 p-2 text-xs" /><div><textarea value={questionDrafts[quiz._id]?.explanation || ''} onChange={(event) => setQuestionDrafts({ ...questionDrafts, [quiz._id]: { ...questionDrafts[quiz._id], explanation: event.target.value } })} placeholder="Explanation shown after the attempt" rows="3" className="w-full rounded-lg border border-slate-200 p-2 text-xs" /></div><button disabled={busy === quiz._id} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Add question</button></form></article>)}{!quizzes.length && <p className="text-sm text-slate-500">No quizzes yet.</p>}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><ClipboardList className="w-5 h-5 text-brand-700" /> Assignments</h2><form onSubmit={createAssignment} className="mt-4 grid sm:grid-cols-2 gap-2"><input required value={assignmentTitle} onChange={(event) => setAssignmentTitle(event.target.value)} placeholder="Assignment title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input value={assignmentInstructions} onChange={(event) => setAssignmentInstructions(event.target.value)} placeholder="Instructions" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><select aria-label="Assignment module" value={assignmentModuleId} onChange={(event) => setAssignmentModuleId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Course level</option>{course?.modules?.map((module) => <option key={module._id} value={module._id}>{module.title}</option>)}</select><input aria-label="Assignment due date" type="datetime-local" value={assignmentDueDate} onChange={(event) => setAssignmentDueDate(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" /><input aria-label="Assignment maximum score" type="number" min="1" value={assignmentMaxScore} onChange={(event) => setAssignmentMaxScore(event.target.value)} className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm" /><button disabled={busy === 'assignment'} className="sm:col-span-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white">Create assignment</button></form><div className="mt-5 space-y-4">{assignments.map((assignment) => <article key={assignment._id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-4"><div><h3 className="font-bold">{assignment.title}</h3><p className="mt-1 text-xs text-slate-500">Max score {assignment.maxScore} · {assignment.instructions}</p></div><span className="flex gap-2"><button onClick={() => editAssignment(assignment)} className="text-xs font-bold text-brand-700">Edit</button><button onClick={() => deleteAssignment(assignment)} className="text-xs font-bold text-rose-700">Delete</button><button onClick={() => loadSubmissions(assignment._id)} className="text-xs font-bold text-brand-700">{busy === assignment._id ? 'Loading…' : 'View submissions'}</button></span></div>{submissions[assignment._id]?.map((submission) => <div key={submission._id} className="mt-3 rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-xs font-bold">{submission.student?.name} · {submission.status}</p><button onClick={() => grade(submission)} className="text-xs font-bold text-brand-700">Grade</button></div><p className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{submission.content}</p>{submission.feedback && <p className="mt-2 text-xs text-slate-500">Feedback: {submission.feedback}</p>}</div>)}</article>)}{!assignments.length && <p className="text-sm text-slate-500">No assignments yet.</p>}</div></section>
  </main>;
}
