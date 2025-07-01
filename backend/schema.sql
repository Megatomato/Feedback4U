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
    subscription_renewal_amount VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

