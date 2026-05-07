import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllGamesAdmin, toggleGame } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const AGE_COLOR = { '3-6': '#F97316', '6-9': '#7C3AED', '9-12': '#10B981' };

const DEFAULT_GAMES = [
  { game_id: 'colors',       name: 'Color Explorer',     emoji: '🎨', age_group: '3-6',  active: true, description: 'Learn colors with fun visuals!' },
  { game_id: 'shapes',       name: 'Shape Sorter',       emoji: '🔵', age_group: '3-6',  active: true, description: 'Identify shapes correctly!' },
  { game_id: 'alphabet',     name: 'Alphabet Adventure', emoji: '🔤', age_group: '3-6',  active: true, description: 'Learn the alphabet by speaking each letter!' },
  { game_id: 'numbers',      name: 'Number Buddy',       emoji: '🔢', age_group: '3-6',  active: true, description: 'Learn numbers interactively!' },
  { game_id: 'animalsounds', name: 'Animal Sounds',      emoji: '🔊', age_group: '3-6',  active: true, description: 'Listen and identify animal sounds!' },
  { game_id: 'animals',      name: 'Animal Kingdom',     emoji: '🐾', age_group: '6-9',  active: true, description: 'Say the animal name aloud!' },
  { game_id: 'counting',     name: 'Counting Stars',     emoji: '⭐', age_group: '6-9',  active: true, description: 'Count stars before time runs out!' },
  { game_id: 'words',        name: 'Word Builder',       emoji: '📝', age_group: '6-9',  active: true, description: 'Build words from scrambled letters!' },
  { game_id: 'sentences',    name: 'Sentence Maker',     emoji: '💬', age_group: '6-9',  active: true, description: 'Form correct sentences!' },
  { game_id: 'patterns',     name: 'Pattern Quest',      emoji: '🔷', age_group: '6-9',  active: true, description: 'Complete the visual patterns!' },
  { game_id: 'math',         name: 'Math Challenge',     emoji: '➕', age_group: '9-12', active: true, description: 'Solve maths problems against the clock!' },
  { game_id: 'spelling',     name: 'Spell It Right',     emoji: '✏️', age_group: '9-12', active: true, description: 'Spell difficult words from memory!' },
  { game_id: 'memory',       name: 'Memory Flip',        emoji: '🃏', age_group: '9-12', active: true, description: 'Match all card pairs before time runs out!' },
  { game_id: 'logicgrid',    name: 'Logic Grid',         emoji: '🧩', age_group: '9-12', active: true, description: 'Solve logic puzzles!' },
  { game_id: 'speedeq',      name: 'Speed Equations',    emoji: '⚡', age_group: '9-12', active: true, description: 'Solve equations as fast as you can!' },
];

export default function AdminGames() {
  const [games,   setGames]   = useState(DEFAULT_GAMES);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    getAllGamesAdmin()
      .then(res => {
        const dbGames = res.data.games || [];
        const merged = DEFAULT_GAMES.map(dg => {
          const found = dbGames.find(g => g.game_id === dg.game_id);
          return found ? { ...dg, ...found } : dg;
        });
        setGames(merged);
      })
      .catch(() => setGames(DEFAULT_GAMES))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (game_id) => {
    try {
      const res = await toggleGame({ game_id });
      setGames(prev => prev.map(g => g.game_id === game_id ? { ...g, active: res.data.active } : g));
      setMsg(`${game_id} is now ${res.data.active ? 'active ✅' : 'deactivated ❌'}`);
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Could not toggle game. Check Django server.'); }
  };

  const byAge = {
    '3-6':  games.filter(g => g.age_group === '3-6'),
    '6-9':  games.filter(g => g.age_group === '6-9'),
    '9-12': games.filter(g => g.age_group === '9-12'),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <AdminNavbar />
      <div style={{ marginLeft: 220, padding: '40px' }}>
        <div style={{
          background: 'linear-gradient(135deg,#1B2B4B 0%,#1E2D45 100%)',
          border: '1px solid #2D3A4F', borderRadius: 20, padding: '24px 28px',
          marginBottom: 24, position: 'relative', overflow: 'hidden'
        }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#F1F5F9', marginBottom: 8, fontFamily: 'Nunito,sans-serif' }}>
            🎮 Manage All Games
          </h1>
          <p style={{ fontSize: 14, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', margin: 0 }}>
            Toggle games on or off. Deactivated games will not appear on any student portal.
          </p>
        </div>

        {msg && (
          <motion.div style={{
            background: 'rgba(99,102,241,0.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, fontWeight: 700,
            fontFamily: 'Nunito,sans-serif'
          }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {msg}
          </motion.div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Loading games... ⏳</div>
        ) : (
          ['3-6','6-9','9-12'].map(age => (
            <div key={age} style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: AGE_COLOR[age], marginBottom: 16, fontFamily: 'Nunito,sans-serif' }}>
                {age === '3-6' ? '🐣' : age === '6-9' ? '🚀' : '🧠'} Age Group {age}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {byAge[age].map((game, i) => (
                  <motion.div key={i}
                    style={{
                      background: 'rgba(30,41,59,0.5)', borderRadius: 20, padding: '20px',
                      border: `1px solid ${game.active ? 'rgba(16,185,129,0.3)' : '#2D3A4F'}`,
                      borderLeft: `4px solid ${game.active ? AGE_COLOR[age] : '#475569'}`,
                      opacity: game.active ? 1 : 0.6
                    }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: game.active ? 1 : 0.6, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 40, background: 'rgba(15,23,42,0.5)', width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {game.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>{game.name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontFamily: 'Nunito,sans-serif' }}>{game.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, background: 'rgba(15,23,42,0.3)', padding: '10px 14px', borderRadius: 12 }}>
                      <span style={{
                        color: game.active ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 800, fontFamily: 'Nunito,sans-serif',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}>
                        {game.active ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}/> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }}/>}
                        {game.active ? 'Active' : 'Inactive'}
                      </span>
                      <motion.button
                        style={{
                          background: game.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: game.active ? '#F87171' : '#34D399',
                          border: `1px solid ${game.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif'
                        }}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggle(game.game_id)}>
                        {game.active ? 'Deactivate' : 'Activate'}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}