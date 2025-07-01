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

