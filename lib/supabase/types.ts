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
          pousada_id: string | null
          unidades: Json
          total_unidades: number
          total_itens: number
          total_pessoas: number
          status: string
          motivo_cancelamento: string | null
          cancelado_at: string | null
          updated_at: string
          atualizado_por: string | null
          data_pedido: string
          feedback_token: string
        }
        Insert: {
          id?: number
          created_at?: string
          titulo?: string
          saudacao: string
          pousada: string
          pousada_id?: string | null
          unidades: Json
          total_unidades: number
          total_itens: number
          total_pessoas: number
          status?: string
          motivo_cancelamento?: string | null
          cancelado_at?: string | null
          updated_at?: string
          atualizado_por?: string | null
          data_pedido?: string
          feedback_token?: string
        }
        Update: Partial<Database["public"]["Tables"]["pedidos"]["Insert"]>
        Relationships: []
      }
      pedidos_log: {
        Row: {
          id: number
          pedido_id: number
          pousada_id: string | null
          acao: string
          motivo: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          criado_por: string | null
          created_at: string
        }
        Insert: {
          id?: number
          pedido_id: number
          pousada_id?: string | null
          acao: string
          motivo?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          criado_por?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["pedidos_log"]["Insert"]>
        Relationships: []
      }
      pousadas: {
        Row: {
          id: string
          slug: string
          nome: string
          usuario: string
          subtitulo: string
          horarios: Json
          unidades: Json
          auth_user_id: string | null
          ativa: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nome: string
          usuario: string
          subtitulo?: string
          horarios?: Json
          unidades?: Json
          auth_user_id?: string | null
          ativa?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["pousadas"]["Insert"]>
        Relationships: []
      }
      user_roles: {
        Row: { id: string; user_id: string; role: string; created_at: string }
        Insert: { id?: string; user_id: string; role: string; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>
        Relationships: []
      }
      feedbacks: {
        Row: { id: number; pedido_id: number | null; nota: number; comentario: string | null; created_at: string }
        Insert: { id?: number; pedido_id?: number | null; nota: number; comentario?: string | null; created_at?: string }
        Update: Partial<Database["public"]["Tables"]["feedbacks"]["Insert"]>
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
    Functions: {
      criar_pousada: {
        Args: {
          _slug: string
          _nome: string
          _usuario: string
          _senha: string
          _subtitulo: string
          _horarios: Json
          _unidades: Json
        }
        Returns: string
      }
      redefinir_senha_pousada: {
        Args: { _pousada_id: string; _nova_senha: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
