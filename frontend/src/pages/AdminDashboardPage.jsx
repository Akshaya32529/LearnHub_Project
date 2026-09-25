import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, UserRoundCog, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const roles = ['student', 'instructor', 'reviewer', 'mentor', 'admin'];

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [mentorAssignments, setMentorAssignments] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [mentorId, setMentorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    setLoading(true);
    try { const [userResult, assignmentResult] = await Promise.all([api.get('/admin/users', { params: { limit: 100 } }), api.get('/mentors/assignments')]); setUsers(userResult.data.users || []); setMentorAssignments(assignmentResult.data.assignments || []); }
    catch (err) { setError(err.message || 'Unable to load platform users.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateUser = async (userId, updates) => {
    setError('');
    try { await api.patch(`/admin/users/${userId}`, updates); setNotice('Account access updated.'); await load(); }
    catch (err) { setError(err.message || 'Could not update this account.'); }
  };

  const assignMentor = async (event) => {
    event.preventDefault(); setError(''); setNotice('');
    try { await api.post('/mentors/assign', { studentId, mentorId }); setNotice('Mentor assignment created.'); setStudentId(''); setMentorId(''); await load(); }
    catch (err) { setError(err.message || 'Could not assign this mentor.'); }
  };

  const changeMentorAssignment = async (assignment, status) => {
    try { await api.patch(`/mentors/assignments/${assignment._id}`, { status }); setNotice(`Mentor assignment ${status.toLowerCase()}.`); await load(); }
    catch (err) { setError(err.message || 'Could not update mentor assignment.'); }
  };

  const students = users.filter((user) => user.role === 'student' && user.isActive);
  const mentors = users.filter((user) => user.role === 'mentor' && user.isActive);

  return <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
    <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-rose-950 p-8 text-white"><p className="text-xs font-bold uppercase tracking-widest text-rose-300">Platform administration</p><h1 className="mt-2 text-3xl font-extrabold">LearnHub control center</h1><p className="mt-2 text-sm text-rose-100">Manage access, mentor assignments, course categories, and platform metrics.</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/admin/categories" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900">Manage categories</Link><Link to="/admin/analytics" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white">Platform analytics</Link></div></section>
    {error && <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}{notice && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 flex gap-2"><CheckCircle2 className="w-4 h-4" />{notice}</div>}
    <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-6 items-start">
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="flex items-center gap-2 text-lg font-bold"><Users className="w-5 h-5 text-brand-700" /> User access</h2><p className="mt-1 text-xs text-slate-500">{users.length} accounts shown</p></div><button onClick={load} className="text-xs font-bold text-brand-700">Refresh</button></div>{loading ? <p className="p-8 text-center text-sm text-slate-500">Loading users…</p> : users.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No users are registered yet.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase text-slate-500"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Access</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user._id}><td className="px-4 py-3"><p className="font-semibold text-slate-900">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></td><td className="px-4 py-3"><select value={user.role} onChange={(event) => updateUser(user._id, { role: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td className="px-4 py-3"><button onClick={() => updateUser(user._id, { isActive: !user.isActive })} className={`rounded-full px-3 py-1 text-[11px] font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{user.isActive ? 'Active' : 'Disabled'}</button></td></tr>)}</tbody></table></div>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><UserRoundCog className="w-5 h-5 text-brand-700" /> Assign a mentor</h2><p className="mt-1 text-xs text-slate-500">Only active learner and mentor accounts can be paired.</p><form onSubmit={assignMentor} className="mt-5 space-y-4"><label className="block text-xs font-semibold text-slate-700">Student<select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"><option value="">Select a learner</option>{students.map((student) => <option key={student._id} value={student._id}>{student.name} · {student.email}</option>)}</select></label><label className="block text-xs font-semibold text-slate-700">Mentor<select required value={mentorId} onChange={(event) => setMentorId(event.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm"><option value="">Select a mentor</option>{mentors.map((mentor) => <option key={mentor._id} value={mentor._id}>{mentor.name}</option>)}</select></label><button disabled={!students.length || !mentors.length} className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><ShieldCheck className="mr-2 inline w-4 h-4" />Assign learner</button></form><p className="mt-3 text-[11px] text-slate-500">Create or elevate a mentor account in User Access first.</p></section>
      <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Mentor assignment management</h2>{mentorAssignments.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{mentorAssignments.map((assignment) => <article key={assignment._id} className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">{assignment.student?.name} ← {assignment.mentor?.name}</p><p className="mt-1 text-xs text-slate-500">{assignment.status}</p><div className="mt-3 flex gap-2">{assignment.status !== 'REMOVED' && <button onClick={() => changeMentorAssignment(assignment, 'REMOVED')} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800">Remove</button>}{assignment.status !== 'ACTIVE' && <button onClick={() => changeMentorAssignment(assignment, 'ACTIVE')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">Reactivate</button>}{assignment.status === 'ACTIVE' && <button onClick={() => changeMentorAssignment(assignment, 'COMPLETED')} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">Complete</button>}</div></article>)}</div> : <p className="mt-2 text-sm text-slate-500">No mentor assignments yet.</p>}</section>
    </div>
  </main>;
}
