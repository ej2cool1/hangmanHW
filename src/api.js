const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function parse(res) {
  if (!res.ok) {
    const msg = await res.text();
    const err = new Error(msg || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// === GET /player?playerName=NAME ==========================================
export async function fetchPlayer(playerName) {
  const res = await fetch(
    `${API_URL}/player?playerName=${encodeURIComponent(playerName)}`
  );

  if (res.status === 404) {
    const err = new Error('Not found');
    err.status = 404;
    throw err;
  }
  return parse(res);
}

// === POST /player ==========================================================
export async function createPlayer(playerName) {
  const res = await fetch(`${API_URL}/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });

  return parse(res);
}

// === PUT /player (update stats) ===========================================
export async function updatePlayerStats(playerName, wins, losses) {
  const res = await fetch(`${API_URL}/player`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, wins, losses }),
  });

  return parse(res);
}
