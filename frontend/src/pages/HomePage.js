import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ── FLOATING PARTICLE ──────────────────────────────────────────
function Particle({ x, y, size, color, duration, delay }) {
  return (
    <motion.div
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        width: size, height: size, borderRadius: '50%',
        background: color, pointerEvents: 'none', zIndex: 0,
        filter: `blur(${size / 3}px)`,
      }}
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── STAT COUNTER ───────────────────────────────────────────────
function StatCounter({ value, label, color }) {
  const [count, setCount] = useState(0);
  const num = parseInt(value.replace(/\D/g, ''));
  const suffix = value.replace(/[0-9]/g, '');
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(num / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [num]);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 36, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
        background: `linear-gradient(135deg, ${color}, white)`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{count}{suffix}</div>
      <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── FEATURE CARD ───────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, delay }) {
  const rgb = color === '#6366F1' ? '99,102,241' : color === '#10B981' ? '16,185,129' :
    color === '#F59E0B' ? '245,158,11' : color === '#EC4899' ? '236,72,153' : '6,182,212';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      style={{
        background: 'rgba(30,41,59,0.6)', border: `1px solid rgba(${rgb},0.2)`,
        borderRadius: 20, padding: '28px 24px', backdropFilter: 'blur(10px)',
        position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
      whileHover={{
        borderColor: `rgba(${rgb},0.5)`,
        boxShadow: `0 8px 40px rgba(${rgb},0.2)`,
        y: -4,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{
        width: 52, height: 52, borderRadius: 14, fontSize: 26,
        background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', lineHeight: 1.7 }}>
        {desc}
      </div>
    </motion.div>
  );
}

// ── GAME PREVIEW CARD ──────────────────────────────────────────
function GamePreviewCard({ emoji, name, age, color, delay }) {
  const rgb = color === '#6366F1' ? '99,102,241' : color === '#10B981' ? '16,185,129' :
    color === '#F59E0B' ? '245,158,11' : color === '#EC4899' ? '236,72,153' :
    color === '#F97316' ? '249,115,22' : '168,85,247';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -6, boxShadow: `0 12px 40px rgba(${rgb},0.3)`, borderColor: `rgba(${rgb},0.5)` }}
      style={{
        background: 'rgba(30,41,59,0.7)', border: `1px solid rgba(${rgb},0.2)`,
        borderRadius: 16, padding: '20px 16px', textAlign: 'center',
        backdropFilter: 'blur(8px)', cursor: 'default',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}66)`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ fontSize: 40, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999,
        background: `rgba(${rgb},0.15)`, color, display: 'inline-block',
        fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
        Ages {age}
      </div>
    </motion.div>
  );
}

// ── ROLE CARD ──────────────────────────────────────────────────
function RoleCard({ emoji, role, desc, color, delay }) {
  const rgb = color === '#6366F1' ? '99,102,241' : color === '#10B981' ? '16,185,129' :
    color === '#F59E0B' ? '245,158,11' : '239,68,68';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.04, y: -4, borderColor: `rgba(${rgb},0.5)`,
        boxShadow: `0 10px 36px rgba(${rgb},0.2)` }}
      style={{
        background: 'rgba(30,41,59,0.6)', border: `1px solid rgba(${rgb},0.2)`,
        borderRadius: 16, padding: '24px 18px', textAlign: 'center',
        backdropFilter: 'blur(8px)', cursor: 'default', transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'Nunito,sans-serif', marginBottom: 6 }}>
        {role}
      </div>
      <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', lineHeight: 1.6 }}>
        {desc}
      </div>
    </motion.div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [sent,    setSent]    = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const PARTICLES = [
    { x:10, y:20, size:120, color:'rgba(99,102,241,0.08)',  duration:8,  delay:0   },
    { x:80, y:10, size:180, color:'rgba(16,185,129,0.06)',  duration:10, delay:2   },
    { x:50, y:70, size:150, color:'rgba(245,158,11,0.05)',  duration:9,  delay:1   },
    { x:20, y:80, size:100, color:'rgba(236,72,153,0.07)',  duration:7,  delay:3   },
    { x:90, y:60, size:130, color:'rgba(99,102,241,0.06)',  duration:11, delay:0.5 },
    { x:5,  y:50, size:80,  color:'rgba(6,182,212,0.07)',   duration:6,  delay:1.5 },
  ];

  const handleContact = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setName(''); setEmail(''); setMsg('');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Games',    href: '#games'    },
    { label: 'Portals',  href: '#portals'  },
    { label: 'Contact',  href: '#contact'  },
  ];

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', overflowX: 'hidden', position: 'relative' }}>

      {/* ── GLOBAL PARTICLES ── */}
      {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}

      {/* ── GRID BACKGROUND ── */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.025, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(#4F6080 1px,transparent 1px),linear-gradient(90deg,#4F6080 1px,transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(11,17,32,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 0 20px rgba(99,102,241,0.5)',
          }}>🎓</div>
          <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'Nunito,sans-serif' }}>
            <span style={{ color: '#6366F1' }}>Fun</span>
            <span style={{ color: '#F59E0B' }}>Learn</span>
            <span style={{ color: '#F1F5F9' }}>AI</span>
          </span>
        </div>

        {/* Nav links desktop */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {navLinks.map(l => (
            <motion.button key={l.label} whileHover={{ color: '#818CF8' }}
              onClick={() => scrollTo(l.href)}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', fontSize: 14, fontWeight: 600,
                fontFamily: 'Nunito,sans-serif', padding: '8px 14px', borderRadius: 8 }}>
              {l.label}
            </motion.button>
          ))}
        </div>

        {/* Auth buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.03, color: '#818CF8' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #2D3A4F',
              background: 'transparent', color: '#94A3B8', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Nunito,sans-serif', transition: 'all 0.2s' }}>
            Login
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 6px 24px rgba(99,102,241,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: '#fff', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}>
            Sign Up Free
          </motion.button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 40px 60px', textAlign: 'center', position: 'relative',
      }}>
        {/* Hero orbs */}
        <motion.div style={{
          position: 'absolute', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 6, repeat: Infinity }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780 }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 999, padding: '6px 16px', marginBottom: 24,
            }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1',
              boxShadow: '0 0 8px #6366F1', animation: 'glowPulseIndigo 2s infinite' }} />
            <span style={{ fontSize: 13, color: '#818CF8', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
              Pakistan's #1 AI-Powered Learning Platform
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, lineHeight: 1.1,
              fontFamily: 'Nunito,sans-serif', margin: '0 0 20px', color: '#F1F5F9',
            }}>
            Make Learning{' '}
            <span style={{
              background: 'linear-gradient(135deg,#6366F1,#A855F7,#EC4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Fun & Smart</span>
            {' '}for Every Child
          </motion.h1>

          {/* Sub heading */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: 18, color: '#94A3B8', fontFamily: 'Nunito,sans-serif',
              maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.7,
            }}>
            FunLearn AI delivers adaptive, voice-powered educational games for children aged
            3–12. With real-time AI feedback and multi-role portals, learning becomes an adventure.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 36px rgba(99,102,241,0.55)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                padding: '16px 36px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff', fontSize: 16, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                boxShadow: '0 6px 24px rgba(99,102,241,0.4)',
              }}>
              🚀 Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04, borderColor: 'rgba(99,102,241,0.5)', color: '#818CF8' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              style={{
                padding: '16px 36px', borderRadius: 14,
                border: '1px solid #2D3A4F', background: 'transparent',
                color: '#94A3B8', fontSize: 16, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Nunito,sans-serif', transition: 'all 0.2s',
              }}>
              Sign In →
            </motion.button>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{
              display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap',
              marginTop: 56, paddingTop: 40,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
            <StatCounter value="500+" label="Schools" color="#6366F1" />
            <StatCounter value="50000+" label="Students" color="#10B981" />
            <StatCounter value="1000000+" label="Games Played" color="#F59E0B" />
            <StatCounter value="15+" label="Unique Games" color="#EC4899" />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', letterSpacing: '2px',
            fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>
            WHAT WE OFFER
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif', margin: '0 0 14px' }}>
            Everything a Child Needs to{' '}
            <span style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Thrive
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', maxWidth: 500, margin: '0 auto' }}>
            AI-powered features designed specifically for young learners aged 3–12
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          <FeatureCard icon="🎙️" color="#6366F1" delay={0}
            title="Voice Recognition AI"
            desc="Children speak their answers naturally. Our AI evaluates up to 10 phonetic alternatives per response, achieving reliable recognition even for young, developing voices." />
          <FeatureCard icon="🧠" color="#10B981" delay={0.08}
            title="Adaptive Difficulty"
            desc="Machine learning continuously adjusts game difficulty based on each student's performance, keeping them in the optimal learning zone at all times." />
          <FeatureCard icon="📊" color="#F59E0B" delay={0.16}
            title="Real-Time Progress Analytics"
            desc="Parents, teachers, and admins see live dashboards with charts showing student performance trends, game scores, skill proficiency, and weekly improvements." />
          <FeatureCard icon="🏆" color="#EC4899" delay={0.24}
            title="Gamification & Badges"
            desc="Stars, badges, levels, and stage unlocking keep children motivated. Every achievement is permanently saved and visible to parents and teachers." />
          <FeatureCard icon="🔐" color="#06B6D4" delay={0.32}
            title="Secure Multi-Role System"
            desc="OTP email verification, JWT authentication, admin secret keys, and password strength validation protect every user role with industry-standard security." />
          <FeatureCard icon="☁️" color="#A855F7" delay={0.40}
            title="Cloud-Native & Always On"
            desc="Deployed on Vercel and Render with MongoDB Atlas. GitHub Actions CI/CD pipeline ensures smooth, zero-downtime updates and automated testing." />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg,transparent,rgba(99,102,241,0.04),transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', letterSpacing: '2px',
              fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif' }}>Simple for Children,{' '}
              <span style={{ background: 'linear-gradient(135deg,#10B981,#34D399)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Powerful for Educators
              </span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📝', title: 'Register',    color: '#6366F1', desc: 'Create an account in under 2 minutes. Students only need a username — no email required.' },
              { step: '02', icon: '🎮', title: 'Play Games',  color: '#10B981', desc: 'Students pick age-appropriate games. Voice recognition lets even 3-year-olds play independently.' },
              { step: '03', icon: '📈', title: 'Track Growth',color: '#F59E0B', desc: 'AI analyses every session. Parents and teachers see beautiful charts showing real progress.' },
              { step: '04', icon: '🏆', title: 'Earn Rewards', color: '#EC4899', desc: 'Stars, badges, and level-ups keep children motivated to return every day.' },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ textAlign: 'center', padding: '28px 20px' }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: s.color, letterSpacing: '1px',
                  fontFamily: 'Nunito,sans-serif', marginBottom: 12,
                }}>{s.step}</div>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, fontSize: 30,
                  background: `rgba(${s.color === '#6366F1' ? '99,102,241' : s.color === '#10B981' ? '16,185,129' : s.color === '#F59E0B' ? '245,158,11' : '236,72,153'},0.12)`,
                  border: `1px solid rgba(${s.color === '#6366F1' ? '99,102,241' : s.color === '#10B981' ? '16,185,129' : s.color === '#F59E0B' ? '245,158,11' : '236,72,153'},0.25)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F1F5F9',
                  fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', lineHeight: 1.6 }}>
                  {s.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES SECTION ── */}
      <section id="games" style={{ padding: '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', letterSpacing: '2px',
            fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>15 UNIQUE GAMES</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
            A Game for Every{' '}
            <span style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Age & Skill
            </span>
          </h2>
        </motion.div>

        {/* Age group tabs */}
        {[
          {
            label: 'Little Explorers', age: '3–6', color: '#EC4899',
            games: [
              { emoji: '🎨', name: 'Color Explorer',    color: '#EC4899' },
              { emoji: '🔵', name: 'Shape Sorter',      color: '#3B82F6' },
              { emoji: '🔤', name: 'Alphabet Adventure',color: '#8B5CF6' },
              { emoji: '🔢', name: 'Number Buddy',      color: '#F97316' },
              { emoji: '🔊', name: 'Animal Sounds',     color: '#8B5CF6' },
            ],
          },
          {
            label: 'Junior Learners', age: '6–9', color: '#10B981',
            games: [
              { emoji: '🐾', name: 'Animal Kingdom',    color: '#10B981' },
              { emoji: '⭐', name: 'Counting Stars',    color: '#F59E0B' },
              { emoji: '📝', name: 'Word Builder',      color: '#F97316' },
              { emoji: '💬', name: 'Sentence Maker',    color: '#0EA5E9' },
              { emoji: '🔷', name: 'Pattern Quest',     color: '#EC4899' },
            ],
          },
          {
            label: 'Super Scholars', age: '9–12', color: '#6366F1',
            games: [
              { emoji: '➕', name: 'Math Challenge',    color: '#EF4444' },
              { emoji: '✏️', name: 'Spell It Right',    color: '#A855F7' },
              { emoji: '🃏', name: 'Memory Flip',       color: '#06B6D4' },
              { emoji: '🧩', name: 'Logic Grid',        color: '#6366F1' },
              { emoji: '⚡', name: 'Speed Equations',   color: '#F59E0B' },
            ],
          },
        ].map((grp, gi) => (
          <div key={gi} style={{ marginBottom: 48 }}>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800,
                background: `rgba(${grp.color === '#EC4899' ? '236,72,153' : grp.color === '#10B981' ? '16,185,129' : '99,102,241'},0.15)`,
                color: grp.color, border: `1px solid rgba(${grp.color === '#EC4899' ? '236,72,153' : grp.color === '#10B981' ? '16,185,129' : '99,102,241'},0.3)`,
                fontFamily: 'Nunito,sans-serif',
              }}>
                {grp.label}
              </div>
              <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                Ages {grp.age} • 5 games
              </span>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12,
              '@media(maxWidth:768px)': { gridTemplateColumns: 'repeat(2,1fr)' } }}>
              {grp.games.map((g, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <GamePreviewCard {...g} age={grp.age} delay={i * 0.06} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── PORTALS SECTION ── */}
      <section id="portals" style={{ padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg,transparent,rgba(16,185,129,0.03),transparent)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#A855F7', letterSpacing: '2px',
              fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>4 ROLE PORTALS</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
              A Portal for{' '}
              <span style={{ background: 'linear-gradient(135deg,#A855F7,#EC4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Everyone
              </span>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
            <RoleCard emoji="🎒" role="Student" color="#6366F1" delay={0}
              desc="Play 15 games, unlock stages, earn badges, and watch your XP grow with every session." />
            <RoleCard emoji="👩‍🏫" role="Teacher" color="#F59E0B" delay={0.08}
              desc="Create classes, monitor each student's progress with charts, and identify who needs support." />
            <RoleCard emoji="👨‍👩‍👧" role="Parent" color="#10B981" delay={0.16}
              desc="Get AI-generated progress reports for your child and see weekly improvement charts." />
            <RoleCard emoji="🛡️" role="Admin" color="#EF4444" delay={0.24}
              desc="Full platform control — manage users, toggle games, train the AI model, and view system health." />
          </div>
        </div>
      </section>

      {/* ── CONTACT SECTION ── */}
      <section id="contact" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#06B6D4', letterSpacing: '2px',
            fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>GET IN TOUCH</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
            We'd Love to{' '}
            <span style={{ background: 'linear-gradient(135deg,#06B6D4,#6366F1)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hear From You
            </span>
          </h2>
          <p style={{ fontSize: 15, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginTop: 10 }}>
            Questions, feedback, or partnership enquiries — we're here to help.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          '@media(maxWidth:768px)': { gridTemplateColumns: '1fr' } }}>

          {/* Contact info */}
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 20 }}>Contact Information</h3>
              {[
                { icon: '📧', label: 'Email', value: 'funlearn.ai.support@gmail.com', href: 'mailto:funlearn.ai.support@gmail.com' },
                { icon: '📞', label: 'Phone', value: '+92 300 1234567', href: 'tel:+923001234567' },
                { icon: '📍', label: 'Location', value: 'Bahria University, Lahore Campus', href: null },
                { icon: '🕐', label: 'Support Hours', value: 'Mon–Fri, 9 AM – 6 PM PKT', href: null },
              ].map((c, i) => (
                <motion.div key={i}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}
                  whileHover={{ x: 4 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif',
                      fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>{c.label}</div>
                    {c.href
                      ? <a href={c.href} style={{ fontSize: 14, color: '#06B6D4', fontFamily: 'Nunito,sans-serif',
                          fontWeight: 600, textDecoration: 'none' }}>{c.value}</a>
                      : <div style={{ fontSize: 14, color: '#94A3B8', fontFamily: 'Nunito,sans-serif',
                          fontWeight: 600 }}>{c.value}</div>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social links */}
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontFamily: 'Nunito,sans-serif',
                marginBottom: 12, fontWeight: 700 }}>Follow Us</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { icon: '🐦', label: 'Twitter' },
                  { icon: '💼', label: 'LinkedIn' },
                  { icon: '📘', label: 'Facebook' },
                  { icon: '📸', label: 'Instagram' },
                ].map((s, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.1, y: -2 }}
                    style={{
                      width: 42, height: 42, borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(30,41,59,0.6)', border: '1px solid #2D3A4F',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                    {s.icon}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>
            <div style={{
              background: 'rgba(30,41,59,0.6)', border: '1px solid #2D3A4F',
              borderRadius: 20, padding: '28px 24px', backdropFilter: 'blur(10px)',
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 20 }}>Send a Message</h3>

              <AnimatePresence>
                {sent && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                      color: '#6EE7B7', fontSize: 13, fontFamily: 'Nunito,sans-serif',
                      display: 'flex', gap: 8, alignItems: 'center' }}>
                    ✅ Message sent! We'll get back to you within 24 hours.
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleContact}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8',
                marginBottom: 6, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
    👤 Your Name *
  </label>
  <input type="text" placeholder="Muhammad Ali" value={name}
    onChange={e => setName(e.target.value)} required
    style={{
      width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
      background: 'rgba(15,23,42,0.7)', border: '1px solid #2D3A4F',
      color: '#F1F5F9', fontSize: 14, fontFamily: 'Nunito,sans-serif', outline: 'none',
    }}
    onFocus={e => { e.target.style.borderColor = '#06B6D4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
    onBlur={e => { e.target.style.borderColor = '#2D3A4F'; e.target.style.boxShadow = 'none'; }}/>
</div>

<div style={{ marginBottom: 14 }}>
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8',
    marginBottom: 6, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
    📧 Email Address *
  </label>
  <input type="email" placeholder="your@email.com" value={email}
    onChange={e => setEmail(e.target.value)} required
    style={{
      width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
      background: 'rgba(15,23,42,0.7)', border: '1px solid #2D3A4F',
      color: '#F1F5F9', fontSize: 14, fontFamily: 'Nunito,sans-serif', outline: 'none',
    }}
    onFocus={e => { e.target.style.borderColor = '#06B6D4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
    onBlur={e => { e.target.style.borderColor = '#2D3A4F'; e.target.style.boxShadow = 'none'; }}/>
</div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8',
                    marginBottom: 6, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
                    💬 MESSAGE *
                  </label>
                  <textarea placeholder="Tell us how we can help..." value={msg}
                    onChange={e => setMsg(e.target.value)} required rows={4}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: 'rgba(15,23,42,0.7)', border: '1px solid #2D3A4F',
                      color: '#F1F5F9', fontSize: 14, fontFamily: 'Nunito,sans-serif',
                      outline: 'none', resize: 'vertical', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#06B6D4'; e.target.style.boxShadow = '0 0 0 3px rgba(6,182,212,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = '#2D3A4F'; e.target.style.boxShadow = 'none'; }}/>
                </div>

                <motion.button type="submit"
                  whileHover={{ scale: 1.02, boxShadow: '0 6px 24px rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#06B6D4,#0EA5E9)',
                    color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'Nunito,sans-serif', boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
                  }}>
                  📨 Send Message
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 40px 28px',
        background: 'rgba(15,23,42,0.5)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
                <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Nunito,sans-serif' }}>
                  <span style={{ color: '#6366F1' }}>Fun</span>
                  <span style={{ color: '#F59E0B' }}>Learn</span>
                  <span style={{ color: '#F1F5F9' }}>AI</span>
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', fontFamily: 'Nunito,sans-serif', lineHeight: 1.6 }}>
                AI-powered education for children aged 3–12. Making learning fun, adaptive, and measurable.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              {[
                { heading: 'Platform', links: ['Student Portal','Teacher Portal','Parent Portal','Admin Portal'] },
                { heading: 'Resources', links: ['Documentation','Support','Privacy Policy','Terms of Use'] },
                { heading: 'Company', links: ['About Us','Contact','Bahria University','GitHub'] },
              ].map((col, i) => (
                <div key={i}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', letterSpacing: '0.5px',
                    fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>{col.heading}</div>
                  {col.links.map(l => (
                    <motion.div key={l} whileHover={{ x: 3, color: '#818CF8' }}
                      style={{ fontSize: 13, color: '#64748B', fontFamily: 'Nunito,sans-serif',
                        marginBottom: 8, cursor: 'pointer', transition: 'color 0.2s' }}>
                      {l}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
              © 2026 FunLearn AI. Built by Muhammad Mmaaz — Bahria University, Lahore Campus.
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
              Final Year Project — Department of Computer Sciences
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}