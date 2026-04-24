import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getAllGamesAdmin, toggleGame } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const GAME_EMOJIS = { alphabet:'🔤', colors:'🎨', shapes:'🔵', animals:'🐘', counting:'⭐', words:'📝', math:'➕', spelling:'✏️', memory:'🃏' };
const GAME_AGE    = { alphabet:'6-9', colors:'3-6', shapes:'3-6', animals:'3-6', counting:'6-9', words:'6-9', math:'9-12', spelling:'9-12', memory:'9-12' };
const AGE_COLOR   = { '3-6':'#F97316', '6-9':'#7C3AED', '9-12':'#10B981' };

const DEFAULT_GAMES = [
  { game_id:'alphabet', name:'Alphabet Adventure', emoji:'🔤', age_group:'6-9',  active:true, description:'Learn the alphabet by speaking each letter!' },
  { game_id:'colors',   name:'Color Explorer',     emoji:'🎨', age_group:'3-6',  active:true, description:'Learn colors with fun visuals!' },
  { game_id:'shapes',   name:'Shape Sorter',       emoji:'🔵', age_group:'3-6',  active:true, description:'Identify shapes correctly!' },
  { game_id:'animals',  name:'Animal Sounds',      emoji:'🐘', age_group:'3-6',  active:true, description:'Say the animal name aloud!' },
  { game_id:'counting', name:'Counting Stars',     emoji:'⭐', age_group:'6-9',  active:true, description:'Count stars before time runs out!' },
  { game_id:'words',    name:'Word Builder',       emoji:'📝', age_group:'6-9',  active:true, description:'Build words from scrambled letters!' },
  { game_id:'math',     name:'Math Challenge',     emoji:'➕', age_group:'9-12', active:true, description:'Solve maths problems against the clock!' },
  { game_id:'spelling', name:'Spell It Right',     emoji:'✏️', age_group:'9-12', active:true, description:'Spell difficult words from memory!' },
  { game_id:'memory',   name:'Memory Flip',        emoji:'🃏', age_group:'9-12', active:true, description:'Match all card pairs before time runs out!' },
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <AdminNavbar />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1F1F2E', marginBottom:8 }}>🎮 Manage All Games</h1>
        <p style={{ fontSize:14, color:'#6B7280', marginBottom:24 }}>Toggle games on or off. Deactivated games will not appear on any student portal.</p>

        {msg && (
          <motion.div style={{ background:'#EFF6FF', color:'#1E40AF', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:700 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}>
            {msg}
          </motion.div>
        )}

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#6B7280' }}>Loading games... ⏳</div>
        ) : (
          ['3-6','6-9','9-12'].map(age => (
            <div key={age} style={{ marginBottom:28 }}>
              <h2 style={{ fontSize:18, fontWeight:900, color:AGE_COLOR[age], marginBottom:14 }}>
                {age === '3-6' ? '🐣' : age === '6-9' ? '🚀' : '🧠'} Age Group {age}
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
                {byAge[age].map((game, i) => (
                  <motion.div key={i}
                    style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', borderLeft:`4px solid ${game.active?AGE_COLOR[age]:'#D1D5DB'}`, opacity:game.active?1:0.7 }}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:game.active?1:0.7, y:0 }} transition={{ delay:i*0.05 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ fontSize:36 }}>{game.emoji || GAME_EMOJIS[game.game_id] || '🎮'}</div>
                        <div>
                          <div style={{ fontSize:16, fontWeight:900, color:'#1F1F2E' }}>{game.name}</div>
                          <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>{game.description}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
                      <span style={{ background:game.active?'#D1FAE5':'#FEE2E2', color:game.active?'#065F46':'#991B1B', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                        {game.active ? '✅ Active' : '❌ Inactive'}
                      </span>
                      <motion.button
                        style={{ background:game.active?'#FEE2E2':'#D1FAE5', color:game.active?'#EF4444':'#10B981', border:'none', padding:'8px 16px', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                        whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
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