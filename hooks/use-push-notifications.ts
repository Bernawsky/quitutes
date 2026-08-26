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

/**
 * Notificações push do navegador (Web Push) — funcionam em Chrome, Edge, Firefox
 * e Safari (macOS 16+ e iOS/iPadOS 16.4+, este último só com o site instalado
 * na tela de início). Requer NEXT_PUBLIC_VAPID_PUBLIC_KEY configurada.
 */
export function usePushNotifications() {
  const [estado, setEstado] = useState<EstadoPush>("inativo")
  const [carregando, setCarregando] = useState(false)
  const [iosNaoInstalado] = useState(detectarIosNaoInstalado)

  useEffect(() => {
    void (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        setEstado("indisponivel")
        return
      }
      if (Notification.permission === "denied") {
        setEstado("negado")
        return
      }
      try {
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
      const permissao = await Notification.requestPermission()
      if (permissao !== "granted") {
        setEstado("negado")
        return false
      }
      const registro = await navigator.serviceWorker.register("/sw.js")
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: paraUint8Array(chavePublica),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscricao.toJSON()),
      })
      setEstado("ativo")
      return true
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

  return { estado, carregando, ativar, desativar, iosNaoInstalado }
}
