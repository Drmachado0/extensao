INSERT INTO subscriptions (user_id, plan, status, max_accounts, max_daily_actions) 
VALUES ('aca17a1e-e610-4f5e-9c43-858449b83e65', 'enterprise', 'active', 999, 99999);

UPDATE profiles SET plan = 'enterprise' WHERE id = 'aca17a1e-e610-4f5e-9c43-858449b83e65';