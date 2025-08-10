# Database Setup Instructions

## Critical: Run Updated Schema

The leave balance calculation has been fixed. You **MUST** run the updated database schema to fix the issues with:
- Earned Leave showing 0 (now calculates correctly based on DOJ)
- Leave balances not deducting when applications are approved

## Step 1: Update Database Schema

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Updated Schema**
   - Copy the entire contents of `database/schema.sql`
   - Paste into the SQL Editor
   - Click "Run" (or Ctrl/Cmd + Enter)

## Step 2: Refresh Leave Balances

After updating the schema, you need to refresh all leave balances:

1. **Go to Admin Tools**
   - Login to your application
   - Navigate to "Admin Tools" in the sidebar

2. **Click "Refresh All Leave Balances"**
   - This will recalculate all employee leave balances
   - Earned leaves will now show correct values based on DOJ

## What's Fixed

### ✅ Earned Leave Calculation
- **Before**: Always showed 0
- **After**: Correctly calculates 6 days per 6 months of service
- **Example**: DOJ 10/07/2022 → ~30 months service → 24 days earned leave

### ✅ Leave Balance Deduction
- **Before**: Balances didn't update when applications were approved
- **After**: Automatic deduction when status changes to "APPROVED"
- **Example**: Apply 3 days CL → Balance reduces from 12 to 9

### ✅ Database Triggers
- Auto-initialize balances for new employees
- Auto-update balances when applications are approved/rejected
- Proper earned leave calculation based on service period

## Testing the Fix

### Test Earned Leave Calculation
1. Go to Admin Tools page
2. Use the "Leave Calculation Test" component
3. Enter DOJ: 2022-07-10
4. Should show ~24 days earned leave (not 0)

### Test Leave Deduction
1. Create a test employee
2. Apply for 3 days casual leave
3. Approve the application
4. Check leave balance - should reduce from 12 to 9

## Leave Calculation Rules

### Medical Leave
- **Total**: 365 days for entire career
- **Deduction**: Manual when applied
- **Carry Forward**: No (lifetime total)

### Casual Leave (CL)
- **Total**: 12 days per calendar year
- **Deduction**: Automatic on approval
- **Carry Forward**: No (resets Jan 1st)

### Earned Leave (EL)
- **Earning Rate**: 6 days per 6 months of service
- **Calculation**: Floor(months_of_service ÷ 6) × 6
- **Deduction**: Automatic on approval
- **Carry Forward**: Yes

## Database Functions Created

### `initialize_employee_leave_balances(emp_id)`
- Calculates initial leave balances for new employees
- Properly calculates earned leave based on DOJ

### `update_leave_balance_on_approval()`
- Trigger function that runs when leave applications are approved
- Automatically deducts leave from balances

### `calculate_leave_balance(emp_id, leave_type, year)`
- Calculates current leave balance for an employee
- Accounts for service period and used leaves

## Troubleshooting

### Issue: Earned Leave still showing 0
**Solution**: 
1. Run the updated schema in Supabase SQL Editor
2. Use "Refresh All Leave Balances" in Admin Tools

### Issue: Leave not deducting after approval
**Solution**:
1. Ensure the updated schema is applied
2. Try changing application status to trigger the update

### Issue: Database errors
**Solution**:
1. Check Supabase logs in Dashboard → Logs
2. Ensure all functions and triggers are created
3. Verify RLS policies are in place

## Verification Checklist

- [ ] Updated schema applied in Supabase
- [ ] All database functions created successfully
- [ ] Triggers are active
- [ ] Leave balances refreshed via Admin Tools
- [ ] Earned leave showing correct values (not 0)
- [ ] Leave deduction working on approval
- [ ] New employees get proper initial balances

## Support

If you encounter any issues:
1. Check the Admin Tools page for troubleshooting tips
2. Use the Leave Calculation Test to verify calculations
3. Check Supabase Dashboard → Logs for any errors
