export const sampleData = {
  courses: [
    {
      id: 1,
      name: "Advanced Mathematics",
      code: "MATH301",
      instructor: "Dr. Sarah Johnson",
      description: "Advanced calculus and mathematical analysis",
      students: 25,
      completionRate: 85,
    },
    {
      id: 2,
      name: "Modern Physics",
      code: "PHYS201",
      instructor: "Prof. Michael Chen",
      description: "Quantum mechanics and relativity theory",
      students: 20,
      completionRate: 78,
    },
    {
      id: 3,
      name: "English Literature",
      code: "ENGL150",
      instructor: "Dr. Emma Wilson",
      description: "Contemporary literature and critical analysis",
      students: 30,
      completionRate: 92,
    },
    {
      id: 4,
      name: "World History",
      code: "HIST200",
      instructor: "Prof. David Martinez",
      description: "Global historical perspectives and analysis",
      students: 28,
      completionRate: 88,
    },
  ],
  assignments: [
    {
      id: 1,
      title: "Calculus Integration Problems",
      description: "Solve complex integration problems using advanced techniques",
      dueDate: "2025-07-15",
      submissionCount: 22,
      totalStudents: 25,
      courseId: 1
    },
    {
      id: 2,
      title: "Linear Algebra Project",
      description: "Matrix operations and eigenvalue analysis",
      dueDate: "2025-07-20",
      submissionCount: 15,
      totalStudents: 25,
      courseId: 1
    },
    {
      id: 3,
      title: "Quantum Mechanics Essay",
      description: "Analyze the implications of quantum mechanics in modern physics",
      dueDate: "2025-07-08",
      submissionCount: 18,
      totalStudents: 20,
      courseId: 2
    },
    {
      id: 4,
      title: "Poetry Analysis",
      description: "Critical analysis of contemporary poetry movements",
      dueDate: "2025-07-20",
      submissionCount: 28,
      totalStudents: 30,
      courseId: 3
    },
    {
      id: 5,
      title: "World War II Timeline",
      description: "Create a comprehensive timeline of major WWII events",
      dueDate: "2025-07-10",
      submissionCount: 26,
      totalStudents: 28,
      courseId: 4
    },
  ],
  students: [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      courses: [1, 2, 3],
      averageGrade: 92,
      submissionRate: 95,
    },
  ],
  submissions: [
    {
      id: 1,
      assignmentId: 1,
      studentId: 1,
      submittedAt: "2025-07-03T10:30:00Z",
      grade: 95,
      feedback: "Excellent work! Your integration techniques are very advanced.",
      status: "graded"
    },
    {
      id: 2,
      assignmentId: 3,
      studentId: 1,
      submittedAt: "2025-07-02T14:20:00Z",
      grade: 88,
      feedback: "Good analysis, but could expand on quantum entanglement concepts.",
      status: "graded"
    },
  ]
};
