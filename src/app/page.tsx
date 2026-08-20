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
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain drop-shadow-md"
                  priority
                />
                <span className="font-display text-sm font-semibold tracking-[0.25em] uppercase text-foreground">
                  Deal Drip
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="#3d-studio"
                  className="inline-flex items-center gap-1.5 border border-accent/40 bg-accent/10 px-3 py-2 text-xs tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent/20"
                >
                  <Box className="h-3 w-3" />
                  3D Studio
                </a>
                <Link
                  href="/checkout?plan=duo"
                  className="hidden sm:inline-flex items-center gap-1.5 border border-chart-2/40 bg-chart-2/10 px-3 py-2 text-xs tracking-[0.15em] text-chart-2 uppercase transition-colors hover:bg-chart-2/20"
                >
                  <Sparkles className="h-3 w-3" />
                  Twin Pack: Rs. 6,000
                </Link>
                <Link
                  href="/checkout?plan=single"
                  className="inline-flex items-center gap-1.5 border border-border bg-foreground px-4 py-2 text-xs tracking-[0.2em] uppercase text-background transition-transform hover:scale-105 active:scale-95"
                >
                  <ShoppingBag className="h-3 w-3" />
                  Buy Now
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

                <p className="text-xs tracking-[0.25em] text-muted-foreground uppercase">
                  {loaded < 1 ? `Loading ${Math.round(loaded * 100)}%` : "Scroll to explore"}
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
                      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
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

        {/* Features */}
        <section className="border-t border-border px-6 py-24 md:px-12 md:py-32">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                All-In-One Architecture
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

          <div className="mt-16 grid gap-px bg-border md:grid-cols-6">
            <Feature
              className="md:col-span-4"
              kicker="RGB light"
              title="Colour-cycling ambient glow"
              body="Seven light modes — hold one colour or let it fade slowly through the spectrum. Doubles as a soft night light for the room."
            />
            <Feature
              className="md:col-span-2"
              kicker="Charging"
              title="15W Qi pad"
              body="Fast wireless charging for iPhone, Samsung and any Qi phone. Just set it down."
            />
            <Feature
              className="md:col-span-2"
              kicker="Clock"
              title="Time, date, temperature"
              body="Large LED digits with dual alarms, 12/24-hour format and adjustable brightness."
            />
            <Feature
              className="md:col-span-4"
              kicker="Audio & TWS"
              title="Bluetooth 5.0 with TWS Dual Stereo"
              body="Full-range acoustic driver behind acoustic fabric, True Wireless Stereo (TWS) dual speaker link for discrete Left & Right channels, hands-free mic, TF card, AUX and USB."
            />
          </div>
        </section>

        {/* Real-Time Interactive 3D Model Studio */}
        <ModelViewer3D />

        {/* Dedicated TWS True Wireless Stereo Showcase */}
        <TwsShowcase />

        {/* Specs */}
        <section className="border-t border-border px-6 py-24 md:px-12 md:py-32">
          <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                Technical Overview
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-4xl">Specifications</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Engineered with premium components for high-efficiency wireless power and true stereo acoustic dynamics.
              </p>
            </div>
            <dl className="divide-y divide-border">
              {[
                ["Brand / Company", "Deal Drip"],
                ["Product", "Deal Drip 15W RGB Wireless Charging Bluetooth Speaker with Clock & TWS"],
                ["TWS Stereo Pairing", "Supported (Wirelessly link 2 units for true Left / Right channel separation)"],
                ["Wireless charging", "Qi standard, up to 15W (10W / 7.5W / 5W compatible)"],
                ["Bluetooth", "5.0 with TWS Dual Link, range up to 10 m"],
                ["Playback modes", "Bluetooth 5.0 (TWS), TF card, USB disk, AUX 3.5 mm"],
                ["Calls", "Built-in HD noise-reduction microphone, hands-free"],
                ["Lighting", "RGB ambient halo ring, 7 selectable colour modes"],
                ["Display", "LED digital clock — time, date, temperature, dual alarm"],
                ["Power input", "USB-C, DC 5V / 2A (Fast charge adapter compatible)"],
                ["Pricing", "Single Unit: Rs. 3,500 | TWS Duo Pack: Rs. 6,000 (Save Rs. 1,000)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-8 py-4">
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-right text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA & Pricing Selector */}
        <section
          id="reserve"
          className="relative overflow-hidden border-t border-border px-6 py-28 md:px-12 md:py-40"
        >
          <div className="rule-spectrum absolute inset-x-0 top-0 h-px" />

          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Available now in Nepal • Free Islandwide Delivery Support
            </p>
            <h2 className="mx-auto mt-6 text-4xl font-semibold md:text-7xl">
              Choose your <span className="text-spectrum">sound setup</span>.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm text-muted-foreground">
              Delivered across Nepal with Cash on Delivery via Daraz. Buy one for your bedside,
              or grab the Twin Pack to unlock full TWS 360° dual stereo!
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Option 1: Single Unit */}
            <div className="relative flex flex-col justify-between rounded-2xl border border-border bg-background p-8 md:p-10 transition-all hover:border-border/80">
              <div>
                <span className="rounded bg-secondary px-3 py-1 text-xs font-mono tracking-wider text-muted-foreground uppercase">
                  Single Bedside Unit
                </span>
                <h3 className="mt-4 text-2xl font-semibold">1x Deal Drip 15W</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  All-in-one RGB lamp, 15W Qi wireless charger, alarm clock and Bluetooth speaker.
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-display">Rs. 3,500</span>
                  <span className="text-xs text-muted-foreground">/ unit</span>
                </div>

                <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-foreground" />
                    <span>1x Deal Drip 15W Speaker</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-foreground" />
                    <span>15W Qi Fast Wireless Charging</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-foreground" />
                    <span>LED Alarm Clock & Temperature</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-foreground" />
                    <span>7-Mode Ambient RGB Light</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-foreground" />
                    <span>TWS Ready (Pair another unit anytime)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 space-y-2">
                <Link
                  href="/checkout?plan=single"
                  className="block text-center border border-border bg-card px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase transition-colors hover:bg-foreground hover:text-background"
                >
                  Order 1 Unit (Rs. 3,500)
                </Link>
                <a
                  href="https://www.daraz.com.np/products/-i1543733289-s12360955990.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-muted-foreground underline hover:text-foreground"
                >
                  or order via Daraz
                </a>
              </div>
            </div>

            {/* Option 2: TWS Twin Pack (Recommended) */}
            <div className="relative flex flex-col justify-between rounded-2xl border-2 border-accent bg-card/60 p-8 md:p-10 shadow-[0_0_40px_oklch(0.72_0.19_190_/_0.15)]">
              <div className="absolute -top-3.5 right-8">
                <span className="flex items-center gap-1 rounded-full bg-accent px-3.5 py-1 text-[11px] font-bold tracking-wider text-background uppercase shadow">
                  <Sparkles className="h-3 w-3" />
                  Best Value • Save Rs. 1,000
                </span>
              </div>

              <div>
                <span className="rounded bg-accent/20 px-3 py-1 text-xs font-mono tracking-wider text-accent uppercase font-medium">
                  TWS Stereo Twin Pack
                </span>
                <h3 className="mt-4 text-2xl font-semibold">2x Deal Drip 15W (Pair)</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  Two synchronized speakers for true 360° Left/Right wireless stereo & dual charging.
                </p>

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="text-4xl font-bold font-display text-spectrum">Rs. 6,000</span>
                  <span className="text-xs text-muted-foreground line-through">Rs. 7,000</span>
                  <span className="rounded bg-chart-2/20 px-2 py-0.5 text-[11px] font-bold text-chart-2">
                    SAVE RS. 1,000
                  </span>
                </div>

                <ul className="mt-8 space-y-3 text-sm text-foreground">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-accent" />
                    <span className="font-medium">2x Deal Drip 15W Speakers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-accent" />
                    <span className="font-medium">360° True Wireless Stereo (L/R Channels)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-accent" />
                    <span>2x 15W Qi Fast Wireless Charging Pads</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-accent" />
                    <span>Synchronized Dual RGB Light Atmosphere</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-accent" />
                    <span>30W Combined Peak Room-Filling Audio</span>
                  </li>
                </ul>
              </div>

              <div className="mt-10 space-y-2">
                <Link
                  href="/checkout?plan=duo"
                  className="flex items-center justify-center gap-2 bg-foreground px-8 py-4 text-xs font-semibold tracking-[0.15em] text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Order Twin Pack (Rs. 6,000)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://www.daraz.com.np/products/-i1543733289-s12360955990.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-muted-foreground underline hover:text-foreground"
                >
                  or order via Daraz
                </a>
              </div>
            </div>
          </div>

          {/* Guarantee Banner */}
          <div className="mx-auto mt-12 flex max-w-md items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-chart-2" />
            <span>Official Deal Drip Product • Daraz Verified Seller • Cash on Delivery</span>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-10 text-xs tracking-[0.2em] text-muted-foreground uppercase md:flex-row md:px-12">
          <div className="flex items-center gap-3">
            <Image
              src="/deal-drip-logo.png"
              alt="Deal Drip Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <span>Deal Drip — © 2026</span>
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
    <div className={`bg-background p-8 md:p-12 ${className}`}>
      <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">{kicker}</p>
      <h3 className="mt-5 text-xl font-semibold md:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
