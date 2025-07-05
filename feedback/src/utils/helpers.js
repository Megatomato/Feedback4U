export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStatusBadge = (daysUntil) => {
  if (daysUntil < 0) return 'danger';
  if (daysUntil <= 3) return 'warning';
  if (daysUntil <= 7) return 'info';
  return 'success';
};

export const calculateAverageGrade = (submissions) => {
  if (submissions.length === 0) return 0;
  const total = submissions.reduce((sum, submission) => sum + submission.grade, 0);
  return Math.round(total / submissions.length);
};

export const getSubmissionStatus = (assignment, submissions) => {
  const submission = submissions.find(s => s.assignmentId === assignment.id);
  if (!submission) return 'not_submitted';
  return submission.status;
};
