"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScrollSequence } from "@/components/product/ScrollSequence";
import { ModelViewer3D } from "@/components/product/ModelViewer3D";
import { TwsShowcase } from "@/components/product/TwsShowcase";
import { Sparkles, ArrowRight, ShieldCheck, Check, Box, ShoppingBag } from "lucide-react";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Deal Drip 15W RGB Wireless Charging Bluetooth Speaker with TWS Stereo, Digital Clock & Alarm",
  image: [
    "https://lively-product-launch.lovable.app/__l5e/assets-v1/09bed847-6420-4f11-9498-e942207ff543/poster.jpg",
  ],
  description:
    "15W Qi wireless charging, Bluetooth 5.0 speaker with TWS True Wireless Stereo dual pairing, LED digital clock with dual alarms and RGB colour-cycling ambient light.",
  brand: { "@type": "Brand", name: "Deal Drip" },
  offers: [
    {
      "@type": "Offer",
      name: "Single Unit",
      price: "3500",
      priceCurrency: "NPR",
      availability: "https://schema.org/InStock",
      url: "https://www.daraz.com.np/products/-i1543733289-s12360955990.html",
    },
    {
      "@type": "Offer",
      name: "TWS Stereo Duo Pack (2 Units)",
      price: "6000",
      priceCurrency: "NPR",
      availability: "https://schema.org/InStock",
      url: "https://www.daraz.com.np/products/-i1543733289-s12360955990.html",
    },
  ],
};

const CAPTIONS = [
  {
    at: 0.15,
    kicker: "01 — Light",
    title: "RGB glow, seven ways",
    body: "A colour-cycling LED ring wraps the body — pick a single shade or let it breathe slowly through the spectrum as a night light.",
  },
  {
    at: 0.32,
    kicker: "02 — Power",
    title: "15W wireless charging",
    body: "Set any Qi phone on the top pad and it charges at up to 15W. Foreign-object detection keeps things cool and safe overnight.",
  },
  {
    at: 0.58,
    kicker: "03 — Time",
    title: "Digital clock & dual alarm",
    body: "A bright LED display shows time, date and temperature, with two independent alarms and adjustable brightness for the dark.",
  },
  {
    at: 0.82,
    kicker: "04 — Sound & TWS",
    title: "Bluetooth 5.0 & TWS Stereo",
    body: "A full-range driver with rich bass and True Wireless Stereo (TWS) pairing. Connect two speakers wirelessly for 360° Left/Right surround sound, plus TF, AUX and USB.",
  },
];

export default function Home() {
  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);

  const onReady = useCallback((n: number, total: number) => {
    setLoaded(n / total);
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
        progressRef.current = p;
        setProgress(p);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  const heroOpacity = Math.max(0, 1 - progress / 0.06);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <main className="bg-background text-foreground">
        {/* Scroll sequence starts immediately at the top */}
        <section ref={sectionRef} className="relative h-[650vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            <div className="absolute inset-0">
              <ScrollSequence progressRef={progressRef} onReady={onReady} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent md:via-background/50" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

            <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
              <div className="flex items-center gap-3">
                <Image
                  src="/deal-drip-logo.png"
                  alt="Deal Drip Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                  priority
                />
                <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-foreground">
                  Deal Drip
                </span>
              </div>
              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-widest uppercase text-muted-foreground">
                  <a href="#3d-studio" className="hover:text-foreground transition-colors">3D</a>
                  <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                  <a href="#specs" className="hover:text-foreground transition-colors">Specs</a>
                </nav>
                <Link
                  href="/checkout?plan=single"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase text-background transition-transform hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Buy Now</span>
                </Link>
              </div>
            </header>

            {/* Hero overlay — fades out as the sequence begins */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-20 md:px-12"
              style={{ opacity: heroOpacity }}
            >
              <h1 className="max-w-4xl text-5xl leading-[0.95] font-semibold md:text-8xl">
                Deal Drip 15W — charge, play, wake{" "}
                <span className="text-spectrum">in colour</span>.
              </h1>
              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  RGB wireless charging Bluetooth speaker with digital clock, dual alarm &amp; TWS
                  stereo pairing — 15W Qi pad, LED display and ambient light in one bedside device.
                </p>

                <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase font-mono">
                  {loaded < 1 ? `Loading ${Math.round(loaded * 100)}%` : "Scroll to explore ↓"}
                </p>
              </div>
            </div>

            <div className="relative flex h-[calc(100%-5rem)] items-center px-6 md:px-12">
              <div className="relative h-64 w-full max-w-md">
                {CAPTIONS.map((c) => {
                  const d = Math.abs(progress - c.at);
                  const visible = d < 0.11;
                  return (
                    <div
                      key={c.kicker}
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: `translateY(${visible ? 0 : 16}px)`,
                      }}
                    >
                      <p className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                        {c.kicker}
                      </p>
                      <h2 className="mt-4 text-3xl font-semibold md:text-5xl">{c.title}</h2>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                        {c.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute right-6 bottom-8 left-6 md:right-12 md:left-12">
              <div className="h-px w-full bg-border">
                <div
                  className="rule-spectrum h-px"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Real-Time Interactive 3D Model Studio */}
        <ModelViewer3D />

        {/* Features */}
        <section id="features" className="border-t border-border px-6 py-24 md:px-12 md:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                Architecture
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-5xl">
                Five essentials, one silhouette.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              A fusion of fast wireless charging, high-definition Bluetooth audio with TWS dual pairing,
              ambient RGB lighting and precision alarm clock.
            </p>
          </div>

          <div className="mt-16 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            <Feature
              kicker="01 — Light"
              title="RGB Halo Ring"
              body="Seven selectable ambient color modes. Doubles as a soft, gradual bedside night light."
            />
            <Feature
              kicker="02 — Power"
              title="15W Qi Induction"
              body="Fast wireless charging for iPhone, Samsung and Qi devices with heat & foreign-object safety."
            />
            <Feature
              kicker="03 — Time"
              title="Digital Clock & Alarm"
              body="Large LED clock display with dual independent wake alarms and room temperature sensor."
            />
            <Feature
              kicker="04 — Audio"
              title="Bluetooth 5.0 & TWS"
              body="Full-range acoustic driver, True Wireless Stereo link for discrete Left & Right channels."
            />
          </div>
        </section>

        {/* Dedicated TWS True Wireless Stereo Showcase */}
        <TwsShowcase />

        {/* Specs */}
        <section id="specs" className="border-t border-border px-6 py-24 md:px-12 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
                Specifications
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Technical Overview</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Engineered with high-efficiency Qi induction and balanced full-range acoustics.
              </p>
            </div>
            <dl className="divide-y divide-border">
              {[
                ["Brand", "Deal Drip"],
                ["Model", "Deal Drip 15W RGB Speaker with Clock & TWS"],
                ["Wireless Charging", "Qi Standard, up to 15W Fast Charge"],
                ["Bluetooth", "5.0 with TWS Dual Link (10m range)"],
                ["Audio Playback", "Bluetooth 5.0, TF Card, USB Disk, AUX 3.5mm"],
                ["Microphone", "Built-in HD Noise Reduction (Hands-Free Calls)"],
                ["Lighting", "RGB 360° Ambient Halo Ring (7 Modes)"],
                ["Display", "LED Digital Clock, Dual Alarms, Temperature"],
                ["Power Input", "USB Type-C (5V / 2A Fast Input)"],
                ["Price", "Rs. 3,500 (Single) • Rs. 6,000 (Duo Pack)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-8 py-3.5">
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-right text-sm font-medium text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA & Pricing Selector */}
        <section
          id="reserve"
          className="relative overflow-hidden border-t border-border px-6 py-24 md:px-12 md:py-32"
        >
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-mono tracking-[0.3em] text-muted-foreground uppercase">
              Free Nepal Delivery • Cash on Delivery
            </p>
            <h2 className="mx-auto mt-4 text-3xl font-semibold md:text-6xl">
              Choose your setup.
            </h2>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Option 1: Single Unit */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-card/40 p-8 transition-all hover:border-border/80">
              <div>
                <span className="rounded bg-secondary px-2.5 py-1 text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                  Single Unit
                </span>
                <h3 className="mt-4 text-2xl font-semibold">1x Deal Drip 15W</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  RGB lamp, 15W Qi wireless charger, alarm clock and Bluetooth speaker.
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-display">Rs. 3,500</span>
                  <span className="text-xs text-muted-foreground">/ unit</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-foreground" />
                    <span>1x Deal Drip 15W Speaker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-foreground" />
                    <span>15W Qi Fast Wireless Pad</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-foreground" />
                    <span>LED Clock &amp; Dual Alarm</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-foreground" />
                    <span>7-Mode Ambient RGB Halo</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                <Link
                  href="/checkout?plan=single"
                  className="block text-center rounded-xl border border-border bg-foreground px-6 py-3.5 text-xs font-semibold tracking-wider text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Order Single (Rs. 3,500)
                </Link>
                <a
                  href="https://www.daraz.com.np/products/-i1543733289-s12360955990.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  or buy via Daraz →
                </a>
              </div>
            </div>

            {/* Option 2: TWS Twin Pack */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-accent/40 bg-card/60 p-8 shadow-sm">
              <div className="absolute -top-3 right-6">
                <span className="rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold tracking-wider text-background uppercase">
                  Save Rs. 1,000
                </span>
              </div>

              <div>
                <span className="rounded bg-accent/15 px-2.5 py-1 text-[11px] font-mono tracking-wider text-accent uppercase font-medium">
                  TWS Twin Pack
                </span>
                <h3 className="mt-4 text-2xl font-semibold">2x Deal Drip 15W (Pair)</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Two synchronized speakers for true 360° Left/Right wireless stereo.
                </p>

                <div className="mt-6 flex items-baseline gap-2.5">
                  <span className="text-3xl font-bold font-display text-spectrum">Rs. 6,000</span>
                  <span className="text-xs text-muted-foreground line-through">Rs. 7,000</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span className="font-medium">2x Deal Drip 15W Speakers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span>360° True Wireless Stereo (L/R)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span>2x 15W Qi Fast Charging Pads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" />
                    <span>Synchronized RGB Atmosphere</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                <Link
                  href="/checkout?plan=duo"
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-xs font-semibold tracking-wider text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Order Twin Pack (Rs. 6,000)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href="https://www.daraz.com.np/products/-i1543733289-s12360955990.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  or buy via Daraz →
                </a>
              </div>
            </div>
          </div>

          {/* Minimal Guarantee Banner */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Official Deal Drip Nepal • Cash on Delivery • Free Delivery</span>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-8 text-xs tracking-widest text-muted-foreground uppercase md:flex-row md:px-12">
          <div className="flex items-center gap-2.5">
            <Image
              src="/deal-drip-logo.png"
              alt="Deal Drip Logo"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className="font-medium text-foreground">Deal Drip</span>
            <span>— © 2026</span>
          </div>
          <span>All Rights Reserved</span>
        </footer>
      </main>
    </>
  );
}

function Feature({
  kicker,
  title,
  body,
  className = "",
}: {
  kicker: string;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={`bg-background p-6 md:p-8 ${className}`}>
      <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">{kicker}</p>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
