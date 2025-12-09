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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          created_at: string
          id: string
          is_user: boolean
          message: string
          scripture: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_user: boolean
          message: string
          scripture?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_user?: boolean
          message?: string
          scripture?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      completed_prayers: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          prayer_schedule_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          prayer_schedule_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          prayer_schedule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completed_prayers_prayer_schedule_id_fkey"
            columns: ["prayer_schedule_id"]
            isOneToOne: false
            referencedRelation: "prayer_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_completions: {
        Row: {
          completed_at: string
          created_at: string
          habit_id: string
          id: string
          user_id: string
          value: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          habit_id: string
          id?: string
          user_id: string
          value?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          habit_id?: string
          id?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          is_private: boolean
          mood: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manifestations: {
        Row: {
          achieved_at: string | null
          category: string | null
          created_at: string
          gratitude_notes: string | null
          id: string
          intention: string
          is_achieved: boolean
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          category?: string | null
          created_at?: string
          gratitude_notes?: string | null
          id?: string
          intention: string
          is_achieved?: boolean
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          category?: string | null
          created_at?: string
          gratitude_notes?: string | null
          id?: string
          intention?: string
          is_achieved?: boolean
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meditation_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_seconds: number
          id: string
          meditation_type: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_seconds: number
          id?: string
          meditation_type?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_seconds?: number
          id?: string
          meditation_type?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prayer_schedules: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          mantra: string | null
          prayer_name: string
          scheduled_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          mantra?: string | null
          prayer_name: string
          scheduled_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          mantra?: string | null
          prayer_name?: string
          scheduled_time?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_streak: number
          avatar_url: string | null
          created_at: string
          current_level: number
          dharma_points: number
          email: string | null
          full_name: string | null
          id: string
          last_activity_date: string | null
          sin_free_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          app_streak?: number
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          dharma_points?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          sin_free_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          app_streak?: number
          avatar_url?: string | null
          created_at?: string
          current_level?: number
          dharma_points?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_activity_date?: string | null
          sin_free_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_completions: {
        Row: {
          completed_at: string
          id: string
          points_earned: number
          quest_id: number
          quest_title: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          points_earned?: number
          quest_id: number
          quest_title: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          points_earned?: number
          quest_id?: number
          quest_title?: string
          user_id?: string
        }
        Relationships: []
      }
      sin_logs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logged_at: string
          sin_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logged_at?: string
          sin_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logged_at?: string
          sin_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          has_completed_onboarding: boolean
          id: string
          is_active: boolean
          plan_type: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          trial_end_date: string
          trial_start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_completed_onboarding?: boolean
          id?: string
          is_active?: boolean
          plan_type?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_completed_onboarding?: boolean
          id?: string
          is_active?: boolean
          plan_type?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_logs: {
        Row: {
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          log_type: string | null
          title: string | null
          transcription: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          log_type?: string | null
          title?: string | null
          transcription?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          log_type?: string | null
          title?: string | null
          transcription?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
