export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "admin" | "team_member" | "viewer"
export type GrantStage = "discovered" | "researching" | "applying" | "submitted" | "awarded" | "rejected"
export type OpportunityStatus = "pending_review" | "promoted" | "dismissed"
export type NotificationType = "new_opportunity" | "deadline_reminder" | "grant_updated" | "comment_added" | "milestone_due"
export type EmailMode = "off" | "digest" | "urgent"
export type StakeholderArchetype = "government" | "foundation" | "corporate" | "individual" | "other"
export type StakeholderActivityType = "meeting" | "email" | "call" | "follow_up" | "note"
export type TaskStatus = "open" | "in_progress" | "done" | "cancelled"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type EventType = "meeting" | "deadline" | "review" | "call" | "workshop" | "other"
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          avatar_url?: string | null
          role?: UserRole
          updated_at?: string
        }
      }
      grants: {
        Row: {
          id: string
          name: string
          funder: string
          amount_min: number | null
          amount_max: number | null
          amount_exact: number | null
          deadline: string | null
          stage: GrantStage
          category: string | null
          description: string | null
          funder_website: string | null
          application_url: string | null
          created_by: string | null
          promoted_from_opportunity: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          funder: string
          amount_min?: number | null
          amount_max?: number | null
          amount_exact?: number | null
          deadline?: string | null
          stage?: GrantStage
          category?: string | null
          description?: string | null
          funder_website?: string | null
          application_url?: string | null
          created_by?: string | null
          promoted_from_opportunity?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          funder?: string
          amount_min?: number | null
          amount_max?: number | null
          amount_exact?: number | null
          deadline?: string | null
          stage?: GrantStage
          category?: string | null
          description?: string | null
          funder_website?: string | null
          application_url?: string | null
          archived?: boolean
          updated_at?: string
        }
      }
      grant_assignees: {
        Row: {
          grant_id: string
          user_id: string
          assigned_at: string
        }
        Insert: {
          grant_id: string
          user_id: string
          assigned_at?: string
        }
        Update: Record<string, never>
      }
      stakeholders: {
        Row: {
          id: string
          name: string
          title: string | null
          email: string | null
          phone: string | null
          organization: string | null
          notes: string | null
          archetype: StakeholderArchetype
          linkedin_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          title?: string | null
          email?: string | null
          phone?: string | null
          organization?: string | null
          notes?: string | null
          archetype?: StakeholderArchetype
          linkedin_url?: string | null
          created_by?: string | null
        }
        Update: {
          name?: string
          title?: string | null
          email?: string | null
          phone?: string | null
          organization?: string | null
          notes?: string | null
          archetype?: StakeholderArchetype
          linkedin_url?: string | null
        }
      }
      grant_stakeholders: {
        Row: {
          grant_id: string
          stakeholder_id: string
        }
        Insert: {
          grant_id: string
          stakeholder_id: string
        }
        Update: Record<string, never>
      }
      stakeholder_activities: {
        Row: {
          id: string
          stakeholder_id: string
          user_id: string
          activity_type: StakeholderActivityType
          notes: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          stakeholder_id: string
          user_id: string
          activity_type: StakeholderActivityType
          notes?: string | null
          occurred_at?: string
        }
        Update: {
          notes?: string | null
          occurred_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          grant_id: string
          title: string
          due_date: string
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grant_id: string
          title: string
          due_date: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_by?: string | null
        }
        Update: {
          title?: string
          due_date?: string
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
        }
      }
      progress_notes: {
        Row: {
          id: string
          grant_id: string
          author_id: string | null
          body: string
          pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          grant_id: string
          author_id?: string | null
          body: string
          pinned?: boolean
        }
        Update: {
          body?: string
          pinned?: boolean
        }
      }
      documents: {
        Row: {
          id: string
          grant_id: string
          uploader_id: string | null
          file_name: string
          storage_path: string
          mime_type: string
          size_bytes: number
          created_at: string
        }
        Insert: {
          id?: string
          grant_id: string
          uploader_id?: string | null
          file_name: string
          storage_path: string
          mime_type: string
          size_bytes: number
        }
        Update: { file_name?: string }
      }
      activity_history: {
        Row: {
          id: string
          grant_id: string | null
          actor_id: string | null
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          grant_id?: string | null
          actor_id?: string | null
          action: string
          metadata?: Json | null
        }
        Update: Record<string, never>
      }
      opportunities: {
        Row: {
          id: string
          source: string
          external_id: string
          title: string
          funder: string | null
          description: string | null
          amount_text: string | null
          deadline_text: string | null
          deadline: string | null
          url: string | null
          raw_data: Json | null
          status: OpportunityStatus
          ai_score: number | null
          ai_rationale: string | null
          ai_scored_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          promoted_grant_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          external_id: string
          title: string
          funder?: string | null
          description?: string | null
          amount_text?: string | null
          deadline_text?: string | null
          deadline?: string | null
          url?: string | null
          raw_data?: Json | null
          status?: OpportunityStatus
        }
        Update: {
          status?: OpportunityStatus
          ai_score?: number | null
          ai_rationale?: string | null
          ai_scored_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          promoted_grant_id?: string | null
        }
      }
      opportunity_sources: {
        Row: {
          id: string
          name: string
          type: string
          url: string | null
          config: Json | null
          enabled: boolean
          last_fetched_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          url?: string | null
          config?: Json | null
          enabled?: boolean
        }
        Update: {
          name?: string
          type?: string
          url?: string | null
          config?: Json | null
          enabled?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string | null
          link: string | null
          read: boolean
          read_at: string | null
          grant_id: string | null
          opportunity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          body?: string | null
          link?: string | null
          read?: boolean
          grant_id?: string | null
          opportunity_id?: string | null
        }
        Update: {
          read?: boolean
          read_at?: string | null
        }
      }
      notification_preferences: {
        Row: {
          user_id: string
          email_mode: EmailMode
          email_digest_hour: number
          push_enabled: boolean
          slack_enabled: boolean
          deadline_reminders: boolean
          new_opportunity_threshold: number
          updated_at: string
        }
        Insert: {
          user_id: string
          email_mode?: EmailMode
          email_digest_hour?: number
          push_enabled?: boolean
          slack_enabled?: boolean
          deadline_reminders?: boolean
          new_opportunity_threshold?: number
        }
        Update: {
          email_mode?: EmailMode
          email_digest_hour?: number
          push_enabled?: boolean
          slack_enabled?: boolean
          deadline_reminders?: boolean
          new_opportunity_threshold?: number
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          fcm_token: string
          device_info: Json | null
          created_at: string
          last_active_at: string
        }
        Insert: {
          id?: string
          user_id: string
          fcm_token: string
          device_info?: Json | null
        }
        Update: {
          fcm_token?: string
          last_active_at?: string
        }
      }
      team_tasks: {
        Row: {
          id: string
          number: number
          title: string
          body: string | null
          status: TaskStatus
          priority: TaskPriority
          due_date: string | null
          created_by: string
          grant_id: string | null
          stakeholder_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          created_by: string
          grant_id?: string | null
          stakeholder_id?: string | null
        }
        Update: {
          title?: string
          body?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_date?: string | null
          grant_id?: string | null
          stakeholder_id?: string | null
          updated_at?: string
        }
      }
      task_assignments: {
        Row: {
          task_id: string
          profile_id: string
        }
        Insert: {
          task_id: string
          profile_id: string
        }
        Update: Record<string, never>
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author_id: string
          body: string
        }
        Update: {
          body?: string
        }
      }
      team_events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: EventType
          start_at: string
          end_at: string | null
          all_day: boolean
          recurrence: RecurrenceType
          recurrence_end: string | null
          created_by: string
          grant_id: string | null
          stakeholder_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_type?: EventType
          start_at: string
          end_at?: string | null
          all_day?: boolean
          recurrence?: RecurrenceType
          recurrence_end?: string | null
          created_by: string
          grant_id?: string | null
          stakeholder_id?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: EventType
          start_at?: string
          end_at?: string | null
          all_day?: boolean
          recurrence?: RecurrenceType
          recurrence_end?: string | null
          grant_id?: string | null
          stakeholder_id?: string | null
        }
      }
      event_attendees: {
        Row: {
          event_id: string
          profile_id: string
        }
        Insert: {
          event_id: string
          profile_id: string
        }
        Update: Record<string, never>
      }
      organization_settings: {
        Row: {
          id: number
          org_name: string
          mission_statement: string | null
          focus_areas: string[]
          ai_threshold: number
          slack_webhook_url: string | null
          grants_gov_query: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          org_name?: string
          mission_statement?: string | null
          focus_areas?: string[]
          ai_threshold?: number
          slack_webhook_url?: string | null
          grants_gov_query?: string | null
          updated_by?: string | null
        }
        Update: {
          org_name?: string
          mission_statement?: string | null
          focus_areas?: string[]
          ai_threshold?: number
          slack_webhook_url?: string | null
          grants_gov_query?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
    }
    Enums: {
      user_role: UserRole
      grant_stage: GrantStage
      opportunity_status: OpportunityStatus
      notification_type: NotificationType
      email_mode: EmailMode
      stakeholder_archetype: StakeholderArchetype
      stakeholder_activity_type: StakeholderActivityType
      task_status: TaskStatus
      task_priority: TaskPriority
      event_type: EventType
      recurrence_type: RecurrenceType
    }
  }
}
