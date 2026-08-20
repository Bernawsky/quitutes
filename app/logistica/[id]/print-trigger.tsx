"use client"

import { useEffect } from "react"

// Reproduz a etapa de "impressão automática" do fluxo antigo: assim que a folha
// de logística abre, o diálogo de impressão do navegador já é disparado.
export function PrintTrigger() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [])
  return null
}
