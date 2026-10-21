import React from 'react';
import { Search, SlidersHorizontal, CalendarCheck, MessageSquare } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Search & Filter',
    description: 'Filter by neighborhood, budget range, gender preference (boys, girls, or coliving), and food options.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Compare & Inspect',
    description: 'Check real property photos, live bed vacancies by room sharing type, verified amenities, and house rules.',
    icon: SlidersHorizontal,
  },
  {
    step: '03',
    title: 'Request Booking',
    description: 'Select your preferred room and move-in date. View transparent pricing and deposit terms before submitting.',
    icon: CalendarCheck,
  },
  {
    step: '04',
    title: 'Chat with Owner',
    description: 'Coordinate check-in details, ask questions about the property, and confirm key handover directly in real time.',
    icon: MessageSquare,
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 border-b border-theme-border transition-colors">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-theme-secondary">
            Find and move into your verified PG accommodation in four straightforward steps.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xs hover:border-theme-brand/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand-subtle text-theme-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-theme-muted">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-theme-primary">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-theme-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
