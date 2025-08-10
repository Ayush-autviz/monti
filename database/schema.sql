-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employees table
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_code VARCHAR(6) UNIQUE NOT NULL,
    pfms_code VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sex VARCHAR(10) CHECK (sex IN ('Male', 'Female')) NOT NULL,
    dob DATE NOT NULL,
    doj DATE NOT NULL,
    confirmation_date DATE NOT NULL,
    retirement_date DATE,
    death_date DATE,
    marks TEXT,
    mobile_number VARCHAR(15) NOT NULL,
    grade_pay DECIMAL(10,2) NOT NULL,
    basic_pay DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_types table
CREATE TABLE leave_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default leave types
INSERT INTO leave_types (name, code, description) VALUES
('Medical Leave', 'MEDICAL', 'Total of 365 days in entire career'),
('Casual Leave', 'CL', '12 days per calendar year (Jan-Dec), do not carry forward'),
('Earned Leave', 'EL', '6 days every 6 months from date of joining, carry forward if not used');

-- Create leave_balances table
CREATE TABLE leave_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    total_allocated DECIMAL(5,2) NOT NULL DEFAULT 0,
    used DECIMAL(5,2) NOT NULL DEFAULT 0,
    remaining DECIMAL(5,2) NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- Create leave_applications table
CREATE TABLE leave_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_employee_code ON employees(employee_code);
CREATE INDEX idx_employees_pfms_code ON employees(pfms_code);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(employee_id, year);
CREATE INDEX idx_leave_applications_employee ON leave_applications(employee_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(start_date, end_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON leave_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate leave balance
CREATE OR REPLACE FUNCTION calculate_leave_balance(
    emp_id UUID,
    leave_type_code VARCHAR,
    target_year INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    employee_record employees%ROWTYPE;
    leave_type_record leave_types%ROWTYPE;
    total_allocated DECIMAL := 0;
    total_used DECIMAL := 0;
    years_of_service INTEGER;
    months_of_service INTEGER;
BEGIN
    -- Get employee details
    SELECT * INTO employee_record FROM employees WHERE id = emp_id;
    
    -- Get leave type details
    SELECT * INTO leave_type_record FROM leave_types WHERE code = leave_type_code;
    
    -- Calculate years and months of service
    years_of_service := EXTRACT(YEAR FROM AGE(DATE(target_year || '-12-31'), employee_record.doj));
    months_of_service := EXTRACT(MONTH FROM AGE(DATE(target_year || '-12-31'), employee_record.doj)) + (years_of_service * 12);
    
    -- Calculate allocation based on leave type
    IF leave_type_code = 'MEDICAL' THEN
        -- Medical leave: 365 days total for entire career
        total_allocated := 365;
        -- Get total used across all years
        SELECT COALESCE(SUM(days_requested), 0) INTO total_used
        FROM leave_applications la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.employee_id = emp_id 
        AND lt.code = 'MEDICAL' 
        AND la.status = 'APPROVED';
        
    ELSIF leave_type_code = 'CL' THEN
        -- Casual leave: 12 days per calendar year
        total_allocated := 12;
        -- Get used for specific year
        SELECT COALESCE(SUM(days_requested), 0) INTO total_used
        FROM leave_applications la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.employee_id = emp_id 
        AND lt.code = 'CL' 
        AND EXTRACT(YEAR FROM la.start_date) = target_year
        AND la.status = 'APPROVED';
        
    ELSIF leave_type_code = 'EL' THEN
        -- Earned leave: 6 days every 6 months
        -- Ensure we don't get negative months
        IF months_of_service < 0 THEN
            months_of_service := 0;
        END IF;
        total_allocated := FLOOR(months_of_service / 6.0) * 6;
        -- Get total used across all years (carries forward)
        SELECT COALESCE(SUM(days_requested), 0) INTO total_used
        FROM leave_applications la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.employee_id = emp_id
        AND lt.code = 'EL'
        AND la.status = 'APPROVED';
    END IF;
    
    RETURN total_allocated - total_used;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize leave balances for new employee
CREATE OR REPLACE FUNCTION initialize_employee_leave_balances(emp_id UUID)
RETURNS VOID AS $$
DECLARE
    leave_type_rec leave_types%ROWTYPE;
    employee_rec employees%ROWTYPE;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    months_of_service INTEGER;
    earned_leave_allocation DECIMAL;
    used_leave DECIMAL;
BEGIN
    -- Get employee details
    SELECT * INTO employee_rec FROM employees WHERE id = emp_id;

    -- Calculate months of service from DOJ to current date
    months_of_service := EXTRACT(YEAR FROM AGE(CURRENT_DATE, employee_rec.doj)) * 12 +
                        EXTRACT(MONTH FROM AGE(CURRENT_DATE, employee_rec.doj));

    -- Ensure we don't get negative months
    IF months_of_service < 0 THEN
        months_of_service := 0;
    END IF;

    -- Calculate earned leave allocation (6 days per 6 months)
    earned_leave_allocation := FLOOR(months_of_service / 6.0) * 6;

    -- Delete existing balances for this employee and year first
    DELETE FROM leave_balances
    WHERE employee_id = emp_id AND year = current_year;

    FOR leave_type_rec IN SELECT * FROM leave_types LOOP
        -- Calculate used leave for each type
        used_leave := 0;

        IF leave_type_rec.code = 'CL' THEN
            -- For CL, only count current year
            SELECT COALESCE(SUM(days_requested), 0) INTO used_leave
            FROM leave_applications la
            WHERE la.employee_id = emp_id
            AND la.leave_type_id = leave_type_rec.id
            AND la.status = 'APPROVED'
            AND EXTRACT(YEAR FROM la.start_date) = current_year;
        ELSIF leave_type_rec.code = 'MEDICAL' OR leave_type_rec.code = 'EL' THEN
            -- For Medical and EL, count all years
            SELECT COALESCE(SUM(days_requested), 0) INTO used_leave
            FROM leave_applications la
            WHERE la.employee_id = emp_id
            AND la.leave_type_id = leave_type_rec.id
            AND la.status = 'APPROVED';
        END IF;

        INSERT INTO leave_balances (employee_id, leave_type_id, year, total_allocated, used, remaining)
        VALUES (
            emp_id,
            leave_type_rec.id,
            current_year,
            CASE
                WHEN leave_type_rec.code = 'CL' THEN 12
                WHEN leave_type_rec.code = 'MEDICAL' THEN 365
                WHEN leave_type_rec.code = 'EL' THEN earned_leave_allocation
                ELSE 0
            END,
            used_leave,
            CASE
                WHEN leave_type_rec.code = 'CL' THEN GREATEST(0, 12 - used_leave)
                WHEN leave_type_rec.code = 'MEDICAL' THEN GREATEST(0, 365 - used_leave)
                WHEN leave_type_rec.code = 'EL' THEN GREATEST(0, earned_leave_allocation - used_leave)
                ELSE 0
            END
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize leave balances when new employee is added
CREATE OR REPLACE FUNCTION trigger_initialize_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_employee_leave_balances(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_employee_insert
    AFTER INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION trigger_initialize_leave_balances();

-- Function to update leave balance when application status changes
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
DECLARE
    leave_type_code VARCHAR;
    current_year INTEGER := EXTRACT(YEAR FROM NEW.start_date);
BEGIN
    -- Only process when status changes to APPROVED
    IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
        -- Get leave type code
        SELECT code INTO leave_type_code
        FROM leave_types
        WHERE id = NEW.leave_type_id;

        -- Update leave balance
        UPDATE leave_balances
        SET
            used = used + NEW.days_requested,
            remaining = remaining - NEW.days_requested,
            updated_at = NOW()
        WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = current_year;

        -- If no balance record exists for this year, create one
        IF NOT FOUND THEN
            INSERT INTO leave_balances (employee_id, leave_type_id, year, total_allocated, used, remaining)
            SELECT
                NEW.employee_id,
                NEW.leave_type_id,
                current_year,
                CASE
                    WHEN leave_type_code = 'CL' THEN 12
                    WHEN leave_type_code = 'MEDICAL' THEN 365
                    WHEN leave_type_code = 'EL' THEN
                        (SELECT FLOOR(EXTRACT(YEAR FROM AGE(NEW.start_date, e.doj)) * 12 +
                                     EXTRACT(MONTH FROM AGE(NEW.start_date, e.doj))) / 6.0) * 6
                         FROM employees e WHERE e.id = NEW.employee_id)
                    ELSE 0
                END,
                NEW.days_requested,
                CASE
                    WHEN leave_type_code = 'CL' THEN 12 - NEW.days_requested
                    WHEN leave_type_code = 'MEDICAL' THEN 365 - NEW.days_requested
                    WHEN leave_type_code = 'EL' THEN
                        (SELECT FLOOR(EXTRACT(YEAR FROM AGE(NEW.start_date, e.doj)) * 12 +
                                     EXTRACT(MONTH FROM AGE(NEW.start_date, e.doj))) / 6.0) * 6 - NEW.days_requested
                         FROM employees e WHERE e.id = NEW.employee_id)
                    ELSE 0
                END;
        END IF;

    -- If status changes from APPROVED to something else, restore the balance
    ELSIF OLD.status = 'APPROVED' AND NEW.status != 'APPROVED' THEN
        UPDATE leave_balances
        SET
            used = used - NEW.days_requested,
            remaining = remaining + NEW.days_requested,
            updated_at = NOW()
        WHERE employee_id = NEW.employee_id
        AND leave_type_id = NEW.leave_type_id
        AND year = current_year;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leave balance updates
CREATE TRIGGER update_leave_balance_trigger
    AFTER INSERT OR UPDATE ON leave_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance_on_approval();

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;

-- Create policies (for now, allow all operations - you can restrict based on auth later)
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on leave_types" ON leave_types FOR ALL USING (true);
CREATE POLICY "Allow all operations on leave_balances" ON leave_balances FOR ALL USING (true);
CREATE POLICY "Allow all operations on leave_applications" ON leave_applications FOR ALL USING (true);

-- Test function to check EL calculation for a specific DOJ
CREATE OR REPLACE FUNCTION test_el_calculation(doj_date DATE)
RETURNS TABLE(
    doj DATE,
    current_date_val DATE,
    months_of_service INTEGER,
    earned_leave_days INTEGER
) AS $$
DECLARE
    months_calc INTEGER;
    el_days INTEGER;
BEGIN
    -- Calculate months of service
    months_calc := EXTRACT(YEAR FROM AGE(CURRENT_DATE, doj_date)) * 12 +
                   EXTRACT(MONTH FROM AGE(CURRENT_DATE, doj_date));

    -- Ensure non-negative
    IF months_calc < 0 THEN
        months_calc := 0;
    END IF;

    -- Calculate EL days
    el_days := FLOOR(months_calc / 6.0) * 6;

    RETURN QUERY SELECT
        doj_date,
        CURRENT_DATE,
        months_calc,
        el_days;
END;
$$ LANGUAGE plpgsql;

-- Example usage: SELECT * FROM test_el_calculation('2022-07-10');
