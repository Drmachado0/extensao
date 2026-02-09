export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts_queue: {
        Row: {
          biography: string | null
          business_category: string | null
          created_at: string | null
          error_message: string | null
          external_url: string | null
          follow_ratio: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          has_profile_pic: boolean | null
          id: string
          ig_account_id: string | null
          ig_user_id: string
          is_business: boolean | null
          is_joined_recently: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          last_post_date: string | null
          mutual_followers: number | null
          posts_count: number | null
          processed_at: string | null
          profile_pic_url: string | null
          source: string | null
          status: string | null
          user_id: string
          username: string
        }
        Insert: {
          biography?: string | null
          business_category?: string | null
          created_at?: string | null
          error_message?: string | null
          external_url?: string | null
          follow_ratio?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          has_profile_pic?: boolean | null
          id?: string
          ig_account_id?: string | null
          ig_user_id: string
          is_business?: boolean | null
          is_joined_recently?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          last_post_date?: string | null
          mutual_followers?: number | null
          posts_count?: number | null
          processed_at?: string | null
          profile_pic_url?: string | null
          source?: string | null
          status?: string | null
          user_id: string
          username: string
        }
        Update: {
          biography?: string | null
          business_category?: string | null
          created_at?: string | null
          error_message?: string | null
          external_url?: string | null
          follow_ratio?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          has_profile_pic?: boolean | null
          id?: string
          ig_account_id?: string | null
          ig_user_id?: string
          is_business?: boolean | null
          is_joined_recently?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          last_post_date?: string | null
          mutual_followers?: number | null
          posts_count?: number | null
          processed_at?: string | null
          profile_pic_url?: string | null
          source?: string | null
          status?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_queue_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_filters: {
        Row: {
          account_id: string | null
          bio_contains: string[] | null
          bio_not_contains: string[] | null
          bio_url_contains: string | null
          bio_url_not_contains: string | null
          business_category_contains: string | null
          business_category_not_contains: string | null
          created_at: string | null
          filter_name: string
          has_profile_pic: boolean | null
          id: string
          is_active: boolean | null
          is_business: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          max_days_since_last_post: number | null
          max_follow_ratio: number | null
          max_followers: number | null
          max_following: number | null
          max_posts: number | null
          min_follow_ratio: number | null
          min_followers: number | null
          min_following: number | null
          min_posts: number | null
          skip_already_attempted: boolean | null
          skip_already_following: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          bio_contains?: string[] | null
          bio_not_contains?: string[] | null
          bio_url_contains?: string | null
          bio_url_not_contains?: string | null
          business_category_contains?: string | null
          business_category_not_contains?: string | null
          created_at?: string | null
          filter_name: string
          has_profile_pic?: boolean | null
          id?: string
          is_active?: boolean | null
          is_business?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          max_days_since_last_post?: number | null
          max_follow_ratio?: number | null
          max_followers?: number | null
          max_following?: number | null
          max_posts?: number | null
          min_follow_ratio?: number | null
          min_followers?: number | null
          min_following?: number | null
          min_posts?: number | null
          skip_already_attempted?: boolean | null
          skip_already_following?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          bio_contains?: string[] | null
          bio_not_contains?: string[] | null
          bio_url_contains?: string | null
          bio_url_not_contains?: string | null
          business_category_contains?: string | null
          business_category_not_contains?: string | null
          created_at?: string | null
          filter_name?: string
          has_profile_pic?: boolean | null
          id?: string
          is_active?: boolean | null
          is_business?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          max_days_since_last_post?: number | null
          max_follow_ratio?: number | null
          max_followers?: number | null
          max_following?: number | null
          max_posts?: number | null
          min_follow_ratio?: number | null
          min_followers?: number | null
          min_following?: number | null
          min_posts?: number | null
          skip_already_attempted?: boolean | null
          skip_already_following?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_filters_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      action_history: {
        Row: {
          action_type: string
          created_at: string | null
          details: string | null
          id: string
          ig_account_id: string | null
          result: string | null
          target_user_id: string | null
          target_username: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: string | null
          id?: string
          ig_account_id?: string | null
          result?: string | null
          target_user_id?: string | null
          target_username?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ig_account_id?: string | null
          result?: string | null
          target_user_id?: string | null
          target_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_history_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      action_logs: {
        Row: {
          account_id: string | null
          action_type: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          status: string | null
          target_instagram_id: string | null
          target_username: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_type: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string | null
          target_instagram_id?: string | null
          target_username?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string | null
          target_instagram_id?: string | null
          target_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      action_settings: {
        Row: {
          account_id: string | null
          action_delay_max: number | null
          action_delay_min: number | null
          auto_apply_filters: boolean | null
          auto_remove_from_queue: boolean | null
          comment_templates: string[] | null
          created_at: string | null
          daily_follow_limit: number | null
          daily_like_limit: number | null
          daily_unfollow_limit: number | null
          dont_unfollow_followers: boolean | null
          dont_unfollow_within_days: number | null
          hourly_action_limit: number | null
          id: string
          is_running: boolean | null
          like_latest_posts_count: number | null
          rate_limit_429_wait: number | null
          rate_limit_hard_wait: number | null
          rate_limit_soft_wait: number | null
          skip_delay_seconds: number | null
          unfollow_after_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_delay_max?: number | null
          action_delay_min?: number | null
          auto_apply_filters?: boolean | null
          auto_remove_from_queue?: boolean | null
          comment_templates?: string[] | null
          created_at?: string | null
          daily_follow_limit?: number | null
          daily_like_limit?: number | null
          daily_unfollow_limit?: number | null
          dont_unfollow_followers?: boolean | null
          dont_unfollow_within_days?: number | null
          hourly_action_limit?: number | null
          id?: string
          is_running?: boolean | null
          like_latest_posts_count?: number | null
          rate_limit_429_wait?: number | null
          rate_limit_hard_wait?: number | null
          rate_limit_soft_wait?: number | null
          skip_delay_seconds?: number | null
          unfollow_after_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_delay_max?: number | null
          action_delay_min?: number | null
          auto_apply_filters?: boolean | null
          auto_remove_from_queue?: boolean | null
          comment_templates?: string[] | null
          created_at?: string | null
          daily_follow_limit?: number | null
          daily_like_limit?: number | null
          daily_unfollow_limit?: number | null
          dont_unfollow_followers?: boolean | null
          dont_unfollow_within_days?: number | null
          hourly_action_limit?: number | null
          id?: string
          is_running?: boolean | null
          like_latest_posts_count?: number | null
          rate_limit_429_wait?: number | null
          rate_limit_hard_wait?: number | null
          rate_limit_soft_wait?: number | null
          skip_delay_seconds?: number | null
          unfollow_after_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_settings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          created_at: string | null
          details_json: Json | null
          id: string
          ig_account_id: string | null
          log_type: string | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details_json?: Json | null
          id?: string
          ig_account_id?: string | null
          log_type?: string | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details_json?: Json | null
          id?: string
          ig_account_id?: string | null
          log_type?: string | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attempted_accounts: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          ig_user_id: string
          result: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          ig_user_id: string
          result?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          ig_user_id?: string
          result?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempted_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_presets: {
        Row: {
          config_json: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config_json: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config_json?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_presets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      growth_stats: {
        Row: {
          created_at: string | null
          date: string
          followers_count: number | null
          following_count: number | null
          id: string
          ig_account_id: string | null
          posts_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          ig_account_id?: string | null
          posts_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          ig_account_id?: string | null
          posts_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_stats_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          created_at: string
          daily_actions_count: number | null
          daily_actions_reset_at: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          ig_username: string
          instagram_user_id: string | null
          is_active: boolean | null
          is_connected: boolean | null
          last_synced_at: string | null
          profile_pic_url: string | null
          session_data: Json | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_actions_count?: number | null
          daily_actions_reset_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          ig_username: string
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_connected?: boolean | null
          last_synced_at?: string | null
          profile_pic_url?: string | null
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_actions_count?: number | null
          daily_actions_reset_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          ig_username?: string
          instagram_user_id?: string | null
          is_active?: boolean | null
          is_connected?: boolean | null
          last_synced_at?: string | null
          profile_pic_url?: string | null
          session_data?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_queue: {
        Row: {
          author_username: string | null
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          ig_account_id: string | null
          likes_count: number | null
          media_id: string
          media_type: string | null
          media_url: string | null
          status: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          author_username?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          ig_account_id?: string | null
          likes_count?: number | null
          media_id: string
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          author_username?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          ig_account_id?: string | null
          likes_count?: number | null
          media_id?: string
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_queue_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          action_type: string | null
          created_at: string | null
          email_sent: boolean | null
          error_message: string | null
          id: string
          limit_name: string | null
          limit_percentage: number | null
          message: string
          notification_type: string
          push_sent: boolean | null
          read: boolean | null
          target_username: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_type?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          limit_name?: string | null
          limit_percentage?: number | null
          message: string
          notification_type: string
          push_sent?: boolean | null
          read?: boolean | null
          target_username?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_type?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          limit_name?: string | null
          limit_percentage?: number | null
          message?: string
          notification_type?: string
          push_sent?: boolean | null
          read?: boolean | null
          target_username?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_frequency: string | null
          email_on_action_completed: boolean | null
          email_on_error: boolean | null
          email_on_rate_limit: boolean | null
          id: string
          limit_warning_threshold: number | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_frequency?: string | null
          email_on_action_completed?: boolean | null
          email_on_error?: boolean | null
          email_on_rate_limit?: boolean | null
          id?: string
          limit_warning_threshold?: number | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_frequency?: string | null
          email_on_action_completed?: boolean | null
          email_on_error?: boolean | null
          email_on_rate_limit?: boolean | null
          id?: string
          limit_warning_threshold?: number | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          ig_session_data: string | null
          ig_user_id: string | null
          ig_username: string | null
          onboarding_completed: boolean | null
          plan: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          ig_session_data?: string | null
          ig_user_id?: string | null
          ig_username?: string | null
          onboarding_completed?: boolean | null
          plan?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          ig_session_data?: string | null
          ig_user_id?: string | null
          ig_username?: string | null
          onboarding_completed?: boolean | null
          plan?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_actions: {
        Row: {
          created_at: string | null
          function_label: string | null
          function_name: string
          id: string
          is_active: boolean | null
          last_run: string | null
          repeat_daily: boolean | null
          scheduled_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_label?: string | null
          function_name: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          repeat_daily?: boolean | null
          scheduled_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_label?: string | null
          function_name?: string
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          repeat_daily?: boolean | null
          scheduled_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_accounts: number | null
          max_daily_actions: number | null
          plan: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_accounts?: number | null
          max_daily_actions?: number | null
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_accounts?: number | null
          max_daily_actions?: number | null
          plan?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      target_queue: {
        Row: {
          account_id: string | null
          action_type: string | null
          created_at: string | null
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          source_name: string | null
          source_type: string | null
          status: string | null
          target_bio: string | null
          target_external_url: string | null
          target_follow_ratio: number | null
          target_followers: number | null
          target_following: number | null
          target_instagram_id: string | null
          target_is_business: boolean | null
          target_is_private: boolean | null
          target_is_verified: boolean | null
          target_last_post_date: string | null
          target_posts_count: number | null
          target_profile_pic_url: string | null
          target_username: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          source_name?: string | null
          source_type?: string | null
          status?: string | null
          target_bio?: string | null
          target_external_url?: string | null
          target_follow_ratio?: number | null
          target_followers?: number | null
          target_following?: number | null
          target_instagram_id?: string | null
          target_is_business?: boolean | null
          target_is_private?: boolean | null
          target_is_verified?: boolean | null
          target_last_post_date?: string | null
          target_posts_count?: number | null
          target_profile_pic_url?: string | null
          target_username: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_type?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          source_name?: string | null
          source_type?: string | null
          status?: string | null
          target_bio?: string | null
          target_external_url?: string | null
          target_follow_ratio?: number | null
          target_followers?: number | null
          target_following?: number | null
          target_instagram_id?: string | null
          target_is_business?: boolean | null
          target_is_private?: boolean | null
          target_is_verified?: boolean | null
          target_last_post_date?: string | null
          target_posts_count?: number | null
          target_profile_pic_url?: string | null
          target_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_queue_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      targeting_campaigns: {
        Row: {
          competitors: Json | null
          created_at: string
          hashtags: Json | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          niche: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitors?: Json | null
          created_at?: string
          hashtags?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          niche?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitors?: Json | null
          created_at?: string
          hashtags?: Json | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          niche?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "targeting_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          automation_paused: boolean | null
          automation_paused_at: string | null
          id: string
          settings_json: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_paused?: boolean | null
          automation_paused_at?: string | null
          id?: string
          settings_json?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_paused?: boolean | null
          automation_paused_at?: string | null
          id?: string
          settings_json?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whitelist: {
        Row: {
          added_at: string | null
          full_name: string | null
          id: string
          ig_account_id: string | null
          ig_user_id: string
          profile_pic_url: string | null
          reason: string | null
          user_id: string
          username: string
        }
        Insert: {
          added_at?: string | null
          full_name?: string | null
          id?: string
          ig_account_id?: string | null
          ig_user_id: string
          profile_pic_url?: string | null
          reason?: string | null
          user_id: string
          username: string
        }
        Update: {
          added_at?: string | null
          full_name?: string | null
          id?: string
          ig_account_id?: string | null
          ig_user_id?: string
          profile_pic_url?: string | null
          reason?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_ig_account_id_fkey"
            columns: ["ig_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_rate_limits: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
