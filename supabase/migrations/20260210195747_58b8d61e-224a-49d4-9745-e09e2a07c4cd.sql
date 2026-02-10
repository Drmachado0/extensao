CREATE OR REPLACE FUNCTION public.get_rate_limits(p_user_id uuid)
RETURNS json LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'follows', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'follow' 
      AND status = 'success' AND created_at > now() - interval '24 hours'), 0),
    'unfollows', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'unfollow' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0),
    'likes', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'like' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0),
    'comments', COALESCE((SELECT count(*) FROM action_logs 
      WHERE user_id = p_user_id AND action_type = 'comment' 
      AND status = 'success' AND created_at > now() - interval '1 hour'), 0)
  );
$$;