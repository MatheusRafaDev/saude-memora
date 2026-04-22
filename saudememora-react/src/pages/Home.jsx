import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Home.css";

const FeatureCard = ({ icon, title, desc, delay }) => (
  <div className="lh-feature" style={{ animationDelay: delay }}>
    <div className="lh-feature__icon">{icon}</div>
    <h3 className="lh-feature__title">{title}</h3>
    <p className="lh-feature__desc">{desc}</p>
  </div>
);

const StepCard = ({ num, title, desc }) => (
  <div className="lh-step">
    <div className="lh-step__num">{num}</div>
    <div>
      <h4 className="lh-step__title">{title}</h4>
      <p className="lh-step__desc">{desc}</p>
    </div>
  </div>
);

function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lh-root">
      {/* ── Topbar simples sem Nav ─────────── */}
      <header className={`lh-header ${scrolled ? "lh-header--shadow" : ""}`}>
        <div className="lh-header__inner">
          <div className="lh-header__brand">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563eb" />
              <path d="M16 24s-9-6.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 12-11 12z" fill="#fff" opacity=".9" />
              <path d="M9 16h3l2-4 2 8 2-4 1 2h4" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>SaúdeMemora</span>
          </div>
          <div className="lh-header__actions">
            <button className="lh-btn lh-btn--ghost" onClick={() => navigate("/login")}>
              Entrar
            </button>
            <button className="lh-btn lh-btn--primary" onClick={() => navigate("/criar-conta")}>
              Criar conta
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────── */}
      <section className="lh-hero">
        <div className="lh-hero__bg">
          <div className="lh-hero__blob lh-hero__blob--1" />
          <div className="lh-hero__blob lh-hero__blob--2" />
          <div className="lh-hero__blob lh-hero__blob--3" />
        </div>
        <div className="lh-hero__content">
          <div className="lh-badge">
            <span className="lh-badge__dot" />
            Plataforma digital de saúde
          </div>
          <h1 className="lh-hero__title">
            Seu histórico médico,
            <br />
            <span className="lh-hero__accent">sempre à mão</span>
          </h1>
          <p className="lh-hero__sub">
            O SaúdeMemora digitaliza, organiza e centraliza todos os seus documentos
            de saúde — exames, receitas e fichas médicas — com inteligência artificial
            e OCR avançado.
          </p>
          <div className="lh-hero__cta">
            <button className="lh-btn lh-btn--hero" onClick={() => navigate("/criar-conta")}>
              Começar gratuitamente
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button className="lh-btn lh-btn--outline" onClick={() => navigate("/login")}>
              Já tenho conta
            </button>
          </div>
        </div>

        <div className="lh-hero__visual">
          <div className="lh-mockup">
            <div className="lh-mockup__header">
              <span /><span /><span />
            </div>
            <div className="lh-mockup__body">
              <div className="lh-mockup__row lh-mockup__row--blue" />
              <div className="lh-mockup__row" />
              <div className="lh-mockup__row lh-mockup__row--sm" />
              <div className="lh-mockup__cards">
                <div className="lh-mockup__card">
                  <div className="lh-mockup__card-icon lh-mockup__card-icon--blue" />
                  <div>
                    <div className="lh-mockup__card-line" />
                    <div className="lh-mockup__card-line lh-mockup__card-line--sm" />
                  </div>
                </div>
                <div className="lh-mockup__card">
                  <div className="lh-mockup__card-icon lh-mockup__card-icon--green" />
                  <div>
                    <div className="lh-mockup__card-line" />
                    <div className="lh-mockup__card-line lh-mockup__card-line--sm" />
                  </div>
                </div>
                <div className="lh-mockup__card">
                  <div className="lh-mockup__card-icon lh-mockup__card-icon--purple" />
                  <div>
                    <div className="lh-mockup__card-line" />
                    <div className="lh-mockup__card-line lh-mockup__card-line--sm" />
                  </div>
                </div>
              </div>
              <div className="lh-mockup__chart">
                <div className="lh-mockup__bar" style={{ height: "40%" }} />
                <div className="lh-mockup__bar" style={{ height: "70%" }} />
                <div className="lh-mockup__bar" style={{ height: "55%" }} />
                <div className="lh-mockup__bar" style={{ height: "85%" }} />
                <div className="lh-mockup__bar" style={{ height: "60%" }} />
                <div className="lh-mockup__bar" style={{ height: "90%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="lh-hero__stats">
          {[
            { n: "100%", l: "Digital" },
            { n: "IA", l: "Integrada" },
            { n: "OCR", l: "Automático" },
            { n: "24/7", l: "Disponível" },
          ].map((s, i) => (
            <div key={i} className="lh-stat">
              <strong>{s.n}</strong>
              <span>{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────── */}
      <section className="lh-features">
        <div className="lh-section-label">Funcionalidades</div>
        <h2 className="lh-section-title">Tudo que você precisa num só lugar</h2>
        <p className="lh-section-sub">
          Tecnologia de ponta para simplificar sua relação com documentos de saúde
        </p>
        <div className="lh-features__grid">
          <FeatureCard delay="0ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            }
            title="Digitalização Inteligente"
            desc="Fotografe seus documentos físicos e nossa IA extrai automaticamente todas as informações com OCR avançado."
          />
          <FeatureCard delay="80ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            }
            title="Organização Automática"
            desc="Exames, receitas e documentos clínicos categorizados automaticamente, sempre fáceis de encontrar."
          />
          <FeatureCard delay="160ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
            title="Relatórios Médicos"
            desc="Visualize medicamentos mais usados, histórico de exames e tendências de saúde em um painel completo."
          />
          <FeatureCard delay="240ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Ficha Médica Completa"
            desc="Alergias, condições crônicas, histórico familiar — tudo registrado e acessível para qualquer consulta."
          />
          <FeatureCard delay="320ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            title="Busca Rápida"
            desc="Encontre qualquer documento, medicamento ou resultado de exame em segundos com busca inteligente."
          />
          <FeatureCard delay="400ms"
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            }
            title="Compartilhamento Seguro"
            desc="Compartilhe seu histórico com médicos e especialistas de forma rápida e com total privacidade."
          />
        </div>
      </section>

      {/* ── Como funciona ────────────────────── */}
      <section className="lh-how">
        <div className="lh-how__inner">
          <div className="lh-how__text">
            <div className="lh-section-label">Como funciona</div>
            <h2 className="lh-section-title lh-section-title--left">
              Em 3 passos simples
            </h2>
            <div className="lh-steps">
              <StepCard num="01" title="Crie sua conta"
                desc="Cadastre-se gratuitamente com email e senha. Em menos de 1 minuto você já está dentro." />
              <StepCard num="02" title="Adicione seus documentos"
                desc="Faça upload de fotos ou PDFs. Nossa IA lê e classifica automaticamente cada documento." />
              <StepCard num="03" title="Acesse em qualquer lugar"
                desc="Veja seu histórico completo, relatórios e fichas médicas de qualquer dispositivo." />
            </div>
          </div>
          <div className="lh-how__visual">
            <div className="lh-phone">
              <div className="lh-phone__notch" />
              <div className="lh-phone__screen">
                <div className="lh-phone__bar" />
                <div className="lh-phone__item">
                  <div className="lh-phone__dot lh-phone__dot--blue" />
                  <div className="lh-phone__lines">
                    <div className="lh-phone__line" />
                    <div className="lh-phone__line lh-phone__line--sm" />
                  </div>
                  <div className="lh-phone__tag">Exame</div>
                </div>
                <div className="lh-phone__item">
                  <div className="lh-phone__dot lh-phone__dot--green" />
                  <div className="lh-phone__lines">
                    <div className="lh-phone__line" />
                    <div className="lh-phone__line lh-phone__line--sm" />
                  </div>
                  <div className="lh-phone__tag lh-phone__tag--green">Receita</div>
                </div>
                <div className="lh-phone__item">
                  <div className="lh-phone__dot lh-phone__dot--orange" />
                  <div className="lh-phone__lines">
                    <div className="lh-phone__line" />
                    <div className="lh-phone__line lh-phone__line--sm" />
                  </div>
                  <div className="lh-phone__tag lh-phone__tag--orange">Clínico</div>
                </div>
                <div className="lh-phone__chart-mini">
                  <div className="lh-phone__bar-mini" style={{ height: "60%" }} />
                  <div className="lh-phone__bar-mini" style={{ height: "80%" }} />
                  <div className="lh-phone__bar-mini" style={{ height: "45%" }} />
                  <div className="lh-phone__bar-mini" style={{ height: "95%" }} />
                  <div className="lh-phone__bar-mini" style={{ height: "70%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────── */}
      <section className="lh-cta">
        <div className="lh-cta__bg" />
        <div className="lh-cta__content">
          <h2 className="lh-cta__title">Comece a cuidar melhor da sua saúde</h2>
          <p className="lh-cta__sub">Crie sua conta gratuitamente e organize todos os seus documentos médicos hoje mesmo.</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer className="lh-footer">
        <div className="lh-footer__inner">
          <div className="lh-footer__brand">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#2563eb" />
              <path d="M16 24s-9-6.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 5.5-9 12-11 12z" fill="#fff" opacity=".9" />
            </svg>
            <span>SaúdeMemora</span>
          </div>
          <p className="lh-footer__copy">© 2025 SaúdeMemora. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;