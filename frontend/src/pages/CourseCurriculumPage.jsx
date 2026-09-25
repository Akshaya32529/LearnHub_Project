import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseById } from '../services/courseService';
import {
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from '../services/curriculumService';
import { useAuthStore } from '../store/useAuthStore';
import {
  FolderGit2,
  Plus,
  Edit2,
  Trash2,
  Layers,
  BookOpen,
  Video,
  FileText,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export default function CourseCurriculumPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [expandedModules, setExpandedModules] = useState({});

  // Module Modal state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', orderIndex: 1 });

  // Lesson Modal state
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    contentType: 'video',
    videoUrl: '',
    resourceUrl: '',
    content: '',
    duration: 10,
    isFreePreview: false,
    orderIndex: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const fetchCourseCurriculum = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourseById(courseId);
      setCourse(data.course);
      // Auto-expand all modules initially
      const expanded = {};
      data.course?.modules?.forEach((m) => {
        expanded[m._id] = true;
      });
      setExpandedModules(expanded);
    } catch (err) {
      setError(err.message || 'Failed to load course curriculum');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseCurriculum();
  }, [courseId]);

  const toggleModule = (id) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Module Actions ---
  const openAddModule = () => {
    setEditingModule(null);
    const nextOrder = (course?.modules?.length || 0) + 1;
    setModuleForm({ title: '', description: '', orderIndex: nextOrder });
    setIsModuleModalOpen(true);
  };

  const openEditModule = (mod) => {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title,
      description: mod.description || '',
      orderIndex: mod.orderIndex || 1,
    });
    setIsModuleModalOpen(true);
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingModule) {
        await updateModule(editingModule._id, moduleForm);
        setSuccessMsg(`Module "${moduleForm.title}" updated.`);
      } else {
        await createModule(courseId, moduleForm);
        setSuccessMsg(`Module "${moduleForm.title}" created.`);
      }
      setIsModuleModalOpen(false);
      fetchCourseCurriculum();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Module operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (modId, title) => {
    if (!window.confirm(`Are you sure you want to delete module "${title}" and all its lessons?`)) return;
    try {
      await deleteModule(modId);
      setSuccessMsg(`Module "${title}" deleted.`);
      fetchCourseCurriculum();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete module');
    }
  };

  // --- Lesson Actions ---
  const openAddLesson = (moduleId) => {
    setTargetModuleId(moduleId);
    setEditingLesson(null);
    const mod = course?.modules?.find((m) => m._id === moduleId);
    const nextOrder = (mod?.lessons?.length || 0) + 1;
    setLessonForm({
      title: '',
      description: '',
      contentType: 'video',
      videoUrl: '',
      resourceUrl: '',
      content: '',
      duration: 10,
      isFreePreview: false,
      orderIndex: nextOrder,
    });
    setIsLessonModalOpen(true);
  };

  const openEditLesson = (lesson) => {
    setTargetModuleId(lesson.module);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      contentType: lesson.contentType || 'video',
      videoUrl: lesson.videoUrl || '',
      resourceUrl: lesson.resourceUrl || '',
      content: lesson.content || '',
      duration: lesson.duration || 10,
      isFreePreview: Boolean(lesson.isFreePreview),
      orderIndex: lesson.orderIndex || 1,
    });
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLesson) {
        await updateLesson(editingLesson._id, lessonForm);
        setSuccessMsg(`Lesson "${lessonForm.title}" updated.`);
      } else {
        await createLesson(targetModuleId, lessonForm);
        setSuccessMsg(`Lesson "${lessonForm.title}" added to module.`);
      }
      setIsLessonModalOpen(false);
      fetchCourseCurriculum();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Lesson operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId, title) => {
    if (!window.confirm(`Are you sure you want to delete lesson "${title}"?`)) return;
    try {
      await deleteLesson(lessonId);
      setSuccessMsg(`Lesson "${title}" deleted.`);
      fetchCourseCurriculum();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete lesson');
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-400">Loading course curriculum...</div>;
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Failed to load course</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Course not found'}</p>
        <Link
          to="/instructor/courses"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
        </Link>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button and Hierarchical Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/instructor/courses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Courses
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>{course.category?.name || 'Category'}</span>
            <span>&gt;</span>
            <span className="text-slate-700 font-bold">{course.title}</span>
            <span>&gt;</span>
            <span className="text-brand-600 font-bold">Curriculum Structure</span>
          </div>
        </div>

        <button
          onClick={openAddModule}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-md shadow-brand-500/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Module
        </button>
      </div>

      {/* Course Hero Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {course.status || 'DRAFT'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {course.level}
            </span>
            <span className="text-xs text-brand-400 font-medium">
              Instructor: {course.instructor?.name || 'You'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{course.title}</h1>
          <p className="text-xs text-slate-400 leading-relaxed">{course.shortDescription || course.description}</p>
        </div>

        <div className="flex sm:flex-col gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Modules</span>
            <span className="text-lg font-bold text-white">{course.modules?.length || 0}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Lessons</span>
            <span className="text-lg font-bold text-brand-400">{totalLessons}</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Hierarchical Tree Guide */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <div>
          <span className="font-bold">Course Content Hierarchy (Module 2): </span>
          <span>
            <code>Category &rarr; Course &rarr; Module &rarr; Lesson</code>. Each module represents a chapter, and lessons deliver the instructional content.
          </span>
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {course.modules?.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No modules created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start building your syllabus by adding your first curriculum module.
            </p>
            <button
              onClick={openAddModule}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold cursor-pointer"
            >
              Add Module
            </button>
          </div>
        ) : (
          course.modules.map((mod, modIdx) => {
            const isExpanded = expandedModules[mod._id];
            return (
              <div
                key={mod._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                {/* Module Bar */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-50/60 hover:bg-slate-50 transition border-b border-slate-100">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                    onClick={() => toggleModule(mod._id)}
                  >
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          MODULE {mod.orderIndex || modIdx + 1}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{mod.title}</h3>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5 ml-0.5 line-clamp-1">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Module Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full text-[10px]">
                      {mod.lessons?.length || 0} Lessons
                    </span>
                    <button
                      onClick={() => openAddLesson(mod._id)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition cursor-pointer"
                      title="Add Lesson to this Module"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Lesson
                    </button>
                    <button
                      onClick={() => openEditModule(mod)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod._id, mod.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons Nested List */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-2 bg-white">
                    {mod.lessons?.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No lessons in this module yet.{' '}
                        <button
                          onClick={() => openAddLesson(mod._id)}
                          className="text-brand-600 font-semibold hover:underline"
                        >
                          Click here to add the first lesson.
                        </button>
                      </div>
                    ) : (
                      mod.lessons.map((lesson, lesIdx) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                              {lesson.contentType === 'video' ? (
                                <Video className="w-4 h-4 text-rose-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-brand-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-800">
                                  {lesIdx + 1}. {lesson.title}
                                </span>
                                {lesson.isFreePreview && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    <Eye className="w-2.5 h-2.5" /> Preview
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                                <span className="capitalize">{lesson.contentType}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" /> {lesson.duration || 10} mins
                                </span>
                                {lesson.videoUrl && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-400 font-mono text-[10px] truncate max-w-[200px]">
                                      {lesson.videoUrl}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditLesson(lesson)}
                              className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-white transition"
                              title="Edit Lesson"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Module Modal */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button onClick={() => setIsModuleModalOpen(false)} className="absolute top-5 right-5 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingModule ? 'Edit Module' : 'Add New Module'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">A module groups related lessons together.</p>

            <form onSubmit={handleModuleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g. JavaScript Fundamentals"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Overview of this module's topics..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                <input type="number" min="1" required value={moduleForm.orderIndex} onChange={(e) => setModuleForm({ ...moduleForm, orderIndex: Number(e.target.value) })} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingModule ? 'Save Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button onClick={() => setIsLessonModalOpen(false)} className="absolute top-5 right-5 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Configure the lesson content, media, and duration.</p>

            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="e.g. Variables & Scopes in JavaScript"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={lessonForm.contentType}
                    onChange={(e) => setLessonForm({ ...lessonForm, contentType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    <option value="video">Video Lecture</option>
                    <option value="article">Reading Article</option>
                    <option value="document">Documentation / Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {lessonForm.contentType === 'video' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Video Stream / Embed URL</label>
                  <input
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              )}

              {lessonForm.contentType === 'document' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resource URL</label>
                  <input type="url" value={lessonForm.resourceUrl} onChange={(e) => setLessonForm({ ...lessonForm, resourceUrl: e.target.value })} placeholder="https://example.com/lesson-notes.pdf" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                <input type="number" min="1" required value={lessonForm.orderIndex} onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: Number(e.target.value) })} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Summary / Content (Markdown or Text)
                </label>
                <textarea
                  rows="4"
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  placeholder="Key concepts, code snippets, or lesson outline..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFreePreview"
                  checked={lessonForm.isFreePreview}
                  onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isFreePreview" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Allow Free Preview (learners can preview this lesson before enrolling)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingLesson ? 'Save Lesson' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
