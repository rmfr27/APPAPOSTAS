export const BOOKMAKERS = ['Bet365', 'Betano', 'Betclic', 'Placard', 'Solverde'];

export const SPORTS = [
  { id: 'futebol', label: 'Futebol' },
  { id: 'basquetebol', label: 'Basquetebol' },
  { id: 'tenis', label: 'Ténis' },
];

// Illustrative placeholder data only — see README "Data — Important".
export const events = [
  {
    id: 'evt-1',
    sport: 'futebol',
    competition: 'Premier League',
    teamA: 'Arsenal',
    teamB: 'Manchester City',
    date: '2026-08-16',
    markets: [
      {
        name: 'Resultado Final',
        outcomes: [
          { label: 'Casa', predProb: 0.44, odds: { Bet365: 2.6, Betano: 2.55, Betclic: 2.5, Placard: 2.62, Solverde: 2.58 } },
          { label: 'Empate', predProb: 0.24, odds: { Bet365: 3.4, Betano: 3.3, Betclic: 3.35, Placard: 3.4, Solverde: 3.45 } },
          { label: 'Fora', predProb: 0.32, odds: { Bet365: 2.7, Betano: 2.75, Betclic: 2.68, Placard: 2.72, Solverde: 2.7 } },
        ],
      },
    ],
  },
  {
    id: 'evt-2',
    sport: 'futebol',
    competition: 'La Liga',
    teamA: 'Real Madrid',
    teamB: 'Villarreal',
    date: '2026-08-17',
    markets: [
      {
        name: 'Resultado Final',
        outcomes: [
          { label: 'Casa', predProb: 0.66, odds: { Bet365: 1.55, Betano: 1.5, Betclic: 1.52, Placard: 1.53, Solverde: 1.5 } },
          { label: 'Empate', predProb: 0.19, odds: { Bet365: 4.1, Betano: 4.0, Betclic: 4.2, Placard: 4.1, Solverde: 4.0 } },
          { label: 'Fora', predProb: 0.15, odds: { Bet365: 6.0, Betano: 5.8, Betclic: 5.9, Placard: 6.1, Solverde: 5.9 } },
        ],
      },
    ],
  },
  {
    id: 'evt-3',
    sport: 'futebol',
    competition: 'Brasileirão',
    teamA: 'Flamengo',
    teamB: 'Palmeiras',
    date: '2026-08-09',
    markets: [
      {
        name: 'Resultado Final',
        outcomes: [
          { label: 'Casa', predProb: 0.42, odds: { Bet365: 2.3, Betano: 2.25, Betclic: 2.28, Placard: 2.3, Solverde: 2.32 } },
          { label: 'Empate', predProb: 0.28, odds: { Bet365: 3.2, Betano: 3.25, Betclic: 3.2, Placard: 3.15, Solverde: 3.2 } },
          { label: 'Fora', predProb: 0.3, odds: { Bet365: 3.0, Betano: 2.95, Betclic: 3.05, Placard: 3.0, Solverde: 2.9 } },
        ],
      },
    ],
  },
  {
    id: 'evt-4',
    sport: 'futebol',
    competition: 'Serie A',
    teamA: 'Inter',
    teamB: 'Juventus',
    date: '2026-08-23',
    markets: [
      {
        name: 'Resultado Final',
        outcomes: [
          { label: 'Casa', predProb: 0.53, odds: { Bet365: 2.1, Betano: 2.05, Betclic: 2.08, Placard: 2.1, Solverde: 2.12 } },
          { label: 'Empate', predProb: 0.24, odds: { Bet365: 3.3, Betano: 3.25, Betclic: 3.3, Placard: 3.2, Solverde: 3.3 } },
          { label: 'Fora', predProb: 0.23, odds: { Bet365: 3.4, Betano: 3.5, Betclic: 3.45, Placard: 3.4, Solverde: 3.35 } },
        ],
      },
    ],
  },
  {
    id: 'evt-5',
    sport: 'basquetebol',
    competition: 'Liga Profesional Argentina',
    teamA: 'San Lorenzo',
    teamB: 'Boca Juniors',
    date: '2026-08-12',
    markets: [
      {
        name: 'Vencedor',
        outcomes: [
          { label: 'Casa', predProb: 0.48, odds: { Bet365: 2.0, Betano: 1.95, Betclic: 1.98, Placard: 2.0, Solverde: 2.02 } },
          { label: 'Fora', predProb: 0.52, odds: { Bet365: 1.9, Betano: 1.88, Betclic: 1.85, Placard: 1.9, Solverde: 1.92 } },
        ],
      },
    ],
  },
];
