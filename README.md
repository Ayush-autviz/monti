# Leave Management System

A comprehensive Employee Leave Management System built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

### Employee Management

- Add, edit, and delete employees
- Complete employee profiles with all required fields:
  - Employee Code (6 characters)
  - PFMS Code (14 characters)
  - Personal details (name, sex, DOB, mobile)
  - Service details (DOJ, confirmation date, retirement date)
  - Pay details (grade pay, basic pay)
  - Identifying marks

### Leave Management

- **Three types of leaves:**
  - **Medical Leave**: 365 days total for entire career
  - **Casual Leave (CL)**: 12 days per calendar year (no carry forward)
  - **Earned Leave (EL)**: 6 days every 6 months from DOJ (carry forward)

### Leave Application System

- Apply for leaves with validation
- Automatic balance calculation
- Working days calculation (excludes weekends)
- Status tracking (Pending, Approved, Rejected)
- Reason for leave requirement

### Dashboard & Analytics

- Real-time statistics and insights
- Interactive charts and graphs
- Leave trends analysis
- Employee leave balance overview
- Monthly leave patterns

### Responsive Design

- Mobile-friendly interface
- Desktop and tablet optimized
- Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd monti
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database/schema.sql` to create all tables and functions

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **employees**: Employee master data
- **leave_types**: Leave type definitions (Medical, CL, EL)
- **leave_balances**: Employee leave balance tracking
- **leave_applications**: Leave application records

### Key Features

- Automatic leave balance initialization for new employees
- Trigger-based balance calculations
- Row Level Security (RLS) enabled
- Comprehensive indexing for performance

## Usage Guide

### Adding Employees

1. Navigate to "Employees" page
2. Click "Add Employee"
3. Fill in all required fields
4. Leave balances are automatically initialized

### Applying for Leave

1. Go to "Apply Leave" page
2. Select employee and leave type
3. Choose dates and enter reason
4. System validates balance and calculates working days
5. Submit application

### Managing Applications

1. Visit "Leave Applications" page
2. View all applications with filters
3. Approve or reject pending applications
4. Track application history

### Viewing Reports

1. Dashboard shows overview statistics
2. Reports page provides detailed analytics
3. Charts show leave trends and patterns

## Business Rules

### Medical Leave

- 365 days total for entire career
- Cannot be replenished once used
- Deducted manually when applied

### Casual Leave

- 12 days per calendar year
- Resets every January 1st
- No carry forward to next year
- Maximum 5 consecutive days recommended

### Earned Leave

- 6 days earned every 6 months from DOJ
- Can be carried forward
- Maximum 30 consecutive days recommended
- Can be encashed on retirement

## Project Structure

```
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility functions
│   ├── database.ts       # Database operations
│   ├── supabase.ts       # Supabase client
│   └── leave-calculations.ts # Leave logic
└── database/             # Database schema
```

## License

This project is licensed under the MIT License.
