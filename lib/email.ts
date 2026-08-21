import { createAdminSupabaseClient } from "@/lib/supabase/admin"

type EnvioResultado = { enviado: boolean; motivo?: string }

/**
 * Envia e-mail via Resend (https://resend.com). Requer RESEND_API_KEY e RESEND_FROM_EMAIL
 * configurados no ambiente; sem eles, retorna enviado:false sem lançar erro (a funcionalidade
 * fica "desligada" até serem configurados, em vez de quebrar o app).
 */
export async function enviarEmail(input: { to: string[]; subject: string; html: string }): Promise<EnvioResultado> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return { enviado: false, motivo: "RESEND_API_KEY ou RESEND_FROM_EMAIL não configurada" }
  }
  if (input.to.length === 0) {
    return { enviado: false, motivo: "Nenhum destinatário" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
  })

  if (!res.ok) {
    const corpo = await res.text().catch(() => "")
    return { enviado: false, motivo: `Falha no envio (${res.status}): ${corpo}` }
  }
  return { enviado: true }
}

/** E-mails de todos os administradores atuais (via service role, ignora RLS). */
export async function emailsDosAdmins(): Promise<string[]> {
  const admin = createAdminSupabaseClient()
  const { data: papeis } = await admin.from("user_roles").select("user_id").eq("role", "admin")
  const emails: string[] = []
  for (const p of papeis ?? []) {
    const { data } = await admin.auth.admin.getUserById(p.user_id)
    if (data.user?.email) emails.push(data.user.email)
  }
  return emails
}
