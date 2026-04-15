export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended' | 'inactive'
export type WouldUse = 'yes' | 'maybe' | 'no'
export type UserRole = 'user' | 'startup_owner' | 'admin'
export type VoteType = 'support'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          is_research_participant: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: UserRole
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }
      startup_categories: {
        Row: { id: string; name: string; slug: string }
        Insert: Omit<Database['public']['Tables']['startup_categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['startup_categories']['Insert']>
      }
      startup_stages: {
        Row: { id: string; name: string; slug: string; sort_order: number }
        Insert: Omit<Database['public']['Tables']['startup_stages']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['startup_stages']['Insert']>
      }
      startups: {
        Row: {
          id: string
          name: string
          slug: string
          tagline: string
          description: string
          website_url: string
          logo_path: string | null
          category_id: string | null
          stage_id: string | null
          verification_status: VerificationStatus
          founded_at: string | null
          location: string | null
          team_size: number | null
          pricing_model: string | null
          ai_stack: string[] | null
          target_audience: string | null
          is_promoted: boolean
          is_featured: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['startups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['startups']['Insert']>
      }
      startup_social_links: {
        Row: { id: string; startup_id: string; platform: string; url: string }
        Insert: Omit<Database['public']['Tables']['startup_social_links']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['startup_social_links']['Insert']>
      }
      startup_team_members: {
        Row: {
          id: string
          startup_id: string
          name: string
          title: string | null
          linkedin_url: string | null
          is_public: boolean
        }
        Insert: Omit<Database['public']['Tables']['startup_team_members']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['startup_team_members']['Insert']>
      }
      startup_claim_requests: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          status: string
          notes: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['startup_claim_requests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['startup_claim_requests']['Insert']>
      }
      startup_updates: {
        Row: {
          id: string
          startup_id: string
          title: string
          body: string
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['startup_updates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['startup_updates']['Insert']>
      }
      startup_votes: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          vote_type: VoteType
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['startup_votes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['startup_votes']['Insert']>
      }
      startup_saves: {
        Row: { id: string; startup_id: string; user_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['startup_saves']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['startup_saves']['Insert']>
      }
      startup_comments: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          parent_comment_id: string | null
          body: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['startup_comments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['startup_comments']['Insert']>
      }
      startup_ratings: {
        Row: { id: string; startup_id: string; user_id: string; rating: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['startup_ratings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['startup_ratings']['Insert']>
      }
      startup_profile_would_use: {
        Row: {
          id: string
          startup_id: string
          user_id: string
          would_use: WouldUse
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['startup_profile_would_use']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['startup_profile_would_use']['Insert']>
      }
      research_requests: {
        Row: {
          id: string
          startup_id: string
          title: string
          prompt: string | null
          is_active: boolean
          created_by: string
          created_at: string
          ends_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['research_requests']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['research_requests']['Insert']>
      }
      research_responses: {
        Row: {
          id: string
          research_request_id: string
          startup_id: string
          user_id: string
          would_use: WouldUse
          clarity_score: number
          usability_score: number
          scalability_score: number
          value_clarity_score: number
          desirability_score: number
          trust_score: number
          problem_understanding: string | null
          missing_features: string | null
          friction_points: string | null
          target_user_guess: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['research_responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['research_responses']['Insert']>
      }
      research_demographics: {
        Row: {
          id: string
          user_id: string
          age_range: string
          gender: string | null
          country: string
          profession: string
          industry: string
          persona_type: string
          technical_level: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['research_demographics']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['research_demographics']['Insert']>
      }
      promotions: {
        Row: {
          id: string
          startup_id: string
          promotion_type: string
          status: string
          starts_at: string
          ends_at: string
          created_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['promotions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['promotions']['Insert']>
      }
      reports: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          reported_by: string
          reason: string
          details: string | null
          status: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reports']['Insert']>
      }
    }
    Views: {
      startup_spark_score_metrics: {
        Row: {
          startup_id: string
          support_count: number
          save_count: number
          avg_rating: number | null
          total_comments: number
          total_research_responses: number
          would_use_yes: number
          would_use_maybe: number
          would_use_no: number
          would_use_pct: number
          activity_7d: number
          trending_score: number
          spark_score: number
        }
      }
      startup_demographic_summary: {
        Row: {
          startup_id: string
          age_range: string | null
          profession: string | null
          persona_type: string | null
          yes_count: number
          maybe_count: number
          no_count: number
          total: number
        }
      }
      startup_research_criteria_aggregates: {
        Row: {
          startup_id: string
          response_count: number
          avg_usability: number | null
          avg_scalability: number | null
          avg_value_clarity: number | null
          avg_desirability: number | null
          avg_trust: number | null
          avg_clarity_legacy: number | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type StartupRow = Database['public']['Tables']['startups']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type CategoryRow = Database['public']['Tables']['startup_categories']['Row']
export type StageRow = Database['public']['Tables']['startup_stages']['Row']
export type CommentRow = Database['public']['Tables']['startup_comments']['Row']
export type VoteRow = Database['public']['Tables']['startup_votes']['Row']
export type SaveRow = Database['public']['Tables']['startup_saves']['Row']
export type RatingRow = Database['public']['Tables']['startup_ratings']['Row']
export type ResearchRequestRow = Database['public']['Tables']['research_requests']['Row']
export type ResearchResponseRow = Database['public']['Tables']['research_responses']['Row']
export type SignalMetrics = Database['public']['Views']['startup_spark_score_metrics']['Row']
