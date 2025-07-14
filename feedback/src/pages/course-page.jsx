import React from 'react';
import { useAuth } from '../context/AuthContext';
import StudentCourseDetail from './student-course-detail';
import TeacherCourseDetail from './teacher-course-detail';

const CoursePage = () => {
  const { user } = useAuth();

  // Route to appropriate component based on user role
  if (user.role === 'student') {
    return <StudentCourseDetail />;
  } else if (user.role === 'teacher' || user.role === 'admin') {
    return <TeacherCourseDetail />;
  }

  // Fallback for unknown roles
  return <StudentCourseDetail />;
};

export default CoursePage;
