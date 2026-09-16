"use client"

import { useCallback, useEffect, useState } from "react"

function paraUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalizada = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const bruto = atob(normalizada)
  return Uint8Array.from([...bruto].map((c) => c.charCodeAt(0)))
}

export type EstadoPush = "indisponivel" | "negado" | "inativo" | "ativo"

function detectarIosNaoInstalado(): boolean {
  if (typeof navigator === "undefined") return false
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  if (!ios) return false
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  return !standalone
}

async function inscrever(chavePublica: string): Promise<boolean> {
  const registro = await navigator.serviceWorker.register("/sw.js")
  // pushManager.subscribe() é idempotente com a mesma applicationServerKey — se já existir uma
  // inscrição válida, devolve ela mesma em vez de duplicar. Reenviar pro servidor sempre (upsert
  // por endpoint) garante que o navegador e o banco nunca fiquem dessincronizados.
  const inscricao = await registro.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: paraUint8Array(chavePublica),
  })
  const resposta = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inscricao.toJSON()),
  })
  return resposta.ok
}

/**
 * Notificações push do navegador (Web Push) — funcionam em Chrome, Edge, Firefox
 * e Safari (macOS 16+ e iOS/iPadOS 16.4+, este último só com o site instalado
 * na tela de início). Requer NEXT_PUBLIC_VAPID_PUBLIC_KEY configurada.
 *
 * O estado não depende só de `pushManager.getSubscription()`: o navegador pode derrubar essa
 * inscrição silenciosamente (troca de Service Worker, limpeza do sistema, etc.) mesmo com a
 * permissão do usuário continuando "granted" — nesse caso a UI antiga mostrava "inativo" sem
 * avisar que algo mudou, e o usuário achava que "ativar notificações só funciona na hora". Por
 * isso, sempre que a permissão do navegador já está concedida, o hook tenta re-inscrever
 * silenciosamente (idempotente) pra manter o navegador e a linha em `push_subscriptions`
 * sincronizados sem exigir um clique manual em "Ativar" de novo.
 */
export function usePushNotifications() {
  const [estado, setEstado] = useState<EstadoPush>("inativo")
  const [permissao, setPermissao] = useState<NotificationPermission | "indisponivel">("default")
  const [carregando, setCarregando] = useState(false)
  const [iosNaoInstalado] = useState(detectarIosNaoInstalado)

  useEffect(() => {
    void (async () => {
      const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !chavePublica) {
        setPermissao("indisponivel")
        setEstado("indisponivel")
        return
      }
      setPermissao(Notification.permission)
      if (Notification.permission === "denied") {
        setEstado("negado")
        return
      }
      try {
        if (Notification.permission === "granted") {
          const ok = await inscrever(chavePublica)
          setEstado(ok ? "ativo" : "inativo")
          return
        }
        const registro = await navigator.serviceWorker.register("/sw.js")
        const inscricao = await registro.pushManager.getSubscription()
        setEstado(inscricao ? "ativo" : "inativo")
      } catch {
        setEstado("indisponivel")
      }
    })()
  }, [])

  const ativar = useCallback(async () => {
    const chavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!chavePublica) {
      setEstado("indisponivel")
      return false
    }
    setCarregando(true)
    try {
      const permissaoConcedida = await Notification.requestPermission()
      setPermissao(permissaoConcedida)
      if (permissaoConcedida !== "granted") {
        setEstado("negado")
        return false
      }
      const ok = await inscrever(chavePublica)
      setEstado(ok ? "ativo" : "inativo")
      return ok
    } finally {
      setCarregando(false)
    }
  }, [])

  const desativar = useCallback(async () => {
    setCarregando(true)
    try {
      const registro = await navigator.serviceWorker.getRegistration()
      const inscricao = await registro?.pushManager.getSubscription()
      if (inscricao) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: inscricao.endpoint }),
        })
        await inscricao.unsubscribe()
      }
      setEstado("inativo")
    } finally {
      setCarregando(false)
    }
  }, [])

  return { estado, permissao, carregando, ativar, desativar, iosNaoInstalado }
}
