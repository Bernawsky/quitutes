import webpush from "web-push"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

let configurado = false

function garantirConfigurado() {
  if (configurado) return
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configurado = true
}

/**
 * Envia uma notificação push para todos os dispositivos inscritos de admins e
 * da equipe (papel "operador" — Cozinha e Cafeteria). Melhor esforço: uma
 * inscrição expirada/inválida (404/410) é removida silenciosamente; falhas
 * pontuais não interrompem o envio para os demais dispositivos.
 */
export async function enviarPushEquipe(payload: { titulo: string; corpo: string; url?: string }) {
  garantirConfigurado()
  if (!configurado) return

  const admin = createAdminSupabaseClient()
  const { data: papeis } = await admin.from("user_roles").select("user_id").in("role", ["admin", "operador"])
  const userIds = (papeis ?? []).map((p) => p.user_id)
  if (userIds.length === 0) return

  const { data: inscricoes } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").in("user_id", userIds)
  if (!inscricoes || inscricoes.length === 0) return

  const corpoNotificacao = JSON.stringify({ title: payload.titulo, body: payload.corpo, url: payload.url ?? "/" })

  await Promise.all(
    inscricoes.map(async (inscricao) => {
      try {
        await webpush.sendNotification(
          { endpoint: inscricao.endpoint, keys: { p256dh: inscricao.p256dh, auth: inscricao.auth } },
          corpoNotificacao,
        )
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", inscricao.endpoint)
        }
      }
    }),
  )
}
