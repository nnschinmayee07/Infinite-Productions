/**
 * Infinite Productions — Interactive Identity
 * Stack: React 19 · Framer Motion · Lenis · lottie-react · Tailwind v4
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useInView,
  animate,
} from "framer-motion";
import {
  ArrowUpRight,
  Cloud,
  Disc3,
  Instagram,
  Mail,
  MessageCircle,
  Music2,
  Youtube,
} from "lucide-react";
import Lottie from "lottie-react";
import "./styles.css";

/* ═══════════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const LINKS = [
  { label: "Instagram",  kicker: "@finitetroubles",            icon: Instagram,     href: "https://www.instagram.com/finitetroubles/",                               color: "#c77dff" },
  { label: "YouTube",    kicker: "@finitetroubles",            icon: Youtube,       href: "https://www.youtube.com/@finitetroubles",                                 color: "#ff4d4d" },
  { label: "SoundCloud", kicker: "finite-628801807",           icon: Cloud,         href: "https://soundcloud.com/finite-628801807",                                 color: "#ff9500" },
  { label: "Boombox",    kicker: "portfolio",                  icon: Disc3,         href: "https://app.boombox.io/app/files/dz7QboADOjPlZEM0WRDkdVRypWJ61qmxM",     color: "#73d9dc" },
  { label: "Email",      kicker: "finiprod.connect@gmail.com", icon: Mail,          href: "mailto:finiprod.connect@gmail.com",                                       color: "#a8dadc" },
  { label: "Discord",    kicker: "@sarah150724",               icon: MessageCircle, href: "https://discord.com/",                                                    color: "#7289da" },
];

const FREQUENCIES = [
  "TRAP", "AMBIENT", "CINEMATIC", "DRILL",
  "ELECTRONIC", "DARK R&B", "ORCHESTRAL", "HYPERPOP", "SOUL", "EXPERIMENTAL",
];

const EASE_EXPO = [0.16, 1, 0.3, 1];

/* ═══════════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Updates CSS vars --cx/--cy on <main> via ref — zero re-renders */
function useCursorRef(mainRef) {
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let ticking = false;
    const onMove = (e) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        el.style.setProperty("--cx", `${(e.clientX / window.innerWidth)  * 100}%`);
        el.style.setProperty("--cy", `${(e.clientY / window.innerHeight) * 100}%`);
        ticking = false;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mainRef]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ClipReveal — wraps children in overflow:hidden so content slides up
 * into view from below, creating a clean "newspaper reveal" effect.
 */
function ClipReveal({ children, delay = 0, className = "" }) {
  // Observe the OUTER div — the inner is clipped so IntersectionObserver
  // never detects it entering the viewport while y is 100%.
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -60px 0px" });

  return (
    <div ref={ref} className={`clip-wrap ${className}`}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{ delay, duration: 0.85, ease: EASE_EXPO }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * AnimatedCount — counts up from 0 to target when the element enters view.
 * Uses IntersectionObserver so it fires exactly once on first visibility.
 */
function AnimatedCount({ target, prefix = "0" }) {
  const ref = useRef(null);
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => `${prefix}${Math.floor(v)}`);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate(count, target, { duration: 1.4, ease: "easeOut" });
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [count, target]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BACKGROUND LAYER
   ═══════════════════════════════════════════════════════════════════════════ */

function LottieBackground() {
  const [animData, setAnimData] = useState(null);
  const { scrollYProgress } = useScroll();
  const rawOp = useTransform(scrollYProgress, [0, 0.05, 0.6, 0.85, 1], [0, 0.24, 0.19, 0.13, 0.09]);
  const opacity = useSpring(rawOp, { stiffness: 28, damping: 42 });

  useEffect(() => {
    fetch("/assets/record-player.json")
      .then((r) => r.json())
      .then(setAnimData)
      .catch(() => {});
  }, []);

  if (!animData) return null;
  return (
    <motion.div className="lottie-bg" style={{ opacity }}>
      <Lottie
        animationData={animData}
        loop
        autoplay
        className="lottie-bg-player"
        rendererSettings={{ preserveAspectRatio: "xMidYMid slice", progressiveLoad: true }}
      />
    </motion.div>
  );
}

function AtmosphereCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    let raf, timeout, frame = 0, W = 0, H = 0;
    let wisps = [], particles = [];

    const buildWisps = () => {
      wisps = Array.from({ length: 14 }, (_, i) => ({
        lane: i / 14,
        radiusFactor: 0.11 + (i % 5) * 0.018,
        hue: i % 3 === 0 ? 182 : i % 3 === 1 ? 268 : 208,
        alpha: 0.038 + (i % 4) * 0.008,
        speedX: 0.48 + (i % 3) * 0.11,
        speedY: 0.62 + (i % 4) * 0.08,
        phaseX: i * 0.9,
        phaseY: i * 0.65,
      }));
    };
    const buildParticles = () => {
      particles = Array.from({ length: 28 }, (_, i) => ({
        x: Math.random(), y: Math.random(),
        size: 0.5 + Math.random() * 1.0,
        speed: 0.0001 + Math.random() * 0.00014,
        drift: (Math.random() - 0.5) * 0.00006,
        opacity: 0.12 + Math.random() * 0.20,
        hue: i % 3 === 0 ? 182 : 268,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      buildWisps(); buildParticles();
    };
    const drawWisp = (x, y, r, hue, alpha) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0,   `hsla(${hue},68%,64%,${alpha})`);
      g.addColorStop(0.4, `hsla(${hue + 20},44%,30%,${alpha * 0.26})`);
      g.addColorStop(1,   "hsla(250,55%,6%,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    };
    const render = () => {
      frame += 0.005;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const w of wisps) {
        const x = W * (0.06 + ((w.lane * 1.76 + Math.sin(frame * w.speedX + w.phaseX) * 0.07) % 0.92));
        const y = H * (0.08 + ((w.lane * 0.86 + Math.cos(frame * w.speedY + w.phaseY) * 0.09) % 0.88));
        drawWisp(x, y, W * w.radiusFactor, w.hue, w.alpha);
      }
      ctx.globalCompositeOperation = "source-over";
      for (const p of particles) {
        p.y -= p.speed; p.x += p.drift;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02)  p.x = -0.02;
        const pulse = Math.sin(frame * 2.8 + p.phase) * 0.5 + 0.5;
        ctx.globalAlpha = p.opacity * (0.5 + pulse * 0.5);
        ctx.fillStyle = `hsl(${p.hue},70%,72%)`;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      timeout = setTimeout(() => { raf = requestAnimationFrame(render); }, 33);
    };
    resize(); render();
    window.addEventListener("resize", resize, { passive: true });
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="atmo-canvas" aria-hidden="true" />;
}

function BackgroundDisc() {
  const { scrollYProgress } = useScroll();
  const tilt    = useSpring(useTransform(scrollYProgress, [0, 1], [12, -8]),  { stiffness: 18, damping: 38, mass: 1.2 });
  const discY   = useSpring(useTransform(scrollYProgress, [0, 1], [0, 60]),   { stiffness: 18, damping: 38, mass: 1.2 });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.06, 0.55, 0.9, 1], [0, 0.7, 0.45, 0.6, 0.4]), { stiffness: 22, damping: 42 });
  const discSpin = useMotionValue(0);
  useEffect(() => {
    const c = animate(discSpin, 360, { duration: 18, ease: "linear", repeat: Infinity, repeatType: "loop" });
    return c.stop;
  }, [discSpin]);
  return (
    <motion.div
      className="bg-disc-scene"
      style={{ opacity, y: discY }}
      initial={{ opacity: 0, scale: 0.88, y: 80 }}
      animate={{ opacity: 0.7, scale: 1, y: 0 }}
      transition={{ duration: 1.8, ease: EASE_EXPO, delay: 0.2 }}
    >
      <motion.div className="bg-disc-tilt" style={{ rotateY: tilt }}>
        <motion.div className="bg-disc-body" style={{ rotate: discSpin }}>
          <div className="bg-disc-grooves" />
        </motion.div>
        <div className="bg-disc-sheen" />
        <div className="bg-disc-label">
          <img src="/assets/logo/infinity-mark.png" alt="" aria-hidden="true" />
        </div>
        <div className="bg-disc-edge" />
        <div className="bg-disc-shadow" />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHROME LAYER  (Logo, Freq bars, Scroll cue)
   ═══════════════════════════════════════════════════════════════════════════ */

function LogoMark() {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <motion.div
      className="logo-mark"
      initial={{ opacity: 0, scale: 0.78, filter: "blur(14px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.2, ease: EASE_EXPO, delay: 0.1 }}
    >
      <div className="logo-mark-ring" />
      {!imgFailed
        ? <img src="/assets/logo/infinity-mark.png" alt="Infinite Productions mark" onError={() => setImgFailed(true)} />
        : <Music2 aria-hidden="true" strokeWidth={1.2} />}
    </motion.div>
  );
}

function FrequencyBars() {
  return (
    <div className="freq-bars" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => <span key={i} style={{ "--bar": i }} />)}
    </div>
  );
}

function ScrollCue() {
  return (
    <motion.div
      className="scroll-cue"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 1.0 }}
      aria-hidden="true"
    >
      <span>Scroll</span>
      <i />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAGNETIC LINK TILE
   ═══════════════════════════════════════════════════════════════════════════ */

function MagneticLink({ item, index }) {
  const ref     = useRef(null);
  const x       = useMotionValue(0);
  const y       = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 28, mass: 0.22 });
  const springY = useSpring(y, { stiffness: 220, damping: 28, mass: 0.22 });
  const Icon    = item.icon;

  /* Subtle 3D tilt driven by cursor position inside the tile */
  const rotateX = useSpring(useMotionValue(0), { stiffness: 260, damping: 30 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 260, damping: 30 });

  const handleMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const ny = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    x.set(nx * rect.width  * 0.06);
    y.set(ny * rect.height * 0.07);
    rotateX.set(-ny * 4);
    rotateY.set( nx * 5);
  }, [x, y, rotateX, rotateY]);

  const handleLeave = useCallback(() => {
    x.set(0); y.set(0); rotateX.set(0); rotateY.set(0);
  }, [x, y, rotateX, rotateY]);

  /* Alternating enter direction: even from left, odd from right */
  const enterX = index % 2 === 0 ? -40 : 40;

  return (
    <motion.a
      ref={ref}
      className="link-tile"
      href={item.href}
      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
      rel={item.href.startsWith("mailto:")    ? undefined : "noreferrer"}
      style={{ x: springX, y: springY, rotateX, rotateY, "--accent": item.color }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      initial={{ opacity: 0, x: enterX, rotateY: index % 2 === 0 ? -10 : 10, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, x: 0, rotateY: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.07, duration: 0.75, ease: EASE_EXPO }}
    >
      <span className="tile-no">0{index + 1}</span>
      <span className="tile-icon"><Icon aria-hidden="true" strokeWidth={1.4} /></span>
      <span className="tile-copy">
        <span className="tile-label">{item.label}</span>
        <small>{item.kicker}</small>
      </span>
      <span className="tile-arrow-wrap">
        <ArrowUpRight className="tile-arrow" aria-hidden="true" strokeWidth={1.5} />
      </span>
    </motion.a>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION — HERO
   ═══════════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  const { scrollYProgress } = useScroll();
  const heroY        = useSpring(useTransform(scrollYProgress, [0, 0.35], ["0%", "-16%"]),  { stiffness: 38, damping: 50 });
  const titleScale   = useTransform(scrollYProgress, [0, 0.24], [1, 0.86]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.28], [1, 0.18]);

  return (
    <section className="hero-section">
      <motion.div className="hero-sticky" style={{ y: heroY }}>
        <FrequencyBars />

        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: EASE_EXPO, delay: 0.05 }}
        >
          Est. 2024 &nbsp;·&nbsp; Music Production Collective
        </motion.p>

        <motion.img
          className="hero-brand-lockup"
          src="/assets/logo/brand-lockup.png"
          alt="Infinite Productions"
          style={{ scale: titleScale, opacity: titleOpacity }}
          initial={{ opacity: 0, y: 56, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.08, duration: 1.2, ease: EASE_EXPO }}
        />

        <motion.h1
          className="hero-title"
          style={{ scale: titleScale, opacity: titleOpacity }}
          initial={{ opacity: 0, y: 56, filter: "blur(20px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.08, duration: 1.2, ease: EASE_EXPO }}
        >
          Infinite Productions
        </motion.h1>

        <motion.p
          className="tagline"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.9, ease: EASE_EXPO }}
        >
          Beats built in the dark.
          <br />
          Sounds that don't exist yet.
        </motion.p>

        <motion.p
          className="subtagline"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.9, ease: EASE_EXPO }}
        >
          FINITE crafts cinematic instrumentals, trap, ambient &amp; experimental
          productions — music for artists who move after dark.
        </motion.p>

        <ScrollCue />
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION — MARQUEE
   Scroll velocity shifts the playback speed so it feels physically alive.
   ═══════════════════════════════════════════════════════════════════════════ */

function MarqueeSection({ frequencies }) {
  return (
    <motion.section
      className="marquee-section"
      aria-label="Genres"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE_EXPO }}
    >
      <div className="marquee-track">
        {[...frequencies, ...frequencies].map((item, i) => (
          <span key={`${item}-${i}`}>{item}</span>
        ))}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION — PORTAL  (the "Find the signal" interactive block)

   Header: clip-reveals from below.
   Count: counts up when in view.
   Tiles: alternate left/right 3D entrance with perspective container.
   Section itself: scroll-linked Y parallax + scale pop on entry.
   ═══════════════════════════════════════════════════════════════════════════ */

function PortalSection() {
  return (
    <section className="portal-section">
      {/* ── Header ── */}
      <motion.div
        className="portal-header"
        initial={{ opacity: 0, y: 44 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.85, ease: EASE_EXPO }}
      >
        <div className="section-marker">
          <div className="section-marker-label-wrap">
            <ClipReveal>
              <p className="section-marker-label">Find the signal</p>
            </ClipReveal>
          </div>
          <motion.p
            className="section-marker-sub"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ delay: 0.28, duration: 0.6, ease: EASE_EXPO }}
          >
            Every channel. One frequency.
          </motion.p>
        </div>

        {/* Counting number */}
        <motion.span
          className="portal-count"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.55, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.12, duration: 0.95, ease: EASE_EXPO }}
        >
          <AnimatedCount target={LINKS.length} />
        </motion.span>
      </motion.div>

      {/* ── Tiles ── */}
      <div className="link-grid" style={{ perspective: "1400px" }}>
        {LINKS.map((item, i) => (
          <MagneticLink key={item.label} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION — STATEMENT
   Each line clip-reveals one by one from below.
   ═══════════════════════════════════════════════════════════════════════════ */

const STATEMENT_LINES = [
  { text: "Every beat",       outline: false },
  { text: "is a world",       outline: true  },
  { text: "waiting to open.", outline: false },
];

function StatementSection() {
  return (
    <section className="statement-section">
      <div className="statement-copy">
        {STATEMENT_LINES.map(({ text, outline }, i) => (
          <ClipReveal key={text} delay={i * 0.15} className={outline ? "statement-clip--outline" : ""}>
            <span className={`statement-line${outline ? " statement-line--outline" : ""}`}>
              {text}
            </span>
          </ClipReveal>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION — FINAL CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function FinalSection() {
  return (
    <section className="final-section">
      <motion.div
        className="final-card"
        initial={{ opacity: 0, scale: 0.88, y: 60, filter: "blur(24px)" }}
        whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.1, ease: EASE_EXPO }}
      >
        <div className="final-card-orbit" aria-hidden="true" />
        <div className="final-card-inner">
          <motion.p
            className="final-eyebrow"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE_EXPO }}
          >
            Open for collaboration
          </motion.p>
          <motion.img
            className="final-logo"
            src="/assets/logo/brand-lockup.png"
            alt="Infinite Productions"
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.28, duration: 0.8, ease: EASE_EXPO }}
          />
          <motion.p
            className="final-statement"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.38, duration: 0.7, ease: EASE_EXPO }}
          >
            Got a vision? Bring the concept.<br />
            FINITE brings the sound.
          </motion.p>
          <motion.a
            className="final-cta"
            href="mailto:finiprod.connect@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7, ease: EASE_EXPO }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Start a conversation
            <ArrowUpRight aria-hidden="true" strokeWidth={1.3} />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const mainRef = useRef(null);
  useCursorRef(mainRef);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 32, mass: 0.12 });

  const frequencies = useMemo(() => FREQUENCIES, []);

  return (
    <main ref={mainRef}>
      {/* ── Progress bar ── */}
      <motion.div className="progress-line" style={{ scaleX }} />

      {/* ── Background layers (z-index 0→4) ── */}
      <LottieBackground />
      <AtmosphereCanvas />
      <img className="motion-texture" src="/assets/motion/website.gif" alt="" aria-hidden="true" />
      <div className="fixed-haze" aria-hidden="true" />
      <div className="cursor-light" aria-hidden="true" />
      <BackgroundDisc />

      {/* ── Chrome (always on top of bg, below content) ── */}
      <LogoMark />

      {/* ── Content sections ── */}
      <HeroSection />
      <MarqueeSection frequencies={frequencies} />
      <PortalSection />
      <StatementSection />
      <FinalSection />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
