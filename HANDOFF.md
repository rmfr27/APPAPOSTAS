# Handoff — OddScout (contexto de sessão)

Nota de contexto para continuar este projeto numa sessão nova (ex: Claude Code no VS Code). Não é documentação do produto — é um resumo do que já foi decidido e feito, para não teres de repetir tudo.

## O que é este projeto
App de comparação de odds desportivas em Portugal ("OddScout"), a ser recriada em React a partir de um design handoff (`OddScout.dc.html` + `README.md` na raiz deste repo — lê o `README.md` primeiro, é a spec completa: ecrãs, tokens de design, modelo de dados, regras de negócio).

Stack escolhida: **React web (Vite)**, não React Native.

## Repositório GitHub
`https://github.com/rmfr27/APPAPOSTAS` — autenticado via `gh` CLI (já instalado e logado como `rmfr27`).

Fluxo de trabalho usado até agora: uma branch por funcionalidade, PR pequeno e revisável, merge antes de começar a próxima branch. Segue esse padrão.

PRs já mesclados (todos por squash):
- **#1** — `.gitignore`
- **#2** — scaffold do projeto React + ecrã Início (Home)
- **#3** — ecrãs Eventos + Detalhe, navegação com stack
- **#4** — integração com odds reais (The Odds API)
- **#5** — ecrã Explorar
- **#6** — ecrã Combos
- **#7** — ecrã Favoritos
- **#8** — ecrã Perfil
- **#9** — logo/favicon da app
- **#10** — Combos: mostrar probabilidade de vitória por perna e combinada
- **#11** — Combos: remover pernas individuais de um combinado gerado
- **#12** — Combos: permitir escolher apostas manualmente de Seguras/Valor para o combinado
- **#13** — redeploy agendado para as odds não ficarem stale entre pushes (ver secção "Manter os dados frescos" abaixo)
- **#14** — fix de produção: descartar eventos sem odds ainda
- **#15** — Combos: threshold de Apostas Seguras 60%→80%, escolhe a melhor odd acima do threshold
- **#16** — descoberta dinâmica de todos os desportos ativos (era só EPL/La Liga/NBA/ténis)
- **#17** — análise IA de lesões/táticas/forma recente via Claude + pesquisa web

Todos os 7 ecrãs do handoff estão feitos. #4–#8 foram todos criados a partir do mesmo commit de `main` (em paralelo, não empilhados), por isso o merge de cada um a seguir ao anterior exigiu rebase + resolver conflitos em `App.jsx` (e `predictions.js` entre #5/#6) — nada de grave, só imports/`switch` a combinar, exceto um ponto real descrito abaixo. Mesma situação entre #15–#17: partiram todos do mesmo commit, #15 mesclou limpo (ficheiros diferentes), #17 precisou de rebase para resolver as duas secções novas do `HANDOFF.md` (#16 e #17) que caíam no mesmo sítio do ficheiro.

**Decisão tomada ao mesclar #8 (Perfil) por cima de #4 (odds reais)**: o #8 tinha `preferredBooks` a arrancar como `useState(BOOKMAKERS)` (as 5 casas PT). Isso participava mal com o #4, que já tinha decidido mostrar bookmakers internacionais reais — se o default fosse a lista fixa PT, a tabela de odds de **todo** evento real ficava vazia por defeito (interseção de PT-5 com bookmakers reais = sempre nada), escondendo a funcionalidade toda sem o utilizador tocar em nada. Resolvido para `useState(null)` (`null` = sem restrição, mostra tudo — já era o contrato que `Detalhe.jsx` esperava desde o #4). `Perfil.jsx` trata `null` como "as 5 casas PT aparecem todas ligadas"; o primeiro toggle que o utilizador fizer converte isso numa lista real (`toggleBook` em `App.jsx` expande a partir de `BOOKMAKERS` nesse momento). Testado no browser com dados reais e mock depois da resolução — funciona nos dois casos.

## Estado do código
- `src/App.jsx` — shell de navegação: `nav` (screen + params) + `history` stack. `navigate(screen, params)` empurra, `goBack()` remove, `setTab(tabId)` reseta o stack. Tab bar sempre visível no fundo.
- `src/screens/Home.jsx` — **feito**. Chips de desporto, "Destaques de valor" (apostas de valor, edge ≥5pp), "Próximos eventos".
- `src/screens/Eventos.jsx` — **feito**. Lista de eventos por desporto.
- `src/screens/Detalhe.jsx` — **feito**. Previsão IA, aposta recomendada, separadores de mercado, tabela de odds comparativa (colunas derivadas dinamicamente das casas que o mercado ativo realmente tem — ver secção de odds reais), favoritar.
- `src/screens/Explorar.jsx`, `Combos.jsx`, `Favoritos.jsx`, `Perfil.jsx` — **feitos**. `src/screens/Placeholder.jsx` já não é usado por nenhum separador (pode ser removido num cleanup futuro, mas não estorva).
- `src/lib/predictions.js` — toda a lógica de cálculo: `edge`, `bestOdd`, `bestOddMainMarket` (odd "simples" do mercado principal, usada nas listas) vs `bestEdgeForEvent` (a melhor aposta de valor entre TODOS os mercados, usada nos cards de destaque e no card "Aposta recomendada"). Estas duas são propositadamente diferentes — não as confundir. Também: `searchEvents`, `getRankedPredictions` (Explorar), `bestSafeBet`/`getSafeBets`/`getValueBets`/`generateCombo` (Combos).
- `src/data/events.js` — `events` carrega `src/data/live_events.json` (gerado por `npm run fetch:odds`, gitignored) quando existe e não está vazio; cai para os dados mock caso contrário. Os dados mock continuam com 2 mercados por evento, **ilustrativos**, não reais.
- `src/components/CornerCard.jsx` — o card com as marcas de canto ("+") do motivo "blueprint" do design. Aceita `onClick` (torna-se clicável/focável automaticamente).
- `src/components/TabBar.jsx`, `BackButton.jsx` — reutilizáveis.
- Tokens de design (cores, fontes) estão em `src/index.css` como CSS custom properties — usa-os em vez de hardcodar cores novas.

## Integração com odds reais (feito, mesclado no #4)
- `src/services/oddsApi.js` — chama [The Odds API](https://the-odds-api.com) e normaliza a resposta para o formato do projeto (`{id, sport, competition, teamA, teamB, date, markets: [{name, outcomes: [{label, predProb, odds}]}]}`). Traduz nomes de mercado (`h2h`→"Resultado Final", `totals`→"Total de Pontos", `spreads`→"Handicap"; qualquer outra chave, ex. `h2h_lay` da Betfair Exchange, é ignorada) e de outcome (equipa da casa/fora→"Casa"/"Fora", `Draw`→"Empate", `Over`/`Under`→"Mais"/"Menos X.X").
- `predProb` é calculado por **devig do consenso do mercado** (média das probabilidades implícitas de todos os bookmakers do outcome, normalizada a somar 100% por mercado) — decisão tomada com o Ruben em 2026-08-04.
- `scripts/fetchOdds.js` — corre com `npm run fetch:odds`, lê `ODDS_API_KEY` de `.env` (via `process.loadEnvFile`, nativo do Node — sem dependência `dotenv`), busca `soccer_epl`, `soccer_spain_la_liga`, `basketball_nba` e resolve os torneios de ténis ativos dinamicamente via `fetchActiveTennisKeys()` (a API não tem uma chave fixa "circuito ATP" — cada torneio tem a sua própria chave, ex. `tennis_atp_canadian_open`, que muda semana a semana). Escreve `src/data/live_events.json` (gitignored, gerado localmente).
- **Testado com a API real** em 2026-08-04 (o Ruben já tem `ODDS_API_KEY`) — 79 eventos reais (30 futebol, 49 ténis; NBA deu 0 por estar fora de época, comportamento esperado).
- **Descoberta importante**: a região `eu` da The Odds API **não cobre nenhuma das 5 casas licenciadas em PT** (Bet365, Betano, Betclic PT, Placard, Solverde) — só operadores internacionais (Pinnacle, Betfair, Unibet, Winamax, etc.). Decisão tomada com o Ruben: **aceitar isso** — a app compara odds reais internacionais, não especificamente casas PT. Isto é uma mudança de proposta face ao README original ("5 bookmakers licenciados em PT"), documentada aqui para não se perder.
- **Ligado à UI**: `src/data/events.js` agora carrega `live_events.json` via `import.meta.glob` (opcional — se o ficheiro não existir, cai para os dados mock sem erro) e usa-o quando não está vazio. `App.jsx`/`Detalhe.jsx` deixaram de assumir a lista fixa de 5 casas — `Detalhe.jsx` deriva as colunas da tabela de odds a partir das casas que o mercado ativo realmente tem (ordenadas por cobertura), e mostra "—" em vez de rebentar quando uma casa não cotou uma linha específica (comum em Handicap/Total de Pontos, onde cada casa só cobre algumas linhas). `preferredBooks` continua a existir como prop (hoje `null` = mostrar tudo) para quando o ecrã Perfil existir.
- **Validado no browser** (Playwright headless, 2026-08-04): Home → Futebol → evento → Detalhe → troca de mercado, sem erros de consola. "Destaques de valor" mostra apostas de valor reais genuínas (ex. 4.90 na Coolbet, 9.00 na Tipico) — funciona porque o edge vem de comparar o consenso devig com a **melhor odd entre ~20 casas**, o que é um sinal de "price shopping" legítimo, não ruído.
- **Nomes de equipas** ainda não foram testados contra o dataset do football-data.co.uk (secção seguinte) — só relevante se as duas fontes forem cruzadas no futuro.

### Manter os dados frescos sem pushes manuais (2026-08-11)
Os dados só são buscados no **build** (`vercel-build` = `npm run fetch:odds && vite build`) — sem um push novo, o site fica com odds cada vez mais velhas (reparámos nisto quando o site mostrou um evento de um torneio de ténis já terminado, uma semana sem deploys).

Resolvido com um redeploy agendado, não com fetch em runtime (a app continua estática, sem backend):
- **Deploy hook** criado no Vercel (`odds-refresh`, branch `main`) — um URL que, quando recebe um POST, dispara um build novo.
- **`.github/workflows/refresh-odds.yml`** — GitHub Action agendada (`cron: '13 */12 * * *'`, 2×/dia) que faz `curl -X POST` a esse hook. O URL está guardado como secret do repo (`VERCEL_DEPLOY_HOOK_URL`), não no código.
- **Porquê 2×/dia e não mais**: o free tier da The Odds API dá 500 pedidos/mês. Cada build gasta ~3-6 pedidos (EPL, La Liga, NBA + torneios de ténis ativos nesse momento — `/v4/sports` para listar torneios não conta para a quota). A 2×/dia = ~60 builds/mês = ~360 pedidos, com folga para deploys manuais/PRs. A 4×/dia já ultrapassava a quota. Se quiseres mais frequência, ou aumentas o intervalo do cron ou precisas de um plano pago da API.
- **Atualizado em 2026-08-12**: o Ruben fez upgrade a um plano pago da The Odds API, especificamente para suportar a expansão de desportos abaixo — o free tier estourou a quota em minutos assim que passámos de 4 chaves de desporto fixas para "todos".

### Alargar a todos os desportos (2026-08-12)
`scripts/fetchOdds.js` deixou de ter uma lista fixa de desportos — `fetchActiveSportKeys()` (em `oddsApi.js`) descobre todos os desportos ativos via `/v4/sports`, filtrados a uma allowlist de grupos de confronto direto (Soccer, Basketball, American Football, Ice Hockey, Baseball, Tennis, Rugby League, Rugby Union, Boxing, Mixed Martial Arts) e excluindo chaves `_winner` (torneios de vencedor único, sem mercado h2h por jogo). Testado com a chave paga: **869 eventos** reais (futebol 488, futebol americano 133, ténis 66, MMA 48, basebol 36, boxe 42, basquetebol 20, hóquei 20, rugby 16).

**Descoberta importante**: o pedido original também tentava juntar mercados de 1ª/2ª parte e Ambas Marcam (`h2h_h1`, `h2h_h2`, `totals_h1`, `totals_h2`, `btts`) ao pedido de odds em lote (`/v4/sports/{sport}/odds`) para o futebol. **Isso não é suportado neste endpoint** — devolve 422 `INVALID_MARKET` e faz o pedido inteiro falhar (não só os mercados extra; **nenhum** dado volta). Ficou revertido — o futebol continua só com Resultado Final / Total de Pontos / Handicap. Para ter esses mercados extra seria preciso o endpoint de odds por evento (`/v4/sports/{sport}/events/{id}/odds`), um pedido por evento — mais caro/lento, não feito por agora.

**Efeito colateral a monitorizar**: `src/data/events.js` importa `live_events.json` estaticamente (`import.meta.glob(..., { eager: true })`), por isso os 869 eventos ficam todos embutidos no bundle JS — o `vite build` já avisa que o chunk passou de ~67KB para ~353KB gzip. Não é um erro, mas se a cobertura continuar a crescer vale a pena mudar para fetch em runtime ou lazy-loading em vez de import estático.

## Análise IA de lesões/táticas/forma recente (2026-08-12, DESATIVADA no build em 2026-08-13)
Pedido do Ruben: além do consenso de mercado (devig), ter em conta lesões, alterações táticas e forma recente na análise de cada jogo. A app não tem nenhuma fonte de dados para isto — resolvido com um LLM (Claude, `claude-sonnet-5`) com a ferramenta de pesquisa web, corrido no momento do build, um pedido por evento.

**⚠️ Desativada em produção (2026-08-13)** — `vercel-build` voltou a ser só `fetch:odds && vite build`, sem o passo `analyze:events`. O código (`scripts/analyzeEvents.js`, `npm run analyze:events`, o card "Análise" em `Detalhe.jsx`) continua todo no repo, só não corre automaticamente. Motivo: o primeiro build real em produção (872 eventos, 40 elegíveis) **demorou ~10 minutos só nesta etapa e esgotou por completo os $5 de créditos Anthropic** que o Ruben tinha comprado — muito acima da estimativa original (ver abaixo). Antes de reativar, é preciso decidir com o Ruben um orçamento diário/por-build e dimensionar `WINDOW_DAYS`/`MAX_EVENTS`/`max_uses` do `web_search`/modelo em função disso — não voltar a ligar isto sem essa conversa primeiro.

- **`scripts/analyzeEvents.js`** — corre depois do `fetch:odds`. Lê `src/data/live_events.json`, e para cada evento elegível faz **um único pedido não-streaming** a `client.messages.create` com duas ferramentas: `web_search_20260209` (server-side, a API resolve as pesquisas sozinha) e uma ferramenta custom `submit_analysis` que força uma resposta estruturada (resumo em PT-PT + `leaning` + `confidence_adjustment_pp`). Quando o Claude chama `submit_analysis`, a resposta pára com `tool_use` e o `input` já vem parseado — não é preciso loop de agente nem enviar `tool_result` de volta.
- **Elegibilidade**: só eventos que começam nos próximos 3 dias (`WINDOW_DAYS`), até 40 por build (`MAX_EVENTS`), 4 pedidos em paralelo (`CONCURRENCY`). Estas constantes precisam de ser bem mais baixas antes de isto voltar a correr em produção — ver custo real abaixo.
- **Aplicação do ajuste**: só ao mercado principal (`event.markets[0]`, a mesma convenção que `predictions.js` usa em todo o lado). `confidence_adjustment_pp` é sempre clampado a ±8pp mesmo que o modelo devolva algo fora do intervalo pedido no schema; o resto do mercado é renormalizado proporcionalmente para continuar a somar 1. `leaning: "neutro"` ou ajuste 0 → não mexe em nada.
- **Resiliência**: sem `ANTHROPIC_API_KEY` definida, o script salta tudo e não toca no ficheiro (testado). Se uma chamada individual falhar (rate limit, sem crédito, sem `submit_analysis` chamado, erro de rede), esse evento fica sem `event.analysis` e mantém o `predProb` puro do consenso — nunca fica a app num estado quebrado por causa disto (confirmado em produção: 2 dos 40 falharam por falta de crédito a meio do build, o resto do site funcionou normalmente).
- **Novo secret**: `ANTHROPIC_API_KEY`, em `.env.example` e nas Environment Variables da Vercel.
- **UI**: novo card "Análise" em `Detalhe.jsx`, a seguir a "Aposta recomendada pela IA", só aparece quando `event.analysis` existe.
- **Custo real, confirmado em produção (2026-08-13)** — a estimativa original ("poucos cêntimos por evento") estava muito errada. Num único build com 40 eventos elegíveis: **~10 minutos de duração só nesta etapa** e **os $5 de créditos Anthropic esgotaram-se antes do fim** (38/40 eventos analisados, os 2 últimos falharam com "credit balance too low"). Isto sugere um custo real bem mais alto por evento do que o previsto (pesquisa web + raciocínio a `effort: medium` não é barato) — não dá para estimar com precisão sem mais dados, mas claramente não é sustentável a 40 eventos × 2 builds/dia sem rever os parâmetros. Antes de reativar: decidir um orçamento com o Ruben, e considerar `MAX_EVENTS` bem mais baixo (~5-10), `max_uses` do `web_search` mais baixo, e/ou trocar para `claude-haiku-4-5`.
- **Testado com a API real** (2026-08-12, dados de qualidade). Dois jogos de MiLB (pouco cobertos por notícias) resultaram em `leaning: "neutro"` — o Claude pesquisou, não encontrou nada relevante, e disse-o honestamente em vez de inventar um sinal, e não mexeu nas probabilidades. Um combate de MMA com um lutador conhecido (Neil Magny) resultou num `leaning`/ajuste real e bem fundamentado (forma recente de ambos, com resultados e datas concretas, +4pp para o lado com melhor momentum) — confirma que a ferramenta `submit_analysis` é chamada de forma fiável e que a qualidade do resumo é boa quando há informação real para encontrar. Confirmado também de ponta a ponta no browser (card "Análise" com dados reais, sem erros de consola).

## Banca — tips diárias + gestão de risco (2026-08-13)
Pivot de produto: o Ruben passou a querer usar a app para apostar a sério, com gestão de risco embutida. **Falei diretamente com ele antes de construir isto**: nenhuma ferramenta consegue garantir lucro a apostar desporto, e isso está refletido na UI (nunca "garantido", frase honesta no topo do ecrã, resultados negativos mostrados sem esconder). A funcionalidade de vender tips a terceiros mais tarde ficou explicitamente fora de âmbito — tem implicações legais que precisam de conversa própria.

- **Novo ecrã "Banca"** (6º separador, `src/screens/Banca.jsx` + `.css`) — antes deste pivot a app não persistia nada entre sessões (tudo era `useState` em `App.jsx`); isto teve de mudar porque um registo de banca que se perde ao dar refresh não serve para nada.
- **`src/lib/bankroll.js`** — estado guardado em `localStorage` (`oddscout_bankroll_v1`; **só naquele browser/dispositivo, não sincroniza** — sem backend, é a única opção sensata dentro da arquitetura atual). Banca inicial + `stakePercent` (5%, decidido com o Ruben) configurados uma vez; banca atual é sempre **derivada** do histórico de tips resolvidas (nunca guardada como número solto, evita bugs de dessincronização).
- **Tips diárias (idempotente — 1 par por dia)**: nem "Segura" nem "Arriscada" reutilizam `generateCombo` diretamente — ambas têm builders próprios em `bankroll.js` porque o comportamento genérico do `generateCombo`/`getSafeBets` não dava resultados úteis para uma tip real:
  - **Segura** (`buildSafeCombo`) — `getSafeBets` ordena por probabilidade decrescente, por isso os 4 primeiros tendiam a ser quase-certezas com odd ~1.00 cada, dando uma odd combinada de **1.03** (testado, inútil como aposta real). Pedido do Ruben: a combo segura tem de ter odd combinada > 1.3. Resolvido ordenando os candidatos (já filtrados a ≥80% por `bestSafeBet`) por **odd decrescente** antes de escolher — continua só a escolher entre apostas seguras, só que prefere as menos extremas dentro desse grupo. Começa em 4 pernas; se ainda não chegar a 1.3 continua a acrescentar pernas seguras até MAX_SAFE_LEGS (10). Testado com dados reais: passou de 1.03 para 2.11 com as mesmas 4 pernas (odds ~1.20 cada em vez de ~1.00).

### Tips baseadas nos eventos do dia seguinte, não "de hoje" (2026-08-13)
O Ruben aposta ao final do dia (~23h) — nessa altura já não sobra nada útil "de hoje", por isso `generateDailyTips` passou a filtrar `events` a `event.date === targetEventDateStr()` (amanhã, UTC — não vale a pena a precisão de fuso horário de Açores para isto, a diferença é de no máximo 1h) antes de gerar as duas combos. O resto da lógica (idempotência, `stake`, `pool`) fica igual — só a fonte de eventos mudou.

**Trade-off real, descoberto em teste com dados reais**: restringir a só 1 dia reduz MUITO o conjunto de eventos candidatos (872 → 52 no dia testado), e nesse dia especificamente **zero eventos** cumpriam os critérios de Segura (≥80%) ou Valor (≥5pp) — o melhor favorito do dia era 79.4%, o melhor edge 3.6pp, ambos abaixo do threshold. Perguntei ao Ruben se preferia alargar a procura automaticamente quando amanhã vier vazio (ex. olhar 2-3 dias à frente) ou manter honesto e mostrar "sem tips" nesses dias — **escolheu manter honesto**. Ou seja: **é esperado e correto** a Banca não gerar tips em alguns dias, não é bug. Se o Ruben mudar de ideias sobre isto mais tarde, a alteração é só no filtro de `events` dentro de `generateDailyTips`.

### Botão "Gerar novas" — regenerar as tips de hoje manualmente (2026-08-13)
Descoberto logo depois do deploy anterior: o Ruben já tinha gerado as tips de hoje **antes** desta sessão de correções (odd Segura antiga ~1.03, eventos de "hoje" em vez de "amanhã"), e como `generateDailyTips` só corre uma vez por dia (idempotente), essas tips ficaram presas no `localStorage` dele com a lógica antiga — o deploy novo não as substitui sozinho, só passa a valer a partir da próxima geração (amanhã).

Adicionado `regenerateDailyTips(events, state)` em `bankroll.js` + botão "↻ Gerar novas" em `Banca.jsx`, visível só quando **todas** as tips de hoje ainda estão `pendente`. Recusa-se a correr (devolve o `state` inalterado) se alguma tip de hoje já tiver `status !== 'pendente'` — **nunca descarta um resultado já registado**, mesmo que só uma das duas tips (Segura/Arriscada) já tenha sido liquidada. Testado: com tips "stale" simuladas, o botão substitui-as corretamente pela lógica nova (incluindo o caso de dar o estado vazio honesto, quando não há eventos que cumpram os critérios); com uma tip já liquidada, o botão desaparece e o histórico mantém-se intacto.
  - **Arriscada** (`buildRiskyCombo`) — descoberto em teste: o pool "valor" pode combinar mercados finos/pouco cotados (ex. "Empate" em boxe a 33.00 numa só casa) e produzir odds totais absurdas (apanhei uma combinação de **205 milhões**). Resolvido filtrando pernas com odd > 8 antes de montar o combinado — mantém-se "arriscado" (odds totais na casa dos milhares para 7 pernas é normal e esperado) sem ser degenerado.
- **Liquidação manual** (decisão do Ruben, sem custo/API extra por agora): botões "✓ Acertei"/"✗ Falhei" por tip pendente. Stake de cada tip é calculado e gravado no momento da geração (banca-no-momento × 5%), não recalculado depois.
- Novos tokens `--negative`/`--negative-tint` (vermelho) em `src/index.css` — não existia nenhuma cor de "perda" na paleta antes disto.

### "Ajuste automático de estratégia" — o que ficou e o que não ficou (2026-08-13)
O Ruben perguntou se dava para a estratégia "se ir ajustando sozinha conforme os resultados". Resposta dada a ele: **não da forma que ele estava a imaginar** — com 2 tips/dia a amostra é pequena demais para qualquer sistema "aprender" com isso sem estar só a reagir a ruído, e um sistema que aumenta stake depois de perdas (martingale) é exatamente como se rebenta uma banca — isso não vai ser construído, ponto final, independentemente do que for pedido no futuro. O que ficou, e é seguro:
- **Staking já é % da banca** (não valor fixo) — já se ajusta sozinho por design: sobe/desce com a banca.
- **`isDrawdownActive`/`DRAWDOWN_THRESHOLD` (70%) em `bankroll.js`** — travão de segurança, não "estratégia": se a banca cair abaixo de 70% da inicial, `generateDailyTips` usa metade do `stakePercent` (`DRAWDOWN_STAKE_MULTIPLIER = 0.5`) até recuperar. Só encolhe depois de perdas, nunca aumenta. UI mostra um banner vermelho quando ativo e marca a tip com "(reduzido)".
- **`getStats(state)`** — taxa de acerto/ROI geral e por pool (`segura`/`valor`), com `lowSample: true` sempre que houver menos de `MIN_SAMPLE_SIZE` (20) tips resolvidas nesse grupo — a UI mostra um aviso de amostra pequena em vez de deixar o Ruben tirar conclusões cedo demais.
- **Lembrete mensal agendado** (rotina cloud `trig_01CAFXQRTGBXEGEen2CDU7bG`, dia 1 de cada mês às 9h UTC) — só envia uma mensagem a sugerir abrir o ecrã Banca e rever os números juntos. **Não tem acesso aos dados** (vivem no `localStorage` do browser, não em lado nenhum que uma rotina cloud consiga ler) — não analisa nada sozinho, é só o gatilho para uma sessão de revisão manual comigo.

## Exploração de Machine Learning para previsões (2026-08-04, não está no repo)
Explorado fora do repo (`scratchpad`, não commitado) para responder à pergunta "como melhorar a previsão IA com dados estatísticos": zerozero.pt não tem API e scraping arrisca violar os termos de uso deles, por isso não é boa fonte. Em vez disso:
- **Fonte de dados de treino escolhida**: [football-data.co.uk](https://www.football-data.co.uk/portugalm.php) (⚠️ nome parecido com football-data.org, mas é outro site) — CSVs grátis, sem API key, com resultados históricos + odds de ~10 bookmakers por jogo, Liga Portugal desde 1993/94. Padrão de URL: `https://www.football-data.co.uk/mmz4281/{época ex. 2425}/P1.csv`.
- **Protótipo**: Poisson independente (força de ataque/defesa por equipa) + ajuste Dixon-Coles para resultados de baixa pontuação (ρ ajustado por grid search, não MLE conjunta — simplificação documentada), com decaimento temporal (xi=0.0018/dia, ~385 dias de meia-vida) treinado em 6 épocas (2019/20–2024/25) e testado na 2025/26.
- **Resultado**: Brier score do modelo (0.5483) ficou perto do mercado devig (0.5390) — diferença de ~0.01, depois de reduzir de ~0.03 na v1 (1 época, sem Dixon-Coles). Bater o mercado de forma consistente com só histórico de golos é otimismo; o enquadramento de produto acordado é **"divergência do modelo vs. consenso do mercado"**, não "a IA acerta mais que o bookmaker".
- **Nomes de equipas não batem** entre football-data.co.uk (abreviado, ex. "Sp Lisbon") e a The Odds API / dados mock (ex. "Sporting CP") — vai ser preciso um mapa de nomes antes de juntar as duas fontes.
- **Não retomado ainda**: os scripts do protótipo (`poisson.js`, `poisson2.js`) ficaram só no scratchpad da sessão, não foram trazidos para o repo. Se for para continuar isto a sério, decidir onde vive (pasta `ml/`? serviço à parte?) antes de escrever mais código.

## O que falta
Todos os 7 ecrãs do handoff (Início, Explorar, Eventos, Detalhe, Combos, Favoritos, Perfil) estão feitos e ligados a dados reais. Ideias em aberto, nenhuma urgente:
- **Combos/Explorar/Favoritos ainda não foram testados com dados reais em profundidade** (só Home/Eventos/Detalhe tiveram esse teste explícito durante o merge de 2026-08-04) — vale confirmar visualmente antes de considerar isto 100% robusto com odds reais.
- **`src/screens/Placeholder.jsx`** ficou sem uso — remover num cleanup, se ninguém se lembrar antes.
- **Modelo de previsão real (ML)** — ver secção "Exploração de Machine Learning" acima; não retomado, fica para quando fizer sentido.
- **`tag--value` / heurística "IA"**: com dados reais, o "valor" que aparece vem de comparar o consenso do mercado com a melhor odd entre várias casas (price shopping legítimo), não de uma previsão própria — está correto assim, só a documentar para não se confundir com uma promessa de "a IA sabe mais que o mercado".

## Como correr localmente
```bash
npm install
npm run dev            # servidor de desenvolvimento (vite)
npm run lint           # oxlint
npm run build          # build de produção
npm run fetch:odds     # busca odds reais (precisa de ODDS_API_KEY no .env)
npm run analyze:events # análise IA de lesões/táticas (precisa de ANTHROPIC_API_KEY no .env; salta se não existir)
```

Nó/npm instalados via winget nesta máquina (`OpenJS.NodeJS.LTS`). GitHub CLI também via winget (`GitHub.cli`).

## Preferências do utilizador (Ruben)
- Quer aprender o fluxo de PRs — confirma sempre antes de `git push` / `gh pr create` / merge (não fazer automaticamente).
- Prefere branches pequenas e PRs revisáveis, não tudo de uma vez.
- Testa sempre no browser antes de dar como terminado (não só lint/build).
