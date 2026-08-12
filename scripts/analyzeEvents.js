import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

try {
  process.loadEnvFile(path.resolve('.env'));
} catch {
  // .env is optional — ANTHROPIC_API_KEY may already be set in the environment.
}

const DATA_FILE = path.resolve('src/data/live_events.json');
const MODEL = 'claude-sonnet-5';

// Injury/tactics news only matters close to kickoff, and every event costs a
// web-search-enabled API call — these two bound the cost/time of a build.
const WINDOW_DAYS = 3;
const MAX_EVENTS = 40;
const CONCURRENCY = 4;

const MAX_ADJUSTMENT_PP = 8;

const SYSTEM_PROMPT = `Es um analista de apostas desportivas. Para o jogo indicado, pesquisa na web lesões recentes, alterações táticas (treinador novo, mudança de esquema, jogadores suspensos) e forma recente (últimos resultados) de ambas as equipas. Depois de pesquisares o suficiente, chama SEMPRE a ferramenta submit_analysis exatamente uma vez com a tua conclusão — nunca respondas só em texto. Se não encontrares informação relevante ou nova em relação ao que as odds já refletem, indica leaning "neutro" e confidence_adjustment_pp 0. Escreve o resumo em português de Portugal, 2 a 4 frases, factual e sem especulação excessiva.`;

const SUBMIT_ANALYSIS_TOOL = {
  name: 'submit_analysis',
  description: 'Submete a conclusão da análise de lesões/táticas/forma recente para este jogo.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'Resumo em português (PT-PT), 2 a 4 frases: lesões relevantes, alterações táticas e forma recente de ambas as equipas, e como isso pode influenciar o resultado.',
      },
      leaning: {
        type: 'string',
        enum: ['casa', 'fora', 'empate', 'neutro'],
        description: 'Para que lado a análise pende, se algum. "neutro" se não houver sinal claro.',
      },
      confidence_adjustment_pp: {
        type: 'number',
        description:
          'Ajuste em pontos percentuais (entre -8 e 8) a aplicar à probabilidade do lado indicado em "leaning". 0 se "leaning" for "neutro".',
      },
    },
    required: ['summary', 'leaning', 'confidence_adjustment_pp'],
  },
};

async function analyzeEvent(client, event) {
  const userMessage = `Jogo: ${event.teamA} vs ${event.teamB}\nCompetição: ${event.competition}\nData: ${event.date}`;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium' },
    system: SYSTEM_PROMPT,
    tools: [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 4 },
      SUBMIT_ANALYSIS_TOOL,
    ],
    messages: [{ role: 'user', content: userMessage }],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use' && block.name === 'submit_analysis');
  return toolUse ? toolUse.input : null;
}

// Only the main market (event.markets[0] — same convention predictions.js
// uses everywhere else) gets adjusted. Boosts the leaning outcome by the
// clamped pp delta, then shrinks the rest proportionally so the market still
// sums to 1.
export function applyAdjustment(event, leaning, adjustmentPp) {
  const market = event.markets[0];
  if (!market) return;

  const targetLabel = { casa: 'Casa', fora: 'Fora', empate: 'Empate' }[leaning];
  if (!targetLabel) return;

  const target = market.outcomes.find((o) => o.label === targetLabel);
  if (!target || target.predProb == null) return;

  const delta = Math.max(-MAX_ADJUSTMENT_PP, Math.min(MAX_ADJUSTMENT_PP, adjustmentPp || 0)) / 100;
  if (delta === 0) return;

  const others = market.outcomes.filter((o) => o !== target);
  const othersTotal = others.reduce((sum, o) => sum + (o.predProb || 0), 0);

  target.predProb = Math.min(0.98, Math.max(0.01, target.predProb + delta));
  const remaining = 1 - target.predProb;
  if (othersTotal > 0) {
    others.forEach((o) => {
      o.predProb = ((o.predProb || 0) / othersTotal) * remaining;
    });
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const current = next++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('ANTHROPIC_API_KEY not set — skipping AI injury/tactics analysis.');
    return;
  }
  if (!fs.existsSync(DATA_FILE)) {
    console.log('No live_events.json found — run npm run fetch:odds first. Skipping analysis.');
    return;
  }

  const events = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const todayStr = new Date().toISOString().slice(0, 10);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + WINDOW_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const eligible = events
    .filter((e) => e.date >= todayStr && e.date <= cutoffStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, MAX_EVENTS);

  console.log(`Analyzing ${eligible.length} of ${events.length} events (next ${WINDOW_DAYS} days, cap ${MAX_EVENTS}).`);

  const client = new Anthropic({ apiKey });
  let succeeded = 0;

  await mapLimit(eligible, CONCURRENCY, async (event) => {
    try {
      const analysis = await analyzeEvent(client, event);
      if (!analysis) {
        console.error(`No submit_analysis call for ${event.teamA} vs ${event.teamB} — skipping.`);
        return;
      }
      event.analysis = { summary: analysis.summary, leaning: analysis.leaning };
      applyAdjustment(event, analysis.leaning, analysis.confidence_adjustment_pp);
      succeeded += 1;
    } catch (err) {
      console.error(`Error analyzing ${event.teamA} vs ${event.teamB}`, err.message);
    }
  });

  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
  console.log(`Wrote analysis for ${succeeded}/${eligible.length} eligible events.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
