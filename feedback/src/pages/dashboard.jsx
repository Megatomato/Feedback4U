import React from 'react';
import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './teacher-dashboard';
import StudentDashboard from './student-dashboard';
import AdminDashboard from './admin-dashboard';

const Dashboard = () => {
  const { user, getUserType } = useAuth();
  const userType = getUserType();

  switch(userType) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  };
};

export default Dashboard;