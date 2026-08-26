/**
 * Next.js substitui o openGraph inteiro quando uma página declara o seu (não faz merge
 * profundo com o do layout raiz) — por isso cada página com openGraph próprio precisa
 * repetir a imagem padrão explicitamente.
 */
export const IMAGEM_OG = [{ url: "/og-image.png", width: 1200, height: 630, alt: "Quitutes — Pedidos de Café da Manhã" }]
