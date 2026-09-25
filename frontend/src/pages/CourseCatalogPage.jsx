import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, SlidersHorizontal, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState({ search: '', category: '', level: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/enrollments/catalog', { params: { ...query, page, limit: 12 } });
      setCourses(response.data.courses || []);
      setPages(Math.max(1, response.data.pages || 1));
    } catch (err) {
      setError(err.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => setCategories([]));
  }, []);
  useEffect(() => { loadCourses(); }, [loadCourses]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">LearnHub course library</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">Find your next skill</h1>
        <p className="mt-3 text-sm text-slate-600">Browse reviewed courses and follow a structured path from lesson to assessment.</p>
      </div>

      <form onSubmit={(event) => { event.preventDefault(); setPage(1); loadCourses(); }} className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_220px_180px_auto] gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <label className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={query.search} onChange={(event) => { setPage(1); setQuery({ ...query, search: event.target.value }); }} placeholder="Search courses and skills" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200" /></label>
        <select aria-label="Category" value={query.category} onChange={(event) => { setPage(1); setQuery({ ...query, category: event.target.value }); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"><option value="">All categories</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select>
        <select aria-label="Level" value={query.level} onChange={(event) => { setPage(1); setQuery({ ...query, level: event.target.value }); }} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"><option value="">All levels</option><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select>
        <button className="inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold"><SlidersHorizontal className="w-4 h-4" /> Filter</button>
      </form>

      {error && <div className="mt-6 p-4 rounded-xl bg-rose-50 text-rose-800 text-sm flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      {loading ? <div className="py-20 text-center text-sm text-slate-500">Loading published courses…</div> : courses.length === 0 ? <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-12 text-center"><BookOpen className="w-10 h-10 mx-auto text-slate-300" /><p className="mt-3 font-bold text-slate-800">No courses match those filters</p><p className="mt-1 text-sm text-slate-500">Try another search or browse all levels.</p></div> : (
        <div className="mt-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{courses.map((course) => <article key={course._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
          {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-44 object-cover" /> : <div className="h-44 bg-gradient-to-br from-brand-800 to-indigo-600 grid place-items-center text-white"><BookOpen className="w-10 h-10" /></div>}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-brand-700"><span>{course.category?.name}</span><span>{String(course.level).toLowerCase()}</span></div>
            <h2 className="mt-2 text-lg font-bold text-slate-900">{course.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{course.shortDescription || course.description}</p>
            <p className="mt-4 text-xs text-slate-500">By {course.instructor?.name || 'LearnHub instructor'} · {course.duration || 'Self paced'}</p>
            <Link to={`/courses/${course._id}`} className="mt-5 block text-center px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-bold hover:bg-brand-800">View course</Link>
          </div>
        </article>)}</div>
      )}
      {!loading && pages > 1 && <nav aria-label="Course pages" className="mt-8 flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">Previous</button><span className="text-sm text-slate-600">Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">Next</button></nav>}
    </main>
  );
}
