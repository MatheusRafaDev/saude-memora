import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

/* ── useInView hook ─────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── FeatureCard ────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, accent, index }) {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? accent + "55" : "#e8edf5"}`,
        borderRadius: 24,
        padding: "36px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all .4s cubic-bezier(.22,1,.36,1)",
        transitionDelay: `${index * 60}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        boxShadow: hovered ? `0 24px 60px -12px ${accent}33` : "none",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: accent + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: accent,
        transition: "transform .3s",
        transform: hovered ? "scale(1.1)" : "scale(1)",
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.65 }}>{desc}</div>
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accent}, ${accent}44)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity .3s",
        borderRadius: "0 0 24px 24px",
      }} />
    </div>
  );
}

/* ── Step ───────────────────────────────────────────────────── */
function Step({ num, title, desc, accent, index }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      display: "flex", gap: 20, alignItems: "flex-start",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-28px)",
      transition: `all .6s cubic-bezier(.22,1,.36,1) ${index * 120}ms`,
    }}>
      <div style={{
        minWidth: 52, height: 52, background: accent, borderRadius: 18,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 900, color: "#fff",
        boxShadow: `0 8px 24px ${accent}55`, flexShrink: 0,
      }}>{num}</div>
      <div style={{ paddingTop: 4 }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── SectionHeader ──────────────────────────────────────────── */
function SectionHeader({ label, title, subtitle, left = false }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{ textAlign: left ? "left" : "center", marginBottom: left ? 0 : 60 }}>
      <div style={{
        display: "inline-block", padding: "5px 18px", borderRadius: 100,
        background: "#eff6ff", color: "#2563eb",
        fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase",
        marginBottom: 18,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "all .5s",
      }}>{label}</div>
      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: left ? "clamp(28px, 3.5vw, 44px)" : "clamp(32px, 4vw, 48px)",
        fontWeight: 900, color: "#0f172a",
        letterSpacing: "-1px", marginBottom: subtitle ? 16 : 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "all .55s .07s",
        display: "block",
      }}>{title}</h2>
      {subtitle && (
        <p style={{
          fontSize: 17, color: "#64748b",
          maxWidth: left ? "none" : 520,
          margin: left ? 0 : "0 auto",
          lineHeight: 1.65, fontWeight: 300,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all .6s .14s",
        }}>{subtitle}</p>
      )}
    </div>
  );
}

/* ── CtaSection ─────────────────────────────────────────────── */
function CtaSection({ onNavigate }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{
      maxWidth: 1100, margin: "0 auto",
      background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0ea5e9 100%)",
      borderRadius: 32, padding: "72px 48px", textAlign: "center",
      position: "relative", overflow: "hidden",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: "all .7s cubic-bezier(.22,1,.36,1)",
    }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -40, width: 250, height: 250, borderRadius: "50%", background: "rgba(139,92,246,.2)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
        padding: "6px 16px", borderRadius: 100,
        fontSize: 12, fontWeight: 600, color: "white",
        letterSpacing: "1px", textTransform: "uppercase", marginBottom: 24,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse-dot 2s infinite" }} />
        Gratuito para começar
      </div>
      <h2 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: "clamp(28px, 4vw, 50px)",
        fontWeight: 900, color: "white", letterSpacing: "-1px", marginBottom: 16, display: "block",
      }}>
        Comece a cuidar melhor<br />da sua saúde
      </h2>
      <p style={{ fontSize: 17, color: "rgba(255,255,255,.8)", marginBottom: 40, fontWeight: 300 }}>
        Crie sua conta gratuitamente e organize todos os seus documentos médicos hoje mesmo.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="cta-btn-white" onClick={() => onNavigate("/criar-conta")}>
          Criar conta grátis
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
        <button className="cta-btn-outline" onClick={() => onNavigate("/login")}>Já tenho conta</button>
      </div>
    </div>
  );
}

/* ── Static data ────────────────────────────────────────────── */
const FEATURES = [
  {
    accent: "#2563eb", title: "Digitalização Inteligente",
    desc: "Fotografe seus documentos físicos e nossa IA extrai automaticamente todas as informações com OCR avançado.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  },
  {
    accent: "#0891b2", title: "Organização Automática",
    desc: "Exames, receitas e documentos clínicos categorizados automaticamente, sempre fáceis de encontrar.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  },
  {
    accent: "#7c3aed", title: "Relatórios Médicos",
    desc: "Visualize medicamentos mais usados, histórico de exames e tendências de saúde em um painel completo.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  },
  {
    accent: "#059669", title: "Ficha Médica Completa",
    desc: "Alergias, condições crônicas, histórico familiar — tudo registrado e acessível para qualquer consulta.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
  {
    accent: "#d97706", title: "Busca Rápida",
    desc: "Encontre qualquer documento, medicamento ou resultado de exame em segundos com busca inteligente.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  },
  {
    accent: "#db2777", title: "Compartilhamento Seguro",
    desc: "Compartilhe seu histórico com médicos e especialistas de forma rápida e com total privacidade.",
    icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
];

const STEPS = [
  { num: "1", accent: "#2563eb", title: "Crie sua conta",          desc: "Cadastre-se gratuitamente com email e senha. Em menos de 1 minuto você já está dentro." },
  { num: "2", accent: "#7c3aed", title: "Adicione seus documentos", desc: "Faça upload de fotos ou PDFs. Nossa IA lê e classifica automaticamente cada documento." },
  { num: "3", accent: "#059669", title: "Acesse em qualquer lugar", desc: "Veja seu histórico completo, relatórios e fichas médicas de qualquer dispositivo." },
];

const DOCS = [
  { label: "Hemograma Completo", type: "Exame",  typeBg: "#eff6ff", typeC: "#2563eb", dot: "#2563eb", date: "12 Jan" },
  { label: "Amoxicilina 500mg",  type: "Receita", typeBg: "#ecfdf5", typeC: "#059669", dot: "#10b981", date: "05 Jan" },
  { label: "Laudo Cardiológico", type: "Clínico", typeBg: "#fff7ed", typeC: "#d97706", dot: "#f59e0b", date: "28 Dez" },
];

const PHONE_ITEMS = [
  { dot: "#2563eb", tag: "Exame",  tagBg: "#eff6ff", tagC: "#2563eb" },
  { dot: "#10b981", tag: "Receita",tagBg: "#ecfdf5", tagC: "#059669" },
  { dot: "#f59e0b", tag: "Clínico",tagBg: "#fff7ed", tagC: "#d97706" },
];

/* ── Main ───────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled]       = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .nav-link {
          font-size: 14px; font-weight: 500; padding: 8px 14px; border-radius: 10px;
          transition: all .2s; cursor: pointer; background: none; border: none;
          font-family: 'Outfit', sans-serif;
        }
        .btn-ghost {
          padding: 9px 20px; border-radius: 100px; font-weight: 600; font-size: 14px;
          cursor: pointer; background: transparent; font-family: 'Outfit', sans-serif; transition: all .2s;
        }
        .btn-primary {
          padding: 10px 22px; border-radius: 100px; font-weight: 600; font-size: 14px;
          cursor: pointer; border: none; background: #2563eb; color: white;
          font-family: 'Outfit', sans-serif; box-shadow: 0 4px 14px rgba(37,99,235,.3); transition: all .2s;
        }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(37,99,235,.35); }

        .hero-cta-primary {
          display: inline-flex; align-items: center; gap: 10px; padding: 15px 32px; border-radius: 100px;
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 16px;
          background: white; color: #2563eb; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(0,0,0,.15); transition: all .25s;
        }
        .hero-cta-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,.2); }

        .hero-cta-secondary {
          display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 100px;
          font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 15px;
          background: rgba(255,255,255,.12); color: white; border: 1.5px solid rgba(255,255,255,.35);
          cursor: pointer; backdrop-filter: blur(8px); transition: all .25s;
        }
        .hero-cta-secondary:hover { background: rgba(255,255,255,.22); transform: translateY(-2px); }

        .cta-btn-white {
          display: inline-flex; align-items: center; gap: 10px; padding: 15px 32px; border-radius: 100px;
          font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 16px;
          background: white; color: #2563eb; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(0,0,0,.15); transition: all .25s;
        }
        .cta-btn-white:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,.2); }

        .cta-btn-outline {
          display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px; border-radius: 100px;
          font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 15px;
          background: transparent; color: white; border: 1.5px solid rgba(255,255,255,.4);
          cursor: pointer; transition: all .25s;
        }
        .cta-btn-outline:hover { background: rgba(255,255,255,.1); transform: translateY(-2px); }

        .footer-link { color: #475569; font-size: 13px; cursor: pointer; transition: color .2s; }
        .footer-link:hover { color: #60a5fa; }

        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
        @keyframes barsGrow  { from{transform:scaleY(0)} to{transform:scaleY(1)} }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .how-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .header-nav    { display: none !important; }
          .stats-row     { flex-wrap: wrap !important; }
          .hero-ctas     { flex-direction: column !important; align-items: stretch !important; }
          .hero-cta-primary, .hero-cta-secondary { justify-content: center; }
        }
      `}</style>

      <div style={{ fontFamily: "'Outfit', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

        {/* HEADER */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          background: scrolled ? "rgba(248,250,252,.95)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.06)" : "none",
          transition: "all .35s ease",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,.3)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-9-6-9-11a5 5 0 0110 0 5 5 0 0110 0c0 5-9 11-11 11z" fill="rgba(255,255,255,.9)" />
                  <path d="M9 13h2l1-3 2 6 1.5-3H18" stroke="rgba(147,197,253,.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: scrolled ? "#0f172a" : "white", transition: "color .3s" }}>
                SaúdeMemora
              </span>
            </div>
            
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="btn-ghost" style={{ border: `1.5px solid ${scrolled ? "#e2e8f0" : "rgba(255,255,255,.35)"}`, color: scrolled ? "#334155" : "white" }} onClick={() => navigate("/login")}>Entrar</button>
              <button className="btn-primary" onClick={() => navigate("/criar-conta")}>Criar conta</button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section style={{ minHeight: "100vh", position: "relative", overflow: "hidden", background: "linear-gradient(150deg,#1e40af 0%,#2563eb 45%,#0ea5e9 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 32px 80px" }}>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {[
              { w: 500, h: 500, top: "-120px", right: "-80px", bg: "#60a5fa", dur: 8, delay: "0s" },
              { w: 350, h: 350, bottom: "-60px", left: "-60px", bg: "#8b5cf6", dur: 11, delay: "2.5s" },
              { w: 300, h: 300, top: "40%",     left: "35%",   bg: "#06b6d4", dur: 9,  delay: "5s" },
            ].map((b, i) => (
              <div key={i} style={{ position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: .22, width: b.w, height: b.h, top: b.top, right: b.right, bottom: b.bottom, left: b.left, background: b.bg, animation: `floatY ${b.dur}s ease-in-out infinite`, animationDelay: b.delay }} />
            ))}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
          </div>

          <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
            <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

              {/* LEFT */}
              <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(36px)", transition: "all .8s cubic-bezier(.22,1,.36,1)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.2)", padding: "7px 18px", borderRadius: 100, fontSize: 13, fontWeight: 500, color: "white", marginBottom: 28 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "pulse-dot 2s ease-in-out infinite" }} />
                  Plataforma digital de saúde
                </div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(38px,5.5vw,68px)", fontWeight: 900, lineHeight: 1.05, color: "white", marginBottom: 24, letterSpacing: "-1.5px" }}>
                  Seu histórico médico,{" "}
                  <em style={{ fontStyle: "italic", background: "linear-gradient(135deg,#fbbf24,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>sempre à mão</em>
                </h1>
                <p style={{ fontSize: 17, color: "rgba(255,255,255,.82)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, fontWeight: 300 }}>
                  O SaúdeMemora digitaliza, organiza e centraliza todos os seus documentos de saúde — exames, receitas e fichas médicas — com inteligência artificial e OCR avançado.
                </p>
                <div className="hero-ctas" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
                  <button className="hero-cta-primary" onClick={() => navigate("/criar-conta")}>
                    Começar gratuitamente
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                  <button className="hero-cta-secondary" onClick={() => navigate("/login")}>Já tenho conta</button>
                </div>
                <div className="stats-row" style={{ display: "flex", gap: 10 }}>
                  {[{n:"100%",l:"Digital"},{n:"IA",l:"Integrada"},{n:"OCR",l:"Automático"},{n:"24/7",l:"Disponível"}].map((s,i)=>(
                    <div key={i} style={{ flex:1,minWidth:80,background:"rgba(255,255,255,.1)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,.2)",borderRadius:16,padding:"14px 10px",textAlign:"center" }}>
                      <div style={{ fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:900,color:"white",letterSpacing:"-0.5px" }}>{s.n}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,.6)",marginTop:2,textTransform:"uppercase",letterSpacing:"1px",fontWeight:500 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: mockup */}
              <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(48px)", transition: "all .9s cubic-bezier(.22,1,.36,1) .15s", display: "flex", justifyContent: "center" }}>
                <div style={{ background:"white",borderRadius:28,padding:24,boxShadow:"0 40px 80px rgba(0,0,0,.25)",width:"100%",maxWidth:400,animation:"floatY 7s ease-in-out infinite" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:20,paddingBottom:16,borderBottom:"1px solid #f1f5f9" }}>
                    {["#f87171","#fbbf24","#34d399"].map((c,i)=><div key={i} style={{ width:10,height:10,borderRadius:"50%",background:c }}/>)}
                    <div style={{ flex:1,height:8,background:"#f1f5f9",borderRadius:4,marginLeft:8 }}/>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px 14px",background:"#f8fafc",borderRadius:16 }}>
                    <div style={{ width:42,height:42,borderRadius:14,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:17,fontWeight:700 }}>A</div>
                    <div>
                      <div style={{ fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:700,color:"#0f172a" }}>Ana Silva</div>
                      <div style={{ fontSize:12,color:"#94a3b8" }}>Paciente · 34 anos</div>
                    </div>
                    <div style={{ marginLeft:"auto",display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:100,background:"#ecfdf5",color:"#059669",fontSize:11,fontWeight:700 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:"#10b981" }}/>Ativo
                    </div>
                  </div>
                  {DOCS.map((d,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:14,border:"1px solid #f1f5f9",marginBottom:8,background:"#fafcff" }}>
                      <div style={{ width:8,height:8,borderRadius:"50%",background:d.dot,flexShrink:0 }}/>
                      <div style={{ flex:1,fontSize:13,fontWeight:500,color:"#1e293b" }}>{d.label}</div>
                      <div style={{ padding:"3px 10px",borderRadius:100,background:d.typeBg,color:d.typeC,fontSize:11,fontWeight:700 }}>{d.type}</div>
                      <div style={{ fontSize:11,color:"#94a3b8" }}>{d.date}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:14,padding:"14px 14px 6px",background:"#f8fafc",borderRadius:16 }}>
                    <div style={{ fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.8px" }}>Documentos / mês</div>
                    <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:50 }}>
                      {[35,55,42,78,60,88,70].map((h,i)=>(
                        <div key={i} style={{ flex:1,height:`${h}%`,background:i===5?"linear-gradient(180deg,#2563eb,#60a5fa)":"#dbeafe",borderRadius:"4px 4px 2px 2px",transformOrigin:"bottom",animation:`barsGrow .6s cubic-bezier(.22,1,.36,1) ${i*60+400}ms both` }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position:"absolute",bottom:0,left:0,right:0,lineHeight:0 }}>
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width:"100%",height:60 }}>
              <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 30 1440 30V60Z" fill="#f8fafc"/>
            </svg>
          </div>
        </section>

        {/* FEATURES */}
        <section style={{ padding:"96px 32px",maxWidth:1200,margin:"0 auto" }}>
          <SectionHeader
            label="Funcionalidades"
            title={<>Tudo que você precisa<br/>num só lugar</>}
            subtitle="Tecnologia de ponta para simplificar sua relação com documentos de saúde"
          />
          <div className="features-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20 }}>
            {FEATURES.map((f,i)=><FeatureCard key={i} {...f} index={i}/>)}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ background:"white",padding:"96px 32px" }}>
          <div className="how-grid" style={{ maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center" }}>
            <div>
              <SectionHeader label="Como funciona" title="Em 3 passos simples" left/>
              <div style={{ display:"flex",flexDirection:"column",gap:32,marginTop:40 }}>
                {STEPS.map((s,i)=><Step key={i} {...s} index={i}/>)}
              </div>
            </div>
            <div style={{ display:"flex",justifyContent:"center" }}>
              <div style={{ width:265,background:"#0f172a",borderRadius:44,padding:"14px 10px 22px",boxShadow:"0 40px 80px rgba(0,0,0,.2)",animation:"floatY 8s ease-in-out infinite 1s" }}>
                <div style={{ width:100,height:22,background:"#1e293b",borderRadius:20,margin:"0 auto 14px" }}/>
                <div style={{ background:"white",borderRadius:34,padding:14,minHeight:460 }}>
                  <div style={{ height:7,background:"#f1f5f9",borderRadius:4,width:"55%",margin:"0 auto 16px" }}/>
                  {PHONE_ITEMS.map((item,i)=>(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:14,background:"#f8fafc",marginBottom:10 }}>
                      <div style={{ width:36,height:36,borderRadius:11,background:item.dot+"18",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <div style={{ width:12,height:12,borderRadius:"50%",background:item.dot }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ height:7,background:"#e2e8f0",borderRadius:4,marginBottom:5,width:"80%" }}/>
                        <div style={{ height:6,background:"#f1f5f9",borderRadius:4,width:"50%" }}/>
                      </div>
                      <div style={{ fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:8,background:item.tagBg,color:item.tagC }}>{item.tag}</div>
                    </div>
                  ))}
                  <div style={{ marginTop:16,padding:"12px 10px",background:"#f8fafc",borderRadius:16 }}>
                    <div style={{ fontSize:10,fontWeight:600,color:"#94a3b8",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.8px" }}>Histórico</div>
                    <div style={{ display:"flex",gap:5,alignItems:"flex-end",height:44 }}>
                      {[40,65,50,80,55,90,70].map((h,i)=>(
                        <div key={i} style={{ flex:1,height:`${h}%`,background:i===5?"linear-gradient(180deg,#2563eb,#60a5fa)":"#dbeafe",borderRadius:"3px 3px 2px 2px",transformOrigin:"bottom",animation:`barsGrow .5s cubic-bezier(.22,1,.36,1) ${i*60+200}ms both` }}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding:"0 32px 96px" }}>
          <CtaSection onNavigate={navigate}/>
        </section>

        {/* FOOTER */}
        <footer style={{ background:"#0f172a",padding:"48px 32px" }}>
          <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#2563eb,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-9-6-9-11a5 5 0 0110 0 5 5 0 0110 0c0 5-9 11-11 11z" fill="rgba(255,255,255,.9)"/></svg>
              </div>
              <span style={{ fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:18,color:"white" }}>SaúdeMemora</span>
            </div>
            <p style={{ color:"#475569",fontSize:13 }}>© 2025 SaúdeMemora. Todos os direitos reservados.</p>
            <div style={{ display:"flex",gap:20 }}>
              {["Privacidade","Termos","Contato"].map(l=>(
                <span key={l} className="footer-link">{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}