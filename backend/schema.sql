-- Create admin table for schools
CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    admin_phone_number VARCHAR(255) NOT NULL,
    subscription_type VARCHAR(255) NOT NULL,
    subscription_start_date TIMESTAMP NOT NULL,
    subscription_end_date TIMESTAMP NOT NULL,
    subscription_status VARCHAR(255) NOT NULL,
    subscription_renewal_date TIMESTAMP NOT NULL,
    subscription_renewal_status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    teacher_id SERIAL PRIMARY KEY,
    teacher_email VARCHAR(255) UNIQUE NOT NULL,
    teacher_name VARCHAR(255) NOT NULL,
    teacher_phone_number VARCHAR(255) NOT NULL,
    teacher_password_hash VARCHAR(255) NOT NULL,
    teacher_is_active BOOLEAN NOT NULL,
    school_admin_id INTEGER NOT NULL REFERENCES admin(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_email VARCHAR(255) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    student_phone_number VARCHAR(255) NOT NULL,
    student_password_hash VARCHAR(255) NOT NULL,
    student_average_grade INTEGER NOT NULL,
    student_is_studying BOOLEAN NOT NULL,
    assigned_teacher_id INTEGER NOT NULL REFERENCES teachers(teacher_id),
    school_admin_id INTEGER NOT NULL REFERENCES admin(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    course_description VARCHAR(255) NOT NULL,
    course_is_active BOOLEAN NOT NULL,
    course_teacher_id INTEGER NOT NULL REFERENCES teachers(teacher_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id),
    course_id INTEGER NOT NULL REFERENCES courses(course_id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    assignment_name VARCHAR(255) NOT NULL,
    assignment_description VARCHAR(255) NOT NULL,
    assignment_due_date TIMESTAMP NOT NULL,
    assignment_is_completed BOOLEAN NOT NULL,
    assignment_course_id INTEGER NOT NULL REFERENCES courses(course_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submitted_assignments (
    submitted_assignment_id SERIAL PRIMARY KEY,
    submitted_assignment_student_id INTEGER NOT NULL REFERENCES students(student_id),
    submitted_assignment_course_id INTEGER NOT NULL REFERENCES courses(course_id),
    submitted_assignment_assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id),
    is_graded BOOLEAN NOT NULL,
    grade DECIMAL(5, 2),
    ai_feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,
    assignment_name VARCHAR(255) NOT NULL,
    assignment_description VARCHAR(255) NOT NULL,
    assignment_due_date TIMESTAMP NOT NULL,
    assignment_is_completed BOOLEAN NOT NULL,
    assignment_course_id INTEGER NOT NULL REFERENCES courses(course_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submitted_assignments (
    submitted_assignment_id SERIAL PRIMARY KEY,
    submitted_assignment_student_id INTEGER NOT NULL REFERENCES students(student_id),
    submitted_assignment_teacher_id INTEGER NOT NULL REFERENCES teachers(teacher_id),
    submitted_assignment_course_id INTEGER NOT NULL REFERENCES courses(course_id),
    submitted_assignment_assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id),
    submitted_assignment_is_completed BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);