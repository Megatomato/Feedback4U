import React from 'react';
import { useAuth } from '../context/AuthContext';
import TeacherDashboard from './teacher-dashboard';
import StudentDashboard from './student-dashboard';
import AdminDashboard from './admin-dashboard';

const Dashboard = () => {
  const { currentUser } = useAuth();

  switch(currentUser.role) {
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <StudentDashboard />;
  };
};

export default Dashboard;
