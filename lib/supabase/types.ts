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
      users: {
        Row: {
          id: string
          fid: number | null
          username: string | null
          wallet_address: string | null
          total_points: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          fid?: number | null
          username?: string | null
          wallet_address?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          fid?: number | null
          username?: string | null
          wallet_address?: string | null
          total_points?: number
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          description: string
          contract_address: string | null
          icon: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          contract_address?: string | null
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          contract_address?: string | null
          icon?: string
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          mode: 'free' | 'onchain'
          result: 'win' | 'lose' | 'draw' | 'push'
          points_earned: number
          tx_hash: string | null
          played_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          mode: 'free' | 'onchain'
          result: 'win' | 'lose' | 'draw' | 'push'
          points_earned: number
          tx_hash?: string | null
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          mode?: 'free' | 'onchain'
          result?: 'win' | 'lose' | 'draw' | 'push'
          points_earned?: number
          tx_hash?: string | null
          played_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: string
          requirement: Json
          points: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          icon: string
          category: string
          requirement: Json
          points: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: string
          requirement?: Json
          points?: number
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          username: string | null
          fid: number | null
          total_points: number
          games_played: number
          wins: number
          rank: number
        }
      }
    }
    Functions: {
      get_game_leaderboard: {
        Args: {
          p_game_id: string
          p_limit: number
        }
        Returns: Array<{
          user_id: string
          username: string | null
          fid: number | null
          game_points: number
          games_played: number
          wins: number
          rank: number
        }>
      }
    }
  }
}
