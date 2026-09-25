import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import api from '../services/api';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/enrollments/my').then(({ data }) => setEnrollments(data.enrollments || [])).catch((err) => setError(err.message || 'Your courses could not be loaded.')).finally(() => setLoading(false)); }, []);
  return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Learner workspace</p><h1 className="mt-2 text-3xl font-extrabold">My courses</h1>{error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{loading ? <p className="py-16 text-center text-sm text-slate-500">Loading your courses…</p> : enrollments.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{enrollments.map((item) => <article key={item._id} className="overflow-hidden rounded-2xl border bg-white"><div className="grid h-36 place-items-center bg-slate-100">{item.course?.thumbnail ? <img src={item.course.thumbnail} alt="" className="h-full w-full object-cover"/> : <BookOpen className="h-10 w-10 text-brand-700"/>}</div><div className="p-5"><p className="text-xs font-bold uppercase text-slate-500">{item.status}</p><h2 className="mt-2 text-lg font-bold">{item.course?.title}</h2><p className="mt-1 text-sm text-slate-600">{item.course?.shortDescription}</p><Link to={`/courses/${item.course?._id}`} className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-bold text-white">Continue learning</Link></div></article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">You are not enrolled in any courses yet. <Link className="font-bold text-brand-700" to="/courses">Browse courses</Link></div>}</main>;
}
