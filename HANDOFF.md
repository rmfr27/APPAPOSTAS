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

Todos os 7 ecrãs do handoff estão feitos. #4–#8 foram todos criados a partir do mesmo commit de `main` (em paralelo, não empilhados), por isso o merge de cada um a seguir ao anterior exigiu rebase + resolver conflitos em `App.jsx` (e `predictions.js` entre #5/#6) — nada de grave, só imports/`switch` a combinar, exceto um ponto real descrito abaixo.

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
npm run dev      # servidor de desenvolvimento (vite)
npm run lint     # oxlint
npm run build    # build de produção
```

Nó/npm instalados via winget nesta máquina (`OpenJS.NodeJS.LTS`). GitHub CLI também via winget (`GitHub.cli`).

## Preferências do utilizador (Ruben)
- Quer aprender o fluxo de PRs — confirma sempre antes de `git push` / `gh pr create` / merge (não fazer automaticamente).
- Prefere branches pequenas e PRs revisáveis, não tudo de uma vez.
- Testa sempre no browser antes de dar como terminado (não só lint/build).
