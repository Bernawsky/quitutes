export type Tema = "light" | "dark" | "system"
export type TamanhoFonte = "pequeno" | "medio" | "grande"

export const CHAVE_TEMA = "quitutes-tema"
export const CHAVE_FONTE = "quitutes-tamanho-fonte"

/** Aplica o tema no <html> — "system" remove a classe e deixa o @media (prefers-color-scheme) do CSS decidir. */
export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement
  raiz.classList.remove("light", "dark")
  if (tema !== "system") raiz.classList.add(tema)
  try {
    localStorage.setItem(CHAVE_TEMA, tema)
  } catch {
    // Safari em modo privado pode bloquear localStorage — não é crítico, só perde o cache local.
  }
}

/** Aplica o tamanho de fonte via atributo — ver o seletor html[data-fonte] em app/globals.css. */
export function aplicarTamanhoFonte(tamanho: TamanhoFonte) {
  document.documentElement.setAttribute("data-fonte", tamanho)
  try {
    localStorage.setItem(CHAVE_FONTE, tamanho)
  } catch {
    // idem
  }
}

export function lerTemaCache(): Tema {
  try {
    const v = localStorage.getItem(CHAVE_TEMA)
    if (v === "light" || v === "dark" || v === "system") return v
  } catch {
    // ignora
  }
  return "system"
}

export function lerFonteCache(): TamanhoFonte {
  try {
    const v = localStorage.getItem(CHAVE_FONTE)
    if (v === "pequeno" || v === "medio" || v === "grande") return v
  } catch {
    // ignora
  }
  return "medio"
}
