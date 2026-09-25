import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import AdminCategoriesPage from '../pages/AdminCategoriesPage';
import InstructorCoursesPage from '../pages/InstructorCoursesPage';
import CourseCurriculumPage from '../pages/CourseCurriculumPage';
import NotFoundPage from '../pages/NotFoundPage';
import CourseCatalogPage from '../pages/CourseCatalogPage';
import StudentCoursePage from '../pages/StudentCoursePage';
import StudentDashboardPage from '../pages/StudentDashboardPage';
import QuizAttemptPage from '../pages/QuizAttemptPage';
import ReviewerQueuePage from '../pages/ReviewerQueuePage';
import AnalyticsPage from '../pages/AnalyticsPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import InstructorDashboardPage from '../pages/InstructorDashboardPage';
import MentorDashboardPage from '../pages/MentorDashboardPage';
import InstructorAssessmentsPage from '../pages/InstructorAssessmentsPage';
import StudentCertificatesPage from '../pages/StudentCertificatesPage';
import StudentCoursesPage from '../pages/StudentCoursesPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

const roleDashboards = {
  admin: <AdminDashboardPage />,
  instructor: <InstructorDashboardPage />,
  reviewer: <ReviewerQueuePage />,
  student: <StudentDashboardPage />,
  mentor: <MentorDashboardPage />,
};

export default function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/courses/:courseId" element={<StudentCoursePage />} />
        <Route path="/student/quizzes/:quizId" element={<ProtectedRoute allowedRoles={['student']}><QuizAttemptPage /></ProtectedRoute>} />
        <Route path="/student/mentor" element={<ProtectedRoute allowedRoles={['student']}><MentorDashboardPage /></ProtectedRoute>} />
        <Route path="/student/certificates" element={<ProtectedRoute allowedRoles={['student']}><StudentCertificatesPage /></ProtectedRoute>} />
        <Route path="/student/my-courses" element={<ProtectedRoute allowedRoles={['student']}><StudentCoursesPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}>{roleDashboards.admin}</ProtectedRoute>} />
        <Route path="/instructor" element={<ProtectedRoute allowedRoles={['instructor']}>{roleDashboards.instructor}</ProtectedRoute>} />
        <Route path="/reviewer" element={<ProtectedRoute allowedRoles={['reviewer']}>{roleDashboards.reviewer}</ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}>{roleDashboards.student}</ProtectedRoute>} />
        <Route path="/mentor" element={<ProtectedRoute allowedRoles={['mentor']}>{roleDashboards.mentor}</ProtectedRoute>} />

        <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategoriesPage /></ProtectedRoute>} />
        <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorCoursesPage /></ProtectedRoute>} />
        <Route path="/instructor/analytics" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/assessments" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorAssessmentsPage /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/reviewer/courses" element={<ProtectedRoute allowedRoles={['reviewer', 'admin']}><ReviewerQueuePage /></ProtectedRoute>} />
        <Route path="/instructor/courses/create" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorCoursesPage /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorCoursesPage /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><CourseCurriculumPage /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/curriculum" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><CourseCurriculumPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}
