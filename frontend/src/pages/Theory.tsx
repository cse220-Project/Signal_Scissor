import { useState, useLayoutEffect, useRef, useCallback } from 'react';
import Card from '../components/ui/Card';
import Slider from '../components/ui/Slider';
import KaTeX from '../components/ui/KaTeX';

export default function Theory() {
  const [activeTab, setActiveTab] = useState<'principles' | 'simulations'>('principles');

  // ── Sim 1: Sampling & Aliasing ─────────────────────────
  const [fs, setFs] = useState(16);
  const [fSig, setFSig] = useState(5);
  const aliasingRef = useRef<HTMLCanvasElement>(null);

  // ── Sim 2: DFT Spectrum ────────────────────────────────
  const [dftFreq, setDftFreq] = useState(3);
  const [dftN, setDftN] = useState(32);
  const dftRef = useRef<HTMLCanvasElement>(null);

  // ── Sim 3: Echo / Convolution ──────────────────────────
  const [delayMs, setDelayMs] = useState(200);
  const [decayAlpha, setDecayAlpha] = useState(0.55);
  const [echoTaps, setEchoTaps] = useState(3);
  const echoRef = useRef<HTMLCanvasElement>(null);

  // ── Sim 4: SSB Frequency Shift ─────────────────────────
  const [shiftHz, setShiftHz] = useState(150);
  const [baseFreq, setBaseFreq] = useState(440);
  const ssbRef = useRef<HTMLCanvasElement>(null);

  // ── Sim 5: Spectral Subtraction ────────────────────────
  const [noiseLevel, setNoiseLevel] = useState(0.35);
  const [subStrength, setSubStrength] = useState(1.5);
  const [specFloor, setSpecFloor] = useState(0.02);
  const spectralRef = useRef<HTMLCanvasElement>(null);

  // ── Sim 6: Filter Response ─────────────────────────────
  const [filterLow, setFilterLow] = useState(300);
  const [filterHigh, setFilterHigh] = useState(3400);
  const [filterOp, setFilterOp] = useState<'cut' | 'keep'>('keep');
  const filterRef = useRef<HTMLCanvasElement>(null);

  const nyquist = fs / 2;
  const isAliased = fSig > nyquist;
  const fAlias = isAliased && fs > 0 ? Math.abs(fSig - Math.round(fSig / fs) * fs) : fSig;

  const getTheme = () => document.documentElement.classList.contains('dark');

  const drawAliasing = useCallback(() => {
    const canvas = aliasingRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    const N = 300;
    ctx.strokeStyle = dark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const t = i / N; const y = H / 2 - Math.sin(2 * Math.PI * fSig * t) * (H / 2 - 12);
      if (i === 0) ctx.moveTo(t * W, y); else ctx.lineTo(t * W, y);
    }
    ctx.stroke();
    if (isAliased) {
      ctx.strokeStyle = 'rgba(239,68,68,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const t = i / N; const y = H / 2 - Math.sin(2 * Math.PI * fAlias * t) * (H / 2 - 12);
        if (i === 0) ctx.moveTo(t * W, y); else ctx.lineTo(t * W, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    const stemCount = Math.min(Math.max(1, Math.round(fs)), 250);
    for (let i = 0; i <= stemCount; i++) {
      const t = fs > 0 ? i / stemCount : 0; const val = Math.sin(2 * Math.PI * fSig * t);
      const x = t * W; const baseY = H / 2; const tipY = baseY - val * (H / 2 - 12);
      ctx.strokeStyle = isAliased ? '#f87171' : '#34d399'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, tipY); ctx.stroke();
      ctx.fillStyle = isAliased ? '#f87171' : '#34d399';
      ctx.beginPath(); ctx.arc(x, tipY, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = txt; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`Continuous sine: ${fSig} Hz  |  Stems: sampled at fs=${fs} Hz`, 8, 14);
    if (isAliased) {
      ctx.fillStyle = '#f87171'; ctx.textAlign = 'right';
      ctx.fillText(`Alias folds to ${fAlias.toFixed(1)} Hz`, W - 8, 14);
    }
  }, [fs, fSig, isAliased, fAlias]);

  const drawDFT = useCallback(() => {
    const canvas = dftRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    const xn = Array.from({ length: dftN }, (_, n) => Math.sin(2 * Math.PI * dftFreq * n / dftN));
    const half = Math.floor(dftN / 2) + 1;
    const mag: number[] = [];
    for (let k = 0; k < half; k++) {
      let re = 0, im = 0;
      for (let n = 0; n < dftN; n++) {
        const a = -2 * Math.PI * k * n / dftN;
        re += xn[n] * Math.cos(a); im += xn[n] * Math.sin(a);
      }
      mag.push(Math.sqrt(re * re + im * im) / (dftN / 2));
    }
    const topH = Math.floor(H * 0.42); const divY = topH + 6;
    const botH = H - divY - 4;
    ctx.fillStyle = txt; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText(`x[n] = sin(2π·${dftFreq}/N·n),  N=${dftN}  →  time domain`, 6, 13);
    const centerY = topH / 2 + 18;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(W, centerY); ctx.stroke();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let n = 0; n < dftN; n++) {
      const x = (n / dftN) * W; const y = centerY - xn[n] * (topH / 2 - 8);
      if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = grid; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(0, divY); ctx.lineTo(W, divY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = txt; ctx.fillText('|X[k]| — DFT Magnitude Spectrum', 6, divY + 14);
    const specBase = divY + botH - 4;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, specBase); ctx.lineTo(W, specBase); ctx.stroke();
    const bw = W / half;
    for (let k = 0; k < half; k++) {
      const bh = mag[k] * (botH - 22);
      const x = k * bw;
      ctx.fillStyle = k === dftFreq ? '#fbbf24' : (dark ? 'rgba(52,211,153,0.7)' : 'rgba(5,150,105,0.7)');
      ctx.fillRect(x + 1, specBase - bh, bw - 2, bh);
      if (k === dftFreq || k % Math.max(1, Math.floor(half / 8)) === 0) {
        ctx.fillStyle = k === dftFreq ? '#fbbf24' : txt;
        ctx.font = k === dftFreq ? 'bold 10px IBM Plex Mono, monospace' : '9px IBM Plex Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`k=${k}`, x + bw / 2, specBase + 11);
      }
    }
  }, [dftFreq, dftN]);

  const drawEcho = useCallback(() => {
    const canvas = echoRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    const baseY = H - 30;
    const n0 = Math.round(delayMs / 1000 * 8000);
    const total = (echoTaps + 1) * n0 + 20;
    const sx = (W - 44) / total;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, baseY); ctx.lineTo(W - 8, baseY); ctx.stroke();
    ctx.fillStyle = txt; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText('n (sample index) →', 6, baseY + 16);
    ctx.fillText('h[n] ↑', 2, 14);
    const drawStem = (n: number, amp: number, color: string) => {
      const x = 24 + n * sx; const tipY = baseY - amp * (H - 56);
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, tipY); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, tipY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.font = 'bold 9px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(amp.toFixed(3), x, tipY - 8);
    };
    drawStem(0, 1.0, '#38bdf8');
    ctx.fillStyle = '#38bdf8'; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText('δ[n]', 24, baseY + 14);
    const colors = ['#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fb923c', '#f87171'];
    for (let m = 1; m <= echoTaps; m++) {
      const amp = Math.pow(decayAlpha, m);
      drawStem(m * n0, amp, colors[m - 1] || '#a78bfa');
      ctx.fillStyle = txt; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(`${m}n₀`, 24 + m * n0 * sx, baseY + 14);
    }
  }, [delayMs, decayAlpha, echoTaps]);

  const drawSSB = useCallback(() => {
    const canvas = ssbRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    const maxF = 100000; const midY = H / 2;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
    ctx.fillStyle = txt; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Frequency (Hz) →', W / 2, H - 5);
    const fToX = (f: number) => (Math.max(0, f) / maxF) * W;
    const spike = (freq: number, label: string, color: string, sublabel?: string) => {
      if (freq <= 0 || freq > maxF) return;
      const x = fToX(freq); const tipY = midY - (H / 2 - 20);
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, midY); ctx.lineTo(x, tipY); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, tipY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.font = 'bold 10px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(label, x, tipY - 9);
      if (sublabel) { ctx.font = '9px IBM Plex Mono, monospace'; ctx.fillText(sublabel, x, midY + 15); }
    };
    spike(baseFreq, `${baseFreq}Hz`, dark ? '#38bdf8' : '#0284c7', 'Original');
    spike(baseFreq + 200, `${baseFreq + 200}Hz`, 'rgba(56,189,248,0.5)');
    spike(baseFreq + 500, `${baseFreq + 500}Hz`, 'rgba(56,189,248,0.3)');
    const s = baseFreq + shiftHz;
    spike(s, `${s}Hz`, '#fbbf24', '← Shifted');
    spike(s + 200, `${s + 200}Hz`, 'rgba(251,191,36,0.5)');
    spike(s + 500, `${s + 500}Hz`, 'rgba(251,191,36,0.3)');
    if (s > 0 && s < maxF && baseFreq > 0) {
      const x1 = fToX(baseFreq); const x2 = fToX(Math.max(1, s));
      ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, midY - 28); ctx.lineTo(x2, midY - 28); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fbbf24'; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(`Δf=${shiftHz > 0 ? '+' : ''}${shiftHz}Hz`, (x1 + x2) / 2, midY - 34);
    }
  }, [baseFreq, shiftHz]);

  const drawSpectral = useCallback(() => {
    const canvas = spectralRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    const bins = 80; const baseY = H - 24; const bw = (W - 4) / bins;
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke();
    ctx.fillStyle = txt; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Frequency bins →', 4, H - 8);
    const rng = (s: number) => s + (Math.random() - 0.5) * 0.05;
    for (let k = 0; k < bins; k++) {
      const signal = 0.05 + 0.2 * Math.exp(-Math.pow((k - 15) / 5, 2))
        + 0.85 * Math.exp(-Math.pow((k - 35) / 4, 2))
        + 0.5 * Math.exp(-Math.pow((k - 60) / 6, 2));
      const noise = noiseLevel * (0.3 + 0.7 * rng(0.15));
      const noisy = signal + noise;
      const cleaned = Math.max(noisy - subStrength * noiseLevel, specFloor * noisy);
      const x = 2 + k * bw; const s = bw - 1;
      ctx.fillStyle = dark ? 'rgba(148,163,184,0.3)' : 'rgba(100,116,139,0.22)';
      ctx.fillRect(x, baseY - noisy * (H - 40), s, noisy * (H - 40));
      const cleanH = cleaned * (H - 40);
      ctx.fillStyle = k === 35 ? '#fbbf24' : (dark ? 'rgba(52,211,153,0.85)' : 'rgba(5,150,105,0.8)');
      ctx.fillRect(x, baseY - cleanH, s, cleanH);
    }
    ctx.fillStyle = dark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.5)';
    ctx.fillRect(6, 6, 12, 10);
    ctx.fillStyle = txt; ctx.font = '10px IBM Plex Mono, monospace'; ctx.textAlign = 'left';
    ctx.fillText('Noisy Y(f)', 22, 15);
    ctx.fillStyle = dark ? 'rgba(52,211,153,0.85)' : 'rgba(5,150,105,0.8)';
    ctx.fillRect(100, 6, 12, 10);
    ctx.fillStyle = txt; ctx.fillText('After Subtraction', 116, 15);
  }, [noiseLevel, subStrength, specFloor]);

  const drawFilter = useCallback(() => {
    const canvas = filterRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const dark = getTheme();
    ctx.fillStyle = dark ? '#0f172a' : '#f8fafc'; ctx.fillRect(0, 0, W, H);
    const grid = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const txt = dark ? 'rgba(255,255,255,0.5)' : '#64748b';
    const pad = { l: 44, r: 12, t: 16, b: 28 };
    const pH = H - pad.t - pad.b; const pW = W - pad.l - pad.r;
    const maxF = 100000;
    const fToX = (f: number) => pad.l + (Math.log10(Math.max(20, f)) - Math.log10(20)) / (Math.log10(maxF) - Math.log10(20)) * pW;
    [-60, -40, -20, 0].forEach(db => {
      const y = pad.t + (1 - (db + 60) / 60) * pH;
      ctx.strokeStyle = db === 0 ? (dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : grid;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = txt; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'right';
      ctx.fillText(`${db}`, pad.l - 4, y + 3);
    });
    [20, 100, 1000, 10000, 50000, 100000].forEach(f => {
      const x = fToX(f);
      ctx.strokeStyle = grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + pH); ctx.stroke();
      ctx.fillStyle = txt; ctx.font = '9px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x, H - 8);
    });
    ctx.beginPath();
    for (let i = 0; i <= 500; i++) {
      const f = 20 * Math.pow(maxF / 20, i / 500);
      const inBand = f >= filterLow && f <= filterHigh;
      const pass = filterOp === 'keep' ? inBand : !inBand;
      const db = pass ? 0 : -60;
      const x = fToX(f); const y = pad.t + (1 - (db + 60) / 60) * pH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = filterOp === 'keep' ? '#34d399' : '#f87171';
    ctx.lineWidth = 2.5; ctx.shadowColor = filterOp === 'keep' ? '#34d399' : '#f87171'; ctx.shadowBlur = 7;
    ctx.stroke(); ctx.shadowBlur = 0;
    const xL = fToX(filterLow); const xH = fToX(filterHigh);
    ctx.fillStyle = filterOp === 'keep' ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.10)';
    ctx.fillRect(xL, pad.t, xH - xL, pH);
    ctx.fillStyle = filterOp === 'keep' ? '#34d399' : '#f87171';
    ctx.font = 'bold 11px IBM Plex Mono, monospace'; ctx.textAlign = 'center';
    ctx.fillText(filterOp === 'keep' ? '— PASSBAND —' : '— STOPBAND —', (xL + xH) / 2, pad.t + 18);
  }, [filterLow, filterHigh, filterOp]);

  // ── Trigger draws whenever parameters change or tab switches to simulations ──
  useLayoutEffect(() => {
    if (activeTab === 'simulations') {
      let followUp = 0;
      const drawAll = () => {
        drawAliasing();
        drawDFT();
        drawEcho();
        drawSSB();
        drawSpectral();
        drawFilter();
      };
      const raf = requestAnimationFrame(() => {
        drawAll();
        followUp = requestAnimationFrame(drawAll);
      });
      return () => { cancelAnimationFrame(raf); cancelAnimationFrame(followUp); };
    }
  }, [activeTab, drawAliasing, drawDFT, drawEcho, drawSSB, drawSpectral, drawFilter]);

  const cvs: React.CSSProperties = { width: '100%', height: '200px', display: 'block', borderRadius: '0.75rem' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-28 select-none">

      {/* Header */}
      <div className="rounded-ios-2xl bg-secondary/80 border border-border p-6 md:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-semibold">
          <span className="material-symbols-outlined text-[16px]">school</span>
          DSP Academy — CSE 220 <span className="trademark-signal">SIGNAL</span>s &amp; Systems
        </div>
        <h1 className="text-[28px] md:text-[34px] leading-tight font-extrabold text-foreground tracking-tight">
          Mathematical Principles &amp; Interactive Lab
        </h1>
        <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
          Mathematical foundations powering <span className="trademark-signal">SIGNAL</span> Scissors — LaTeX formulas, theory-application connections, and 6 live interactive canvas simulations.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          {(['principles', 'simulations'] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-ios-lg text-[13px] font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab === 'principles' ? 'functions' : 'equalizer'}</span>
              {tab === 'principles' ? 'Mathematical Principles' : 'Interactive Simulations (6)'}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
          TAB 1 — PRINCIPLES
          ============================================================ */}
      {activeTab === 'principles' && (
        <div className="space-y-6">

          {/* 01: DFT */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-sky-500/10 text-sky-500 font-bold shrink-0 text-[14px]">01</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">Discrete Fourier Transform (DFT) &amp; Magnitude Spectrum</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: Spectrum graphs (Studio, Compare, Noise Remover), ΔdB plot, Spectrogram</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              The <strong className="text-foreground">DFT</strong> transforms your audio signal <KaTeX math="x[n]" /> from the time domain into complex frequency-domain bins <KaTeX math="X[k]" />. The magnitude <KaTeX math="|X[k]|" /> in dB is plotted on every spectrum graph in this app. On the Compare Inspector page, two DFT outputs — one for the original and one for the processed signal — are plotted together so you can see exactly which frequencies were cut, boosted, or preserved.
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Forward DFT:</span>
              <KaTeX math="X[k] = \sum_{n=0}^{N-1} x[n] \cdot e^{-j \frac{2\pi}{N} k n}, \quad k = 0, 1, \dots, N-1" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Inverse DFT — reconstruction after filtering:</span>
              <KaTeX math="x[n] = \frac{1}{N} \sum_{k=0}^{N-1} X[k] \cdot e^{j \frac{2\pi}{N} k n}" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Decibel Magnitude (Y-axis of all spectrum graphs):</span>
              <KaTeX math="|X[k]|_{\text{dB}} = 20 \log_{10}\!\left(\max(|X[k]|,\; 10^{-9})\right)" block />
            </div>
            <div className="p-4 bg-accent/40 border border-border rounded-ios-lg space-y-2">
              <span className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                Parseval's Theorem — Energy Conservation:
              </span>
              <KaTeX math="\sum_{n=0}^{N-1} |x[n]|^2 = \frac{1}{N} \sum_{k=0}^{N-1} |X[k]|^2" block />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Time-domain signal energy equals frequency-domain energy. The single-sided spectrum doubles interior positive bins (<KaTeX math="k = 1 \dots N/2-1" />) to compensate for discarding the mirrored negative-frequency half.
              </p>
            </div>
          </Card>

          {/* 02: Nyquist */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-amber-500/10 text-amber-500 font-bold shrink-0 text-[14px]">02</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">Nyquist–Shannon Sampling Theorem &amp; Aliasing</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: Dashboard sampling rate display, Mic Capture limit, Audio upload validation</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              To perfectly reconstruct an analog signal from its digital samples, the sampling rate <KaTeX math="f_s" /> must exceed twice the maximum signal frequency. If violated, high-frequency components "fold" into the audible spectrum as <strong className="text-foreground">aliasing artifacts</strong>. This app operates at 8000 Hz by default (telephone bandwidth) giving a 4000 Hz Nyquist limit.
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Nyquist Criterion:</span>
              <KaTeX math="f_s > 2 \cdot f_{\max} \quad \Leftrightarrow \quad f_{\text{Nyquist}} = \frac{f_s}{2}" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Aliased Apparent Frequency (when criterion is violated):</span>
              <KaTeX math="f_{\text{alias}} = \left| f_{\text{sig}} - \operatorname{round}\!\left(\frac{f_{\text{sig}}}{f_s}\right) \cdot f_s \right|" block />
            </div>
          </Card>

          {/* 03: LTI / Convolution */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-emerald-500/10 text-emerald-500 font-bold shrink-0 text-[14px]">03</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">LTI Systems, Convolution &amp; Acoustic Echo</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: FX Engine → Echo effect, Impulse Response Viewer, Spectrogram time-tails</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">Linear Time-Invariant (LTI)</strong> system is fully described by its impulse response <KaTeX math="h[n]" />. When you apply the Echo effect, your audio signal <KaTeX math="x[n]" /> is convolved with a multi-tap echo impulse response, producing decaying reflections. The Impulse Response Viewer in the Studio renders <KaTeX math="h[n]" /> as stem plots in real time as you adjust Echo Delay, Decay Factor, and Tap Count.
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Linear Convolution:</span>
              <KaTeX math="y[n] = (x * h)[n] = \sum_{k=-\infty}^{\infty} x[k] \cdot h[n - k]" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Multi-Tap Echo Impulse Response h[n]:</span>
              <KaTeX math="h[n] = \delta[n] + \sum_{m=1}^{M} \alpha^m \cdot \delta[n - m \cdot n_0]" block />
              <p className="text-[11px] text-muted-foreground">
                <KaTeX math="n_0 = \lfloor \frac{\text{delay\_ms}}{1000} \cdot f_s \rfloor" /> = sample delay offset, <KaTeX math="\alpha" /> = decay factor, <KaTeX math="M" /> = tap count.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">BIBO Stability Requirement:</span>
              <KaTeX math="\sum_{n=-\infty}^{\infty} |h[n]| < \infty \iff |\alpha| < 1" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Frequency Response of the Echo System:</span>
              <KaTeX math="H(e^{j\omega}) = 1 + \sum_{m=1}^{M} \alpha^m \cdot e^{-j m \omega n_0}" block />
            </div>
          </Card>

          {/* 04: SSB */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-amber-500/10 text-amber-500 font-bold shrink-0 text-[14px]">04</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">Analytic Signal &amp; SSB Pitch Shifting (Hilbert Modulation)</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: FX Engine → Frequency Shift slider, Voice Effects (Chipmunk +400Hz, Deep −300Hz)</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Naively multiplying by <KaTeX math="e^{j2\pi\Delta f t}" /> produces both upper and lower sidebands. To cleanly shift all frequencies by <KaTeX math="\Delta f" /> Hz without mirror artifacts, we construct an <strong className="text-foreground">analytic signal</strong> by zeroing all negative-frequency DFT bins (Hilbert transform), then apply complex modulation.
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Analytic Signal:</span>
              <KaTeX math="x_a[n] = x[n] + j \cdot \mathcal{H}\{x[n]\}" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Hilbert Spectral Mask (zeroes negative bins):</span>
              <KaTeX math="H_{\mathcal{H}}(e^{j\omega}) = \begin{cases} +1, & \omega = 0, \pi \\ +2, & 0 < \omega < \pi \\ 0, & -\pi < \omega < 0 \end{cases}" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">SSB Frequency-Shifted Output:</span>
              <KaTeX math="y[n] = \operatorname{Re}\!\left\{ x_a[n] \cdot e^{\,j 2\pi \Delta f \frac{n}{f_s}} \right\}" block />
            </div>
          </Card>

          {/* 05: Spectral Subtraction */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-purple-500/10 text-purple-400 font-bold shrink-0 text-[14px]">05</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">Spectral Subtraction Audio Denoising</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: Denoiser page — Spectral Subtraction mode; sliders map to α and β</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              The Denoiser estimates a noise power profile <KaTeX math="\hat{P}_n(f)" /> from initial silent audio frames. For each subsequent STFT frame of the noisy signal <KaTeX math="Y(f)" />, it subtracts the estimated noise magnitude. A <strong className="text-foreground">spectral floor</strong> <KaTeX math="\beta" /> prevents over-subtraction which creates "musical noise" (buzzing artifacts).
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Noise Profile Estimation (M silent frames):</span>
              <KaTeX math="\hat{P}_n(f) = \frac{1}{M} \sum_{m=1}^{M} |X_{\text{noise}}(m, f)|^2" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Over-Subtraction Rule with Spectral Floor:</span>
              <KaTeX math="|\hat{S}(f)| = \max\!\left( |Y(f)| - \alpha \cdot \sqrt{\hat{P}_n(f)},\; \beta \cdot |Y(f)| \right)" block />
              <p className="text-[11px] text-muted-foreground pt-1">
                <KaTeX math="\alpha \ge 1" /> = subtraction aggressiveness slider. <KaTeX math="\beta \approx 0.02" /> = spectral floor ratio preventing silence holes.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Reconstruction via ISTFT (phase preserved):</span>
              <KaTeX math="\hat{s}[n] = \text{ISTFT}\!\left\{ |\hat{S}(f)| \cdot e^{j\,\angle Y(f)} \right\}" block />
            </div>
          </Card>

          {/* 06: Band Filter */}
          <Card variant="surface" className="space-y-4 p-6">
            <div className="flex items-start gap-3 border-b border-border pb-3">
              <div className="p-2 rounded-ios-md bg-rose-500/10 text-rose-400 font-bold shrink-0 text-[14px]">06</div>
              <div>
                <h2 className="text-[18px] font-bold text-foreground">Fourier Frequency-Domain Band Filter</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Applied in: Studio Filter Controls (Bandpass / Bandcut / Attenuate), FX Engine Filter panel</p>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              SIGNAL Scissors implements <strong className="text-foreground">ideal frequency-domain filtering</strong>: compute the DFT, multiply by a binary (or soft) mask <KaTeX math="H[k]" />, then apply IDFT. This produces a perfect "brick-wall" filter — no ringing, no transition band. The active filter region is shown as a shaded zone on the Compare spectrum graph.
            </p>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Filter Mask H[k]:</span>
              <KaTeX math="H[k] = \begin{cases} 0 & \text{if CUT and } f_{\text{low}} \le f_k \le f_{\text{high}} \\ 1 & \text{if KEEP and } f_{\text{low}} \le f_k \le f_{\text{high}} \\ 1-\gamma & \text{if ATTENUATE (soft, }0<\gamma\le1\text{)} \\ \text{opposite} & \text{outside band} \end{cases}" block />
            </div>
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-foreground block">Filtered Output:</span>
              <KaTeX math="Y[k] = H[k] \cdot X[k] \;\Longrightarrow\; y[n] = \text{IDFT}\{Y[k]\}" block />
            </div>
          </Card>

        </div>
      )}

      {/* ============================================================
          TAB 2 — SIMULATIONS
          ============================================================ */}
      {activeTab === 'simulations' && (
        <div className="space-y-6">

          {/* Sim 1 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="flex items-start justify-between border-b border-border pb-3 gap-4">
              <div>
                <h3 className="text-[17px] font-bold text-foreground">Sim 1 — Nyquist Sampling &amp; Aliasing</h3>
                <p className="text-[12px] text-muted-foreground mt-1">Grey line = continuous signal. Coloured stems = sampled values. Red dashed = aliased phantom frequency when Nyquist is violated.</p>
              </div>
              <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-mono font-bold whitespace-nowrap ${isAliased ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                {isAliased ? '⚠ Aliasing!' : '✓ OK'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Slider label={<><span className="trademark-signal">SIGNAL</span> Frequency f_sig</>} value={fSig} min={0} max={100000} step={10} unit="Hz" onChange={setFSig} />
              <Slider label="Sampling Rate f_s" value={fs} min={0} max={100000} step={10} unit="Hz" onChange={setFs} />
            </div>
            <canvas ref={aliasingRef} width={700} height={200} style={cvs} />
            <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/80 rounded-ios-lg font-mono text-[12px]">
              <div><span className="text-muted-foreground block text-[10px] uppercase">Nyquist Limit</span><span className="font-semibold text-foreground">{nyquist} Hz</span></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase">fs &gt; 2·f_sig</span><span className={`font-semibold ${isAliased ? 'text-rose-400' : 'text-emerald-400'}`}>{fs} &gt; {2 * fSig}? {fs > 2 * fSig ? 'YES ✓' : 'NO ✗'}</span></div>
              <div><span className="text-muted-foreground block text-[10px] uppercase">Apparent Freq</span><span className={`font-semibold ${isAliased ? 'text-rose-400' : 'text-emerald-400'}`}>{fAlias.toFixed(1)} Hz</span></div>
            </div>
          </Card>

          {/* Sim 2 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-[17px] font-bold text-foreground">Sim 2 — DFT Magnitude Spectrum Visualizer</h3>
              <p className="text-[12px] text-muted-foreground mt-1">Top: discrete sine x[n] at bin k. Bottom: |X[k]| bars — the yellow highlighted bar shows the dominant frequency bin.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Slider label="Frequency Bin k" value={dftFreq} min={1} max={dftN / 2 - 1} step={1} onChange={setDftFreq} />
              <Slider label="DFT Length N" value={dftN} min={8} max={64} step={8} onChange={setDftN} />
            </div>
            <canvas ref={dftRef} width={700} height={220} style={{ ...cvs, height: '220px' }} />
            <div className="p-3 bg-secondary/80 rounded-ios-lg font-mono text-[12px] flex items-center justify-between">
              <span className="text-muted-foreground">Frequency resolution: Δf = f_s / {dftN}</span>
              <span className="font-semibold text-yellow-400">Spike at k={dftFreq} → f = {dftFreq}/{dftN}·f_s</span>
            </div>
          </Card>

          {/* Sim 3 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-[17px] font-bold text-foreground">Sim 3 — LTI Echo Impulse Response h[n]</h3>
              <p className="text-[12px] text-muted-foreground mt-1">Blue stem = original impulse δ[n]. Green/coloured stems = decaying echo taps. Your audio gets convolved with these exact stems.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Slider label="Echo Delay n₀" value={delayMs} min={50} max={500} step={25} unit="ms" onChange={setDelayMs} />
              <Slider label="Decay Factor α" value={decayAlpha} min={0.1} max={0.9} step={0.05} onChange={setDecayAlpha} />
              <Slider label="Tap Count M" value={echoTaps} min={1} max={6} step={1} onChange={setEchoTaps} />
            </div>
            <canvas ref={echoRef} width={700} height={200} style={cvs} />
            <div className="p-3 bg-secondary/80 rounded-ios-lg font-mono text-[11px] overflow-x-auto">
              <span className="text-muted-foreground block text-[10px] uppercase mb-1">h[n] expression</span>
              <span className="text-foreground font-semibold">δ[n] + {Array.from({ length: echoTaps }).map((_, i) => `${Math.pow(decayAlpha, i + 1).toFixed(3)}·δ[n–${(i + 1) * Math.round(delayMs / 1000 * 8000)}]`).join(' + ')}</span>
            </div>
          </Card>

          {/* Sim 4 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-[17px] font-bold text-foreground">Sim 4 — SSB Frequency Shift (Hilbert Modulation)</h3>
              <p className="text-[12px] text-muted-foreground mt-1">Blue spikes = original harmonics. Yellow spikes = SSB-shifted copies. Shift arrow shows Δf. No mirror sidebands appear.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Slider label="Base Frequency" value={baseFreq} min={0} max={100000} step={10} unit="Hz" onChange={setBaseFreq} />
              <Slider label="Frequency Shift Δf" value={shiftHz} min={0} max={100000} step={10} unit="Hz" onChange={setShiftHz} />
            </div>
            <canvas ref={ssbRef} width={700} height={200} style={cvs} />
            <div className="p-3 bg-secondary/80 rounded-ios-lg font-mono text-[12px] flex items-center justify-between">
              <span className="text-sky-400">Original: {baseFreq} Hz</span>
              <span className="text-muted-foreground">Δf = {shiftHz > 0 ? '+' : ''}{shiftHz} Hz</span>
              <span className="text-yellow-400">Shifted: {baseFreq + shiftHz} Hz</span>
            </div>
          </Card>

          {/* Sim 5 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-[17px] font-bold text-foreground">Sim 5 — Spectral Subtraction Denoiser</h3>
              <p className="text-[12px] text-muted-foreground mt-1">Grey bars = noisy input Y(f). Green bars = cleaned spectrum after subtraction. Increase noise to see more removed. Spectral floor prevents over-subtraction holes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Slider label="Noise Level σ" value={noiseLevel} min={0} max={0.8} step={0.05} onChange={setNoiseLevel} />
              <Slider label="Subtraction α" value={subStrength} min={1} max={3} step={0.1} onChange={setSubStrength} />
              <Slider label="Spectral Floor β" value={specFloor} min={0.005} max={0.1} step={0.005} onChange={setSpecFloor} />
            </div>
            <canvas ref={spectralRef} width={700} height={200} style={cvs} />
            <div className="p-3 bg-secondary/80 rounded-ios-lg">
              <KaTeX math={`|\\hat{S}| = \\max\\!\\left(|Y| - ${subStrength.toFixed(1)} \\cdot \\sqrt{\\hat{P}_n},\\; ${specFloor.toFixed(3)} \\cdot |Y| \\right)`} block />
            </div>
          </Card>

          {/* Sim 6 */}
          <Card variant="surface" className="space-y-5 p-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-[17px] font-bold text-foreground">Sim 6 — Fourier Band Filter H(f)</h3>
              <p className="text-[12px] text-muted-foreground mt-1">Toggle KEEP/CUT and drag cutoff frequencies. The shaded region shows what is passed or blocked. This is exactly what the Studio Filter controls apply.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Slider label="Low Cutoff f_low" value={filterLow} min={0} max={Math.max(0, filterHigh - 10)} step={10} unit="Hz" onChange={setFilterLow} />
              <Slider label="High Cutoff f_high" value={filterHigh} min={Math.min(100000, filterLow + 10)} max={100000} step={10} unit="Hz" onChange={setFilterHigh} />
              <div className="flex items-end">
                <div className="flex rounded-xl overflow-hidden border border-border w-full">
                  <button onClick={() => setFilterOp('keep')} className={`flex-1 py-2.5 text-[12px] font-semibold transition-all ${filterOp === 'keep' ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}>KEEP (Bandpass)</button>
                  <button onClick={() => setFilterOp('cut')} className={`flex-1 py-2.5 text-[12px] font-semibold transition-all ${filterOp === 'cut' ? 'bg-rose-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}>CUT (Bandstop)</button>
                </div>
              </div>
            </div>
            <canvas ref={filterRef} width={700} height={200} style={cvs} />
            <div className="p-3 bg-secondary/80 rounded-ios-lg font-mono text-[12px] flex items-center justify-between">
              <span className="text-muted-foreground">Band: {filterLow}–{filterHigh} Hz ({filterHigh - filterLow} Hz wide)</span>
              <span className={filterOp === 'keep' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>{filterOp.toUpperCase()}</span>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
