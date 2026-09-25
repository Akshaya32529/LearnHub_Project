import api from './api';

// Modules
export const getCourseModules = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/modules`);
  return response.data;
};

export const createModule = async (courseId, data) => {
  const response = await api.post(`/courses/${courseId}/modules`, data);
  return response.data;
};

export const updateModule = async (id, data) => {
  const response = await api.put(`/modules/${id}`, data);
  return response.data;
};

export const deleteModule = async (id) => {
  const response = await api.delete(`/modules/${id}`);
  return response.data;
};

// Lessons
export const getModuleLessons = async (moduleId) => {
  const response = await api.get(`/modules/${moduleId}/lessons`);
  return response.data;
};

export const getLessonById = async (id) => {
  const response = await api.get(`/lessons/${id}`);
  return response.data;
};

export const createLesson = async (moduleId, data) => {
  const response = await api.post(`/modules/${moduleId}/lessons`, data);
  return response.data;
};

export const updateLesson = async (id, data) => {
  const response = await api.put(`/lessons/${id}`, data);
  return response.data;
};

export const deleteLesson = async (id) => {
  const response = await api.delete(`/lessons/${id}`);
  return response.data;
};
