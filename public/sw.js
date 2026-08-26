self.addEventListener("push", (event) => {
  let dados = {}
  try {
    dados = event.data ? event.data.json() : {}
  } catch {
    dados = {}
  }

  const titulo = dados.title || "Quitutes"
  const opcoes = {
    body: dados.body || "",
    icon: "/apple-icon.png",
    badge: "/icon-light-32x32.png",
    data: { url: dados.url || "/" },
  }

  event.waitUntil(self.registration.showNotification(titulo, opcoes))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes(url) && "focus" in cliente) return cliente.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    }),
  )
})
