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
      linear_tickets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string
          created_at: string | null
          edited_summary: string | null
          id: string
          llm_summary: string
          status: string | null
          ticket_id: string
          ticket_title: string
          ticket_url: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at: string
          created_at?: string | null
          edited_summary?: string | null
          id?: string
          llm_summary: string
          status?: string | null
          ticket_id: string
          ticket_title: string
          ticket_url: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string
          created_at?: string | null
          edited_summary?: string | null
          id?: string
          llm_summary?: string
          status?: string | null
          ticket_id?: string
          ticket_title?: string
          ticket_url?: string
        }
        Relationships: []
      }
      pr_summaries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          author: string
          code_changes: Json | null
          created_at: string | null
          edited_summary: string | null
          id: string
          llm_summary: string
          merged_at: string
          original_description: string | null
          pr_number: number
          pr_title: string
          pr_url: string
          repository: string
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          author: string
          code_changes?: Json | null
          created_at?: string | null
          edited_summary?: string | null
          id?: string
          llm_summary: string
          merged_at: string
          original_description?: string | null
          pr_number: number
          pr_title: string
          pr_url: string
          repository: string
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          author?: string
          code_changes?: Json | null
          created_at?: string | null
          edited_summary?: string | null
          id?: string
          llm_summary?: string
          merged_at?: string
          original_description?: string | null
          pr_number?: number
          pr_title?: string
          pr_url?: string
          repository?: string
          status?: string | null
        }
        Relationships: []
      }
      release_entries: {
        Row: {
          created_at: string | null
          doc_pages_updated: Json | null
          doc_pr_merged: boolean | null
          doc_pr_url: string | null
          id: string
          linear_ticket_id: string | null
          pr_summary_id: string | null
          release_week: string
        }
        Insert: {
          created_at?: string | null
          doc_pages_updated?: Json | null
          doc_pr_merged?: boolean | null
          doc_pr_url?: string | null
          id?: string
          linear_ticket_id?: string | null
          pr_summary_id?: string | null
          release_week: string
        }
        Update: {
          created_at?: string | null
          doc_pages_updated?: Json | null
          doc_pr_merged?: boolean | null
          doc_pr_url?: string | null
          id?: string
          linear_ticket_id?: string | null
          pr_summary_id?: string | null
          release_week?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_entries_linear_ticket_id_fkey"
            columns: ["linear_ticket_id"]
            isOneToOne: false
            referencedRelation: "linear_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_entries_pr_summary_id_fkey"
            columns: ["pr_summary_id"]
            isOneToOne: false
            referencedRelation: "pr_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      release_notes: {
        Row: {
          created_at: string | null
          email_copy: string | null
          entries: Json | null
          id: string
          sent_at: string | null
          week_starting: string
        }
        Insert: {
          created_at?: string | null
          email_copy?: string | null
          entries?: Json | null
          id?: string
          sent_at?: string | null
          week_starting: string
        }
        Update: {
          created_at?: string | null
          email_copy?: string | null
          entries?: Json | null
          id?: string
          sent_at?: string | null
          week_starting?: string
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
