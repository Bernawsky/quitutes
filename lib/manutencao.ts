/**
 * Modo manutenção: só a ferramenta de produção (/producao) fica disponível — o resto do site
 * (pedidos das pousadas, métricas, leitor, vouchers, entregas) fica fora do ar. Usado tanto no
 * middleware (bloqueia a navegação pra essas rotas) quanto no portal de pedidos (a tela de
 * login "/" não navega pra outra rota quando uma pousada loga — sem isso ela continuaria vendo
 * o app de pedidos normalmente, sem passar pelo middleware).
 *
 * Pra voltar ao normal, é só trocar pra false (ou apagar este arquivo e as referências a ele).
 */
export const SOMENTE_PRODUCAO = true
