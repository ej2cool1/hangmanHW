// src/PlayerLogin.js

import React, { useState } from 'react';
import { fetchPlayer, createPlayer } from './api';

export default function PlayerLogin({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let player;

      try {
        player = await fetchPlayer(name.trim());
      } catch (err) {
        if (err.status === 404) {
          player = await createPlayer(name.trim());
        } else {
          throw err;
        }
      }

      onLogin(player); // send full player object upward
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Login</h2>

      <form onSubmit={handleSubmit} aria-label="login-form">
        <input
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button disabled={loading}>Login</button>
      </form>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}
