export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      raw_prospect_candidates: {
        Row: {
          id: string
          user_id: string
          source_type: string
          raw_content: Json
          file_path: string | null
          processing_status: string
          error_message: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          source_type: string
          raw_content?: Json
          file_path?: string | null
          processing_status?: string
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          source_type?: string
          raw_content?: Json
          file_path?: string | null
          processing_status?: string
          error_message?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      prospects: {
        Row: {
          id: string
          user_id: string
          full_name: string
          username: string | null
          platform: string | null
          profile_link: string | null
          profile_image_url: string | null
          bio_text: string | null
          location: string | null
          occupation: string | null
          is_unlocked: boolean
          unlocked_at: string | null
          last_seen_activity_at: string | null
          avatar_seed: string | null
          social_image_url: string | null
          uploaded_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          username?: string | null
          platform?: string | null
          profile_link?: string | null
          profile_image_url?: string | null
          bio_text?: string | null
          location?: string | null
          occupation?: string | null
          is_unlocked?: boolean
          unlocked_at?: string | null
          last_seen_activity_at?: string | null
          avatar_seed?: string | null
          social_image_url?: string | null
          uploaded_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          username?: string | null
          platform?: string | null
          profile_link?: string | null
          profile_image_url?: string | null
          bio_text?: string | null
          location?: string | null
          occupation?: string | null
          is_unlocked?: boolean
          unlocked_at?: string | null
          last_seen_activity_at?: string | null
          avatar_seed?: string | null
          social_image_url?: string | null
          uploaded_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prospect_events: {
        Row: {
          id: string
          prospect_id: string
          user_id: string
          event_type: string
          event_text: string | null
          event_timestamp: string
          platform: string | null
          sentiment: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          prospect_id: string
          user_id: string
          event_type: string
          event_text?: string | null
          event_timestamp?: string
          platform?: string | null
          sentiment?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          prospect_id?: string
          user_id?: string
          event_type?: string
          event_text?: string | null
          event_timestamp?: string
          platform?: string | null
          sentiment?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      prospect_profiles: {
        Row: {
          prospect_id: string
          sentiment_avg: number
          dominant_topics: string[]
          interests: string[]
          pain_points: string[]
          life_events: string[]
          personality_traits: Json
          engagement_frequency: number
          responsiveness_score: number
          last_updated_at: string
        }
        Insert: {
          prospect_id: string
          sentiment_avg?: number
          dominant_topics?: string[]
          interests?: string[]
          pain_points?: string[]
          life_events?: string[]
          personality_traits?: Json
          engagement_frequency?: number
          responsiveness_score?: number
          last_updated_at?: string
        }
        Update: {
          prospect_id?: string
          sentiment_avg?: number
          dominant_topics?: string[]
          interests?: string[]
          pain_points?: string[]
          life_events?: string[]
          personality_traits?: Json
          engagement_frequency?: number
          responsiveness_score?: number
          last_updated_at?: string
        }
      }
      prospect_scores: {
        Row: {
          id: string
          prospect_id: string
          scout_score: number
          bucket: string
          explanation_tags: string[]
          engagement_score: number
          business_interest_score: number
          pain_point_score: number
          life_event_score: number
          responsiveness_likelihood: number
          mlm_leadership_potential: number
          last_calculated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          prospect_id: string
          scout_score?: number
          bucket: string
          explanation_tags?: string[]
          engagement_score?: number
          business_interest_score?: number
          pain_point_score?: number
          life_event_score?: number
          responsiveness_likelihood?: number
          mlm_leadership_potential?: number
          last_calculated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          prospect_id?: string
          scout_score?: number
          bucket?: string
          explanation_tags?: string[]
          engagement_score?: number
          business_interest_score?: number
          pain_point_score?: number
          life_event_score?: number
          responsiveness_likelihood?: number
          mlm_leadership_potential?: number
          last_calculated_at?: string
          created_at?: string
        }
      }
      ai_generations: {
        Row: {
          id: string
          user_id: string
          prospect_id: string | null
          generation_type: string
          input_data: Json
          prompt_hash: string
          output_text: string | null
          output_data: Json
          model_used: string
          tokens_used: number
          cost_usd: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prospect_id?: string | null
          generation_type: string
          input_data?: Json
          prompt_hash: string
          output_text?: string | null
          output_data?: Json
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prospect_id?: string | null
          generation_type?: string
          input_data?: Json
          prompt_hash?: string
          output_text?: string | null
          output_data?: Json
          model_used?: string
          tokens_used?: number
          cost_usd?: number
          created_at?: string
          expires_at?: string
        }
      }
      scanning_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          source_type: string
          processing_status: string
          prospects_found: number
          prospects_new: number
          prospects_updated: number
          hot_count: number
          warm_count: number
          cold_count: number
          processing_time_ms: number | null
          error_message: string | null
          started_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type: string
          source_type: string
          processing_status?: string
          prospects_found?: number
          prospects_new?: number
          prospects_updated?: number
          hot_count?: number
          warm_count?: number
          cold_count?: number
          processing_time_ms?: number | null
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          source_type?: string
          processing_status?: string
          prospects_found?: number
          prospects_new?: number
          prospects_updated?: number
          hot_count?: number
          warm_count?: number
          cold_count?: number
          processing_time_ms?: number | null
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: string
          coin_balance: number
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {}
    Functions: {
      calculate_scout_score: {
        Args: {
          p_engagement: number
          p_business_interest: number
          p_pain_point: number
          p_life_event: number
          p_responsiveness: number
          p_mlm_leadership: number
        }
        Returns: number
      }
      get_score_bucket: {
        Args: {
          p_score: number
        }
        Returns: string
      }
    }
    Enums: {}
  }
}
