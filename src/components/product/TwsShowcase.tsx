"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Radio,
  Volume2,
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export function TwsShowcase() {
  const [isTwsActive, setIsTwsActive] = useState(true);

  return (
    <section className="hidden md:block relative overflow-hidden border-t border-border bg-background px-6 py-24 md:px-12 md:py-32">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl transition-all duration-700"
        style={{
          background: isTwsActive
            ? "radial-gradient(circle, oklch(0.72 0.19 190), oklch(0.65 0.26 355))"
            : "radial-gradient(circle, oklch(0.72 0.19 190), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-mono tracking-[0.25em] text-muted-foreground uppercase">
              True Wireless Stereo
            </p>
            <h2 className="mt-2 text-3xl font-semibold md:text-5xl">
              Dual speaker <span className="text-spectrum">360° sound</span>.
            </h2>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Pair two Deal Drip speakers wirelessly for true Left &amp; Right channel separation.
          </p>
        </div>

        {/* Interactive Mode Switcher */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 p-4 backdrop-blur-sm sm:flex-row sm:p-6">
          <div className="flex items-center gap-3">
            <Sliders className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Interactive Audio Mode Preview
              </p>
              <p className="text-sm font-medium text-foreground">
                {isTwsActive
                  ? "TWS Dual Mode: 2x Speakers (True L / R Stereo • 30W Peak)"
                  : "Single Speaker Mode: 1x Speaker (Mono Output • 15W)"}
              </p>
            </div>
          </div>

          <div className="flex rounded-lg border border-border bg-background/80 p-1">
            <button
              onClick={() => setIsTwsActive(false)}
              className={`cursor-pointer px-4 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-all ${
                !isTwsActive
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              1 Unit (Mono)
            </button>
            <button
              onClick={() => setIsTwsActive(true)}
              className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-all ${
                isTwsActive
                  ? "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              2 Units (TWS Stereo)
            </button>
          </div>
        </div>

        {/* Dual Speaker Visualizer Stage */}
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-card/40 p-8 md:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/40 via-transparent to-transparent pointer-events-none" />

          {/* Sync Status Badge */}
          <div className="relative z-10 flex justify-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-mono tracking-wider transition-all duration-500 ${
                isTwsActive
                  ? "border-accent/40 bg-accent/10 text-foreground shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.2)]"
                  : "border-border bg-background/80 text-muted-foreground"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isTwsActive ? "bg-accent animate-ping" : "bg-muted-foreground"
                }`}
              />
              {isTwsActive
                ? "TWS SYNC ACTIVE • 5.0 DUAL LINK • ZERO LATENCY"
                : "SINGLE UNIT ACTIVE • MONO SOUNDSTAGE"}
            </span>
          </div>

          {/* Speakers Stage Grid */}
          <div className="relative z-10 mt-10 grid gap-8 md:grid-cols-2 md:gap-12">
            {/* Left Speaker Node */}
            <div
              className={`relative flex flex-col items-center justify-between rounded-xl border p-8 transition-all duration-700 ${
                isTwsActive
                  ? "border-accent/50 bg-background/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  : "border-border bg-background/90"
              }`}
            >
              {/* Speaker Header */}
              <div className="flex w-full items-center justify-between">
                <span className="rounded bg-secondary px-2.5 py-1 text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                  {isTwsActive ? "Left Channel (L)" : "Main Speaker"}
                </span>
                <span className="text-xs font-semibold text-accent">
                  {isTwsActive ? "Master Unit" : "Standalone"}
                </span>
              </div>

              {/* Speaker Visual Representation */}
              <div className="relative my-8 flex h-44 w-44 items-center justify-center">
                {/* Acoustic Sound Waves */}
                <div
                  className={`absolute inset-0 rounded-full border border-accent/30 ${
                    isTwsActive ? "animate-ping opacity-30" : "opacity-0"
                  }`}
                  style={{ animationDuration: "2.4s" }}
                />
                <div
                  className={`absolute -inset-4 rounded-full border border-accent/20 ${
                    isTwsActive ? "animate-ping opacity-20" : "opacity-0"
                  }`}
                  style={{ animationDuration: "3.2s" }}
                />

                {/* Speaker Body Representation */}
                <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-3xl border border-border bg-secondary/80 p-4 shadow-inner">
                  {/* RGB Glow Halo */}
                  <div
                    className="absolute inset-2 rounded-2xl opacity-60 blur-md transition-all duration-700"
                    style={{
                      backgroundImage: "var(--spectrum)",
                    }}
                  />
                  {/* Digital Clock Display Mock */}
                  <div className="relative z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 px-4 py-2 border border-border/50">
                    <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                      12:45
                    </span>
                    <span className="text-[9px] tracking-widest text-accent uppercase">
                      {isTwsActive ? "CH • LEFT" : "STANDALONE"}
                    </span>
                  </div>

                  {/* 15W Qi Charging Top Pad Indicator */}
                  <div className="relative z-10 mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3 text-chart-2" />
                    <span>15W Qi Ready</span>
                  </div>
                </div>
              </div>

              {/* Equalizer Waveform Bars */}
              <div className="flex h-10 w-full items-end justify-center gap-1.5 px-4">
                {[40, 75, 90, 60, 100, 80, 50, 95, 70, 85, 45, 65].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-accent transition-all duration-300"
                    style={{
                      height: `${h}%`,
                      opacity: isTwsActive ? 0.9 : 0.4,
                      animation: "spectrum-pan 6s infinite ease-in-out",
                    }}
                  />
                ))}
              </div>

              <p className="mt-4 text-xs font-mono text-muted-foreground">
                {isTwsActive ? "Left Audio Track • 15W Acoustic Driver" : "Mono Mix • 15W Driver"}
              </p>
            </div>

            {/* Right Speaker Node */}
            <div
              className={`relative flex flex-col items-center justify-between rounded-xl border p-8 transition-all duration-700 ${
                isTwsActive
                  ? "border-accent/50 bg-background/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-100 scale-100"
                  : "border-dashed border-border/40 bg-secondary/10 opacity-40 scale-95"
              }`}
            >
              {/* Speaker Header */}
              <div className="flex w-full items-center justify-between">
                <span className="rounded bg-secondary px-2.5 py-1 text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
                  {isTwsActive ? "Right Channel (R)" : "Secondary Unit (Off)"}
                </span>
                <span className="text-xs font-semibold text-chart-2">
                  {isTwsActive ? "Synced Slave Unit" : "Not Connected"}
                </span>
              </div>

              {/* Speaker Visual Representation */}
              <div className="relative my-8 flex h-44 w-44 items-center justify-center">
                {/* Acoustic Sound Waves */}
                {isTwsActive && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full border border-chart-2/30 animate-ping opacity-30"
                      style={{ animationDuration: "2.4s", animationDelay: "0.4s" }}
                    />
                    <div
                      className="absolute -inset-4 rounded-full border border-chart-2/20 animate-ping opacity-20"
                      style={{ animationDuration: "3.2s", animationDelay: "0.6s" }}
                    />
                  </>
                )}

                {/* Speaker Body Representation */}
                <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-3xl border border-border bg-secondary/80 p-4 shadow-inner">
                  {/* RGB Glow Halo */}
                  <div
                    className={`absolute inset-2 rounded-2xl blur-md transition-all duration-700 ${
                      isTwsActive ? "opacity-60" : "opacity-10"
                    }`}
                    style={{
                      backgroundImage: "var(--spectrum)",
                    }}
                  />
                  {/* Digital Clock Display Mock */}
                  <div className="relative z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 px-4 py-2 border border-border/50">
                    <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                      12:45
                    </span>
                    <span className="text-[9px] tracking-widest text-chart-2 uppercase">
                      {isTwsActive ? "CH • RIGHT" : "INACTIVE"}
                    </span>
                  </div>

                  {/* 15W Qi Charging Top Pad Indicator */}
                  <div className="relative z-10 mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3 text-chart-2" />
                    <span>15W Qi Ready</span>
                  </div>
                </div>
              </div>

              {/* Equalizer Waveform Bars */}
              <div className="flex h-10 w-full items-end justify-center gap-1.5 px-4">
                {[65, 45, 85, 70, 95, 50, 80, 100, 60, 90, 75, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-chart-2 transition-all duration-300"
                    style={{
                      height: isTwsActive ? `${h}%` : "4px",
                      opacity: isTwsActive ? 0.9 : 0.2,
                    }}
                  />
                ))}
              </div>

              <p className="mt-4 text-xs font-mono text-muted-foreground">
                {isTwsActive
                  ? "Right Audio Track • 15W Acoustic Driver"
                  : "Enable TWS mode to activate 2nd speaker"}
              </p>
            </div>
          </div>

          {/* Central Wireless Bridge Callout */}
          {isTwsActive && (
            <div className="relative z-10 mt-8 rounded-lg border border-border/60 bg-background/60 p-4 text-center backdrop-blur-md">
              <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
                <span className="text-accent font-semibold">TRUE STEREO STAGE:</span> 30W Combined
                Power • 2x 15W Wireless Qi Pads • Synchronized Spectrum RGB Lighting
              </p>
            </div>
          )}
        </div>

        {/* 3-Step TWS Pairing Guide */}
        <div className="mt-16">
          <div className="text-center md:text-left">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Effortless Setup
            </p>
            <h3 className="mt-2 text-2xl font-semibold md:text-3xl">
              How to pair 2 Deal Drip speakers in 3 seconds
            </h3>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Power On Both Units",
                desc: "Turn on both Deal Drip speakers. Both will automatically enter Bluetooth standby mode with ambient lights ready.",
                icon: Radio,
              },
              {
                step: "02",
                title: "Double-Tap 'M' Button",
                desc: "Double-click the Mode / Play button on either speaker. You will hear an instant chime confirming TWS stereo synchronization.",
                icon: Layers,
              },
              {
                step: "03",
                title: "Connect & Play",
                desc: "Open Bluetooth on your phone, tablet or TV, select 'Deal Drip', and experience synchronized 360° dual stereo sound.",
                icon: Volume2,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="group relative rounded-xl border border-border bg-background p-8 transition-all hover:border-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-bold text-accent">{s.step}</span>
                    <div className="rounded-lg border border-border bg-secondary/50 p-2.5 text-foreground transition-colors group-hover:border-accent/40">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <h4 className="mt-6 text-lg font-semibold">{s.title}</h4>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWS Advantages Grid */}
        <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-background p-6">
            <div className="flex items-center gap-2 text-accent">
              <CheckCircle2 className="h-4 w-4" />
              <h5 className="font-semibold text-sm">True L/R Separation</h5>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Distinct directional channels give music, movies, and podcasts real acoustic depth.
            </p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center gap-2 text-chart-2">
              <CheckCircle2 className="h-4 w-4" />
              <h5 className="font-semibold text-sm">30W Combined Output</h5>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Fills bedrooms, living rooms, and studio desks with punchy bass and crystal highs.
            </p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center gap-2 text-chart-3">
              <CheckCircle2 className="h-4 w-4" />
              <h5 className="font-semibold text-sm">Synchronized RGB</h5>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Both ambient LED light halos cycle together in harmony across 7 vibrant colour modes.
            </p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center gap-2 text-chart-4">
              <CheckCircle2 className="h-4 w-4" />
              <h5 className="font-semibold text-sm">10m Wireless Distance</h5>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Place one on your bedside table and one across the room with zero cables needed.
            </p>
          </div>
        </div>

        {/* Twin Pack Special Promotion Banner (Buy 2 for Rs. 6,000) */}
        <div className="relative mt-16 overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-r from-card via-secondary/60 to-card p-8 md:p-12">
          <div className="rule-spectrum absolute inset-x-0 top-0 h-1" />

          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-chart-2/40 bg-chart-2/10 px-3 py-1 text-xs font-mono text-chart-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                SPECIAL TWS TWIN-PACK DEAL
              </div>
              <h3 className="text-2xl font-semibold md:text-4xl">
                Get 2 Units for <span className="text-spectrum">Rs. 6,000</span>
              </h3>
              <p className="max-w-xl text-sm text-muted-foreground">
                Save <strong className="text-foreground">Rs. 1,000</strong> when you order the
                TWS Stereo Pair bundle (Rs. 3,500 each individually). Perfect for your bedside
                pair or living room stereo setup!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link
                href="/checkout?plan=duo"
                className="flex items-center justify-center gap-2 bg-foreground px-8 py-4 text-xs font-semibold tracking-[0.2em] text-background uppercase transition-transform hover:scale-105 active:scale-95"
              >
                <span>Claim Duo Deal (Rs. 6,000)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
