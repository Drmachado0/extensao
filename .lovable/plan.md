

# Migration Plan: New Supabase Tables with RLS

## Context

The project already has several tables (`instagram_accounts`, `whitelist`, `action_history`, `filters`, `user_settings`, etc.). The request is to create 7 new/replacement tables with a more complete schema. To avoid breaking existing functionality, we will create the new tables alongside the existing ones. Existing tables and code that reference them will continue to work.

## Tables to Create

### 1. Alter existing `instagram_accounts`
Add missing columns to the existing table rather than recreating it:
- `instagram_user_id` (text)
- `session_data` (jsonb)
- `last_synced_at` (timestamptz)
- `daily_actions_count` (integer, default 0)
- `daily_actions_reset_at` (timestamptz)
- `status` (text, default 'active')

The table already has: `id`, `user_id`, `ig_username`, `is_active`, `followers_count`, `following_count`, `created_at`, `updated_at`. RLS is already enabled with a proper policy.

### 2. Create `target_queue` (new table)
Full schema as requested with all target profile fields, source info, action type, status, priority. RLS policy: `user_id = auth.uid()` for ALL operations. Indexes on `user_id`, `account_id`, and `status`.

### 3. Create `action_filters` (new table)
Full schema with all filter criteria columns (min/max followers, following, posts, follow ratio, bio filters, etc.). RLS policy: `user_id = auth.uid()` for ALL. Indexes on `user_id` and `account_id`.

### 4. Create `action_settings` (new table)
Full schema with all delay/limit/automation settings. RLS policy: `user_id = auth.uid()` for ALL. Indexes on `user_id` and `account_id`.

### 5. Create `action_logs` (new table)
Full schema with action type, target info, status, details jsonb, error message. RLS policy: SELECT and INSERT only for `user_id = auth.uid()`. Index on `user_id`, `account_id`, and `created_at`.

### 6. Alter existing `whitelist`
Add missing columns to existing table:
- `account_id` (uuid, FK to instagram_accounts) -- currently has `ig_account_id`
- `target_instagram_id` (text) -- currently has `ig_user_id`
- `reason` (text)

Since existing columns serve similar purposes, we will add `reason` (the only truly missing column) and rename references in new code.

### 7. Create `subscriptions` (new table)
Full schema with plan, status, limits, Stripe fields, period dates. RLS policy: `user_id = auth.uid()` for ALL. Index on `user_id`.

## Migration SQL Summary

A single migration will:
1. ALTER `instagram_accounts` to add new columns
2. CREATE `target_queue` with full schema + RLS + indexes
3. CREATE `action_filters` with full schema + RLS + indexes
4. CREATE `action_settings` with full schema + RLS + indexes
5. CREATE `action_logs` with full schema + RLS + indexes
6. ALTER `whitelist` to add `reason` column
7. CREATE `subscriptions` with full schema + RLS + indexes
8. Add `updated_at` triggers on tables that need them

## Code Updates

After migration, update the following pages to use the new tables:
- **Filters page** (`src/pages/Filters.tsx`) -- query `action_filters` instead of `filters`
- **Settings page** (`src/pages/SettingsPage.tsx`) -- query `action_settings` instead of `user_settings`
- **Logs page** (`src/pages/Logs.tsx`) -- query `action_logs` instead of `action_history`
- **Queue page** (`src/pages/Queue.tsx`) -- query `target_queue` instead of `scheduled_actions`
- **Accounts page** (`src/pages/Accounts.tsx`) -- use new columns from `instagram_accounts`
- **Subscription page** (`src/pages/Subscription.tsx`) -- query `subscriptions` instead of `profiles.plan`
- **Dashboard page** (`src/pages/Dashboard.tsx`) -- use `action_logs` for metrics

## Technical Details

### RLS Pattern (same for all new tables)
```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own <table>"
  ON public.<table> FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

For `action_logs`, restrict to SELECT + INSERT only (no UPDATE/DELETE).

### Indexes Pattern
```sql
CREATE INDEX idx_<table>_user_id ON public.<table>(user_id);
CREATE INDEX idx_<table>_account_id ON public.<table>(account_id);
```

### Updated_at Trigger
Reuse existing `handle_updated_at()` function for tables with `updated_at`.

