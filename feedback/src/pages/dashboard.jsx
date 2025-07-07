import React from 'react';
import { Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, getUserType } = useAuth();
  const userType = getUserType();

  return (
    <Container className="py-5">
      <div className="text-center">
        <h1>Dashboard Placeholder</h1>
        <p className="text-muted">
          Welcome {userType}! Dashboard functionality will be implemented here.
        </p>
        <p>
          <strong>User ID:</strong> {user?.admin_id || user?.teacher_id || user?.student_id || 'N/A'}
        </p>
      </div>
    </Container>
  );
};

export default Dashboard; 