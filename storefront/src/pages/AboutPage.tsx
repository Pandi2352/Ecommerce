import { Award, Leaf, ShieldCheck, Truck } from 'lucide-react';
import { useStorefrontConfig } from '@/app/StorefrontConfigContext';

export function AboutPage() {
  const { config } = useStorefrontConfig();
  const store = config?.storeName || 'NovaShop';

  const values = [
    {
      icon: Award,
      title: 'Quality First',
      text: 'Every product is curated and quality-checked before it reaches you.',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      text: 'Reliable nationwide shipping from our regional fulfilment hubs.',
    },
    {
      icon: ShieldCheck,
      title: 'Shop Securely',
      text: 'Protected checkout and a hassle-free returns policy on every order.',
    },
    {
      icon: Leaf,
      title: 'Responsibly Sourced',
      text: 'We partner with brands and vendors who care about how things are made.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-10 py-6 animate-fadeIn">
      {/* Hero */}
      <section
        className="rounded-2xl px-8 py-12 text-center text-white"
        style={{ background: 'var(--gradient-hero)' }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Our Story</p>
        <h1 className="mt-2 text-3xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
          About {store}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85">
          {config?.tagline ||
            `${store} brings together the season's best in fashion and lifestyle — thoughtfully curated, fairly priced, and delivered with care.`}
        </p>
      </section>

      {/* Values */}
      <section className="grid gap-4 sm:grid-cols-2">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-text">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{text}</p>
          </div>
        ))}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 rounded-xl border border-border bg-surface p-6 text-center">
        {[
          ['10k+', 'Happy customers'],
          ['500+', 'Products'],
          ['4.8★', 'Average rating'],
        ].map(([n, l]) => (
          <div key={l}>
            <p
              className="text-2xl font-black text-danger"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {n}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-text-secondary">{l}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
