import fs from 'fs';
import path from 'path';
import { fetchOdds, fetchActiveTennisKeys, normalizeToEvents } from '../src/services/oddsApi.js';

try {
  process.loadEnvFile(path.resolve('.env'));
} catch {
  // .env is optional — ODDS_API_KEY may already be set in the environment.
}

const OUT = path.resolve('src/data/live_events.json');

async function main() {
  const sportKeys = ['soccer_epl', 'soccer_spain_la_liga', 'basketball_nba'];
  try {
    sportKeys.push(...(await fetchActiveTennisKeys()));
  } catch (err) {
    console.error('Error listing active tennis tournaments', err.message);
  }

  let all = [];
  for (const sk of sportKeys) {
    try {
      console.log('Fetching', sk);
      const data = await fetchOdds(sk);
      const ev = normalizeToEvents(data || []);
      all = all.concat(ev);
    } catch (err) {
      console.error('Error fetching', sk, err.message);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8');
  console.log('Wrote', OUT, 'with', all.length, 'events');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
