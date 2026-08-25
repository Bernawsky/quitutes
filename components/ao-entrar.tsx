"use client"

import { useEmVista } from "@/hooks/use-em-vista"
import { cn } from "@/lib/utils"

/** Revela o conteúdo com um leve fade + subida ao entrar na tela. Discreto, sem custo de performance perceptível. */
export function AoEntrar({ children, className, atraso = 0 }: { children: React.ReactNode; className?: string; atraso?: number }) {
  const { ref, visivel } = useEmVista<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-500 ease-out motion-reduce:transition-none", visivel ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0", className)}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}
