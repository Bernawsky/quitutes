export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      pedidos: {
        Row: {
          id: number
          created_at: string
          titulo: string
          saudacao: string
          pousada: string
          unidades: Json
          total_unidades: number
          total_itens: number
          total_pessoas: number
          status: string
          motivo_cancelamento: string | null
          cancelado_at: string | null
          updated_at: string
          atualizado_por: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          titulo?: string
          saudacao: string
          pousada: string
          unidades: Json
          total_unidades: number
          total_itens: number
          total_pessoas: number
          status?: string
          motivo_cancelamento?: string | null
          cancelado_at?: string | null
          updated_at?: string
          atualizado_por?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["pedidos"]["Insert"]>
        Relationships: []
      }
      user_roles: {
        Row: { id: string; user_id: string; role: string; created_at: string }
        Insert: { id?: string; user_id: string; role: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>
        Relationships: []
      }
      metricas_exportadas: {
        Row: {
          id: number
          origem: string | null
          gerado_em: string | null
          arquivo: string | null
          periodo: string | null
          rotulo_periodo: string | null
          total_pedidos: number | null
          ranking: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          origem?: string | null
          gerado_em?: string | null
          arquivo?: string | null
          periodo?: string | null
          rotulo_periodo?: string | null
          total_pedidos?: number | null
          ranking?: Json | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["metricas_exportadas"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
