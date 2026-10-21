import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  BedDouble,
  MessageSquare,
  Compass,
  Sparkles,
} from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: BedDouble,
    title: 'Live Bed Vacancies',
    description: 'Inspect real-time bed inventories across Single, Double, and Triple sharing rooms before visiting.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero Brokerage',
    description: 'Connect directly with verified property owners with 100% transparent rent and deposit terms.',
  },
  {
    icon: MessageSquare,
    title: 'Direct In-App Chat',
    description: 'Message owners in real time to ask about house rules, food menus, and move-in timings.',
  },
  {
    icon: Compass,
    title: 'Interactive Search',
    description: 'Explore accommodations by neighborhood radius, verified amenities, and interactive map pins.',
  },
];

export const Hero = () => {
  return (
    <section className="relative overflow-hidden py-18 sm:py-28 border-b border-theme-border bg-theme-bg transition-colors">
      {/* Human-Crafted Architectural Grid Pattern with Radial Mask */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.55] dark:opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, black 45%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, black 45%, transparent 100%)',
        }}
      />

      {/* Layered Subtle Ambient Light Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[340px] bg-theme-brand/10 dark:bg-theme-brand/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-48 left-10 w-[350px] h-[250px] bg-sky-500/8 dark:bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-48 right-10 w-[350px] h-[250px] bg-indigo-500/8 dark:bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
        {/* Project Pill Badge with Soft Ring */}
        <div className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface/90 backdrop-blur-xs px-4 py-1.5 text-xs font-semibold text-theme-brand shadow-xs mb-7">
          <Sparkles className="h-3.5 w-3.5 text-theme-brand animate-pulse" />
          <span>PG Finder Platform &bull; Direct & Verified Accommodations</span>
        </div>

        {/* Hero Main Heading with Plus Jakarta Sans */}
        <h1 className="text-3xl font-extrabold tracking-tight text-theme-primary sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.15]">
          Find verified Paying Guest stays{' '}
          <span className="text-theme-brand">with zero broker fees.</span>
        </h1>

        {/* Project Explanation */}
        <p className="mt-5 text-sm text-theme-secondary sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
          PG Finder is a modern accommodation platform built to eliminate broker commissions, outdated vacancy boards, and unverified listings. Whether you are relocating for college or work, discover verified PGs with live bed availability, transparent rent, and direct owner communication.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-theme-brand px-6 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-theme-brand-hover hover:shadow-md active:scale-98 transition-all"
          >
            <span>Explore Accommodations</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/register?role=owner"
            className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface/90 backdrop-blur-xs px-6 py-3.5 text-xs sm:text-sm font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-surface hover:border-theme-brand/60 active:scale-98 transition-all shadow-xs"
          >
            <Building2 className="h-4 w-4 text-theme-brand" />
            <span>List Your PG</span>
          </Link>
        </div>

        {/* 4 Core Pillars of the Platform */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-theme-border/80 bg-theme-surface/85 backdrop-blur-xs p-5 shadow-xs hover:border-theme-brand/50 hover:bg-theme-surface hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand-subtle text-theme-brand mb-3.5 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-theme-primary">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-theme-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
