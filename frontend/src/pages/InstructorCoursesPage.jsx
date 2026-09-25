import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../services/courseService';
import { getCategories } from '../services/categoryService';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Clock,
  BarChart,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [reviewHistory, setReviewHistory] = useState({});

  // Course Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    level: 'Beginner',
    duration: '10 Hours',
    thumbnail: '',
    learningOutcomes: '',
    requirements: '',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const openedRoute = useRef('');

  const { user } = useAuthStore();
  const isInstructor = user && (user.role === 'instructor' || user.role === 'admin');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesData, categoriesData] = await Promise.all([
        getCourses(),
        getCategories(),
      ]);
      setCourses(coursesData.courses || []);
      setCategories(categoriesData.categories || []);
      if (!formData.category && categoriesData.categories?.length > 0) {
        setFormData((prev) => ({ ...prev, category: categoriesData.categories[0]._id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewHistory = async (courseId) => {
    try {
      const { data } = await api.get(`/reviews/courses/${courseId}/history`);
      setReviewHistory((previous) => ({ ...previous, [courseId]: data.history || [] }));
    } catch (err) { setError(err.message || 'Could not load course review history.'); }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (loading || openedRoute.current === location.pathname) return;
    if (location.pathname.endsWith('/create')) {
      openedRoute.current = location.pathname;
      openCreateModal();
    } else if (location.pathname.endsWith('/edit') && courseId) {
      const course = courses.find((item) => item._id === courseId);
      if (course) {
        openedRoute.current = location.pathname;
        openEditModal(course);
      }
    }
  }, [loading, courses, location.pathname, courseId]);

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      shortDescription: '',
      description: '',
      category: categories[0]?._id || '',
      level: 'Beginner',
      duration: '10 Hours',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      learningOutcomes: '',
      requirements: '',
      tags: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      category: course.category?._id || course.category || '',
      level: course.level || 'Beginner',
      duration: course.duration || 'Self-paced',
      thumbnail: course.thumbnail || '',
      learningOutcomes: Array.isArray(course.learningOutcomes) ? course.learningOutcomes.join('\n') : '',
      requirements: Array.isArray(course.requirements) ? course.requirements.join('\n') : '',
      tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
    if (location.pathname.endsWith('/create') || location.pathname.endsWith('/edit')) {
      navigate('/instructor/courses');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        learningOutcomes: formData.learningOutcomes
          ? formData.learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        requirements: formData.requirements
          ? formData.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        tags: formData.tags
          ? formData.tags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      if (editingCourse) {
        await updateCourse(editingCourse._id, payload);
        setSuccessMsg(`Course "${formData.title}" updated successfully!`);
      } else {
        await createCourse(payload);
        setSuccessMsg(`Course "${formData.title}" created in DRAFT status!`);
      }
      closeModal();
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete course "${title}"? This will delete all associated modules and lessons.`)) return;
    try {
      await deleteCourse(id);
      setSuccessMsg(`Course "${title}" deleted.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const submitForReview = async (course) => {
    setError(null);
    try {
      await api.post(`/reviews/courses/${course._id}/submit`);
      setSuccessMsg(`“${course.title}” was submitted for review.`);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Could not submit this course for review.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Instructor Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Course & Curriculum Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, structure, and curate your educational courses, modules, and lessons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isInstructor ? (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Course
            </button>
          ) : null}
        </div>
      </div>

      {/* Role Reminder */}
      {!isInstructor && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              You are viewing in read-only mode ({user?.role || 'Guest'}). Switch to <strong>Course Instructor</strong> to create courses and build curriculum.
            </span>
          </div>
        </div>
      )}

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No courses created yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Design your course syllabus, organize structured modules, and add video/reading lessons.
          </p>
          {isInstructor && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              Create Course Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Course Thumbnail */}
                <div className="relative h-44 bg-slate-100 overflow-hidden group">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-700 to-indigo-600 text-white">
                      <BookOpen className="w-12 h-12 opacity-80" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/90 backdrop-blur-md text-white shadow-sm">
                      {course.status || 'DRAFT'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-white">
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold text-brand-600 uppercase tracking-wider">
                      {course.category?.name || 'General Category'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {course.duration}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 hover:text-brand-600 transition">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {course.shortDescription || course.description}
                  </p>

                  {course.reviewComment && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-bold uppercase text-amber-800">Latest review feedback</p><p className="mt-1 whitespace-pre-wrap text-xs text-amber-950">{course.reviewComment}</p></div>}
                  <button type="button" onClick={() => fetchReviewHistory(course._id)} className="text-left text-[11px] font-bold text-brand-700 hover:underline">{reviewHistory[course._id] ? 'Refresh review history' : 'View review history'}</button>
                  {reviewHistory[course._id] && <div className="max-h-32 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">{reviewHistory[course._id].length ? reviewHistory[course._id].map((entry) => <p key={entry._id} className="text-[11px] text-slate-600"><strong>{entry.action}</strong> · {entry.actor?.name || entry.reviewer?.name || 'LearnHub'} · {new Date(entry.createdAt).toLocaleDateString()} {entry.comment && `— ${entry.comment}`}</p>) : <p className="text-[11px] text-slate-500">No review events recorded.</p>}</div>}

                  {/* Curriculum Stats */}
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-brand-500" />
                      <strong>{course.moduleCount || 0}</strong> Modules
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <strong>{course.lessonCount || 0}</strong> Lessons
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/instructor/courses/${course._id}/curriculum`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition"
                >
                  <FolderGit2 className="w-3.5 h-3.5" /> Curriculum Builder
                </Link>

                <Link to={`/instructor/courses/${course._id}/assessments`} className="text-[11px] font-bold text-slate-600 hover:text-brand-700">Assessments</Link>

                {isInstructor && ['DRAFT', 'REJECTED', 'CHANGES_REQUESTED'].includes(course.status) && <button onClick={() => submitForReview(course)} className="text-[11px] font-bold text-indigo-700 hover:underline">Submit for review</button>}

                {isInstructor && (user?.role === 'admin' || ['DRAFT', 'REJECTED', 'CHANGES_REQUESTED'].includes(course.status)) && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/instructor/courses/${course._id}/edit`)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition"
                      title="Edit Course"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(course._id, course.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {editingCourse ? 'Edit Course Details' : 'Create New Course (Draft)'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Establish the basic metadata before organizing modules and lessons.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Modern Full-Stack MERN Architecture"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 15 Hours or Self-paced"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief 1-2 sentence hook for course cards"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Description *</label>
                  <textarea
                    rows="3"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Comprehensive overview of what this course offers..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Learning Outcomes (1 per line)
                  </label>
                  <textarea
                    rows="3"
                    value={formData.learningOutcomes}
                    onChange={(e) => setFormData({ ...formData, learningOutcomes: e.target.value })}
                    placeholder="Build full-stack applications&#10;Model MongoDB schemas"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requirements (1 per line)
                  </label>
                  <textarea
                    rows="3"
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    placeholder="Basic JavaScript knowledge&#10;Computer with Node.js installed"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                  ></textarea>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="React, Node.js, Express, MongoDB, Tailwind"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
