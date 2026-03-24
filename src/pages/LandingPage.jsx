import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogoIcon } from '../components/BrandLogoMark';
import { authGradientCtaClass, authLogoTileClass } from '../constants/authTheme';

function useInViewOnce(threshold = 0.12, rootMargin = '0px 0px -40px 0px') {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}

function LandingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(168deg, rgb(250 245 255) 0%, rgb(248 250 252) 32%, rgb(237 233 254) 58%, rgb(241 245 249) 100%)',
        }}
      />
      <div className="landing-backdrop-orb absolute -left-[min(28%,180px)] top-[8%] h-[min(85vw,28rem)] w-[min(85vw,28rem)] rounded-full bg-gradient-to-br from-violet-400/35 via-fuchsia-400/15 to-transparent blur-3xl" />
      <div className="landing-backdrop-orb--alt absolute -right-[min(22%,140px)] top-[28%] h-[min(75vw,24rem)] w-[min(75vw,24rem)] rounded-full bg-gradient-to-bl from-indigo-400/30 via-sky-400/10 to-transparent blur-3xl" />
      <div
        className="landing-backdrop-orb absolute left-[40%] -bottom-[10%] h-[min(70vw,22rem)] w-[min(70vw,22rem)] rounded-full bg-purple-400/20 blur-3xl [animation-delay:-6s]"
        style={{ animationDuration: '26s' }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 75% 60% at 5% -5%, rgb(167 139 250 / 0.42), transparent 52%), radial-gradient(ellipse 70% 55% at 100% 5%, rgb(99 102 241 / 0.28), transparent 50%), radial-gradient(ellipse 55% 45% at 85% 92%, rgb(192 132 252 / 0.22), transparent 52%), radial-gradient(ellipse 40% 35% at 15% 88%, rgb(56 189 248 / 0.08), transparent 45%)',
        }}
      />
      <div
        className="landing-backdrop-grid absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgb(99 102 241 / 0.11) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}

function IconMic({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm0 0v4m-4 0h8M9 21h6"
      />
    </svg>
  );
}

function IconFlow({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h4l2 8h4l2-6h6" />
    </svg>
  );
}

function IconCalendar({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconShield({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" />
    </svg>
  );
}

function IconLayoutDashboard({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5H4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3h-6V5zM4 13h6v6H5a1 1 0 01-1-1v-5zm10 0h6v4a1 1 0 01-1 1h-5v-5z" />
    </svg>
  );
}

function IconCheck({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: IconMic,
    title: 'Natural voice',
    desc: 'Human-like scripts—greet, qualify, and route without a busy signal.',
    accent: 'from-violet-500/15 to-indigo-500/10',
  },
  {
    icon: IconFlow,
    title: 'Smart routing',
    desc: 'Branches and handoffs so every call lands on the right outcome.',
    accent: 'from-indigo-500/15 to-purple-500/10',
  },
  {
    icon: IconCalendar,
    title: 'Calendar aware',
    desc: 'Book and reschedule using the calendars you already use.',
    accent: 'from-purple-500/15 to-violet-500/10',
  },
  {
    icon: IconShield,
    title: 'Built for teams',
    desc: 'Roles, secure sessions, and one dashboard for ops and revenue.',
    accent: 'from-fuchsia-500/12 to-indigo-500/12',
  },
];

const HERO_TRUST = ['No code required', 'Campaigns, scripts & leads in one place'];

const PREVIEW_STATS = [
  { label: 'Campaigns', value: '12' },
  { label: 'Leads', value: '847' },
  { label: 'Booked', value: '23' },
];

const PREVIEW_ROWS = [
  { title: 'Q1 outbound · renewals', meta: 'Script v3', tone: 'violet' },
  { title: 'Inbound · support', meta: 'Tier-2 route', tone: 'indigo' },
];

function HeroWorkspacePreview() {
  return (
    <div className="relative w-full min-w-0">
      <div
        className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-br from-violet-400/25 via-indigo-400/12 to-purple-500/18 blur-2xl sm:-inset-4 sm:rounded-[2rem]"
        aria-hidden
      />
      <div className="landing-preview-float relative w-full overflow-hidden rounded-2xl border border-violet-200/60 bg-white/95 shadow-xl shadow-indigo-950/10 backdrop-blur-md">
        <div className="flex items-center gap-3 border-b border-slate-100/90 bg-slate-50/90 px-3 py-2 sm:px-4">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2.5 rounded-full bg-red-400/85" />
            <span className="h-2 w-2.5 rounded-full bg-amber-400/85" />
            <span className="h-2 w-2.5 rounded-full bg-emerald-400/85" />
          </div>
          <p className="truncate text-xs font-medium text-slate-500">Overview</p>
        </div>

        <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow-md ring-2 ring-white sm:h-10 sm:w-10">
              <IconLayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Workspace</p>
              <p className="text-xs text-slate-500">Campaigns · scripts · payments</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PREVIEW_STATS.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg border border-slate-100/90 bg-gradient-to-b from-slate-50/90 to-white px-2 py-2 text-center sm:rounded-xl sm:py-2.5"
              >
                <p className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">{value}</p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-600 sm:text-[11px]">{label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Programs</p>
            <ul className="mt-2 space-y-1.5">
              {PREVIEW_ROWS.map(({ title, meta, tone }) => (
                <li
                  key={title}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs sm:rounded-xl sm:text-sm ${
                    tone === 'violet'
                      ? 'border-violet-100 bg-violet-50/50'
                      : 'border-indigo-100 bg-indigo-50/40'
                  }`}
                >
                  <span className="min-w-0 font-medium text-slate-800">{title}</span>
                  <span className="shrink-0 text-[10px] text-slate-500 sm:text-[11px]">{meta}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-[10px] text-slate-400 sm:text-[11px]">Sample data — sign in for your workspace.</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [headerElevated, setHeaderElevated] = useState(false);
  const [featuresRef, featuresVisible] = useInViewOnce();
  const [ctaRef, ctaVisible] = useInViewOnce(0.15);

  useEffect(() => {
    const onScroll = () => setHeaderElevated(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen min-h-[100dvh] overflow-x-hidden bg-slate-50">
      <LandingBackdrop />
      <div className="relative z-10">
        <header
          className={`sticky top-0 z-20 w-full border-b border-violet-200/45 bg-white/70 backdrop-blur-lg transition-[box-shadow,background-color] duration-300 ${
            headerElevated ? 'shadow-md shadow-indigo-950/[0.06] bg-white/85' : 'shadow-none'
          }`}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-violet-500/[0.06] sm:gap-3"
            >
              <span className={authLogoTileClass + ' shadow-md'}>
                <BrandLogoIcon className="h-8 w-8 sm:h-9 sm:w-9" />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">AI Voice Agent</div>
                <div className="truncate text-xs text-slate-600 sm:text-sm">Voice-first CRM</div>
              </div>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="rounded-xl border border-slate-200/90 bg-white/85 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:border-violet-300 hover:bg-violet-50/60 sm:text-sm"
              >
                Sign in
              </Link>
              <Link to="/register" className={`${authGradientCtaClass} px-3 py-2 text-xs sm:text-sm`}>
                Get started
              </Link>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-5xl px-4 pb-6 pt-6 sm:pb-8 sm:pt-10 lg:pt-12" aria-labelledby="hero-heading">
            <div className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
              <div className="min-w-0">
                <p
                  className="landing-hero-enter inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-800 shadow-sm backdrop-blur-sm sm:text-xs"
                  style={{ animationDelay: '0ms' }}
                >
                  <span className="landing-badge-pulse h-2 w-2 rounded-full bg-violet-500" aria-hidden />
                  Voice-first CRM
                </p>

                <h1
                  id="hero-heading"
                  className="landing-hero-enter mt-3 text-balance text-[1.85rem] font-bold leading-[1.12] tracking-tight text-slate-900 sm:mt-4 sm:text-4xl sm:leading-[1.1] lg:text-[2.65rem]"
                  style={{ animationDelay: '60ms' }}
                >
                  Your{' '}
                  <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                    AI receptionist
                  </span>{' '}
                  for leads & calls
                </h1>
                <p
                  className="landing-hero-enter mt-3 max-w-md text-balance text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base sm:leading-relaxed"
                  style={{ animationDelay: '110ms' }}
                >
                  Voice campaigns, natural call flows, and CRM outcomes in one workspace—built for teams on the phone.
                </p>

                <ul
                  className="landing-hero-enter mt-4 flex max-w-md flex-col gap-2 text-sm text-slate-600 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-x-5"
                  style={{ animationDelay: '150ms' }}
                >
                  {HERO_TRUST.map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-600/15"
                        aria-hidden
                      >
                        <IconCheck className="h-3 w-3" />
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div
                  className="landing-hero-enter mt-5 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center sm:mt-6 sm:gap-3"
                  style={{ animationDelay: '190ms' }}
                >
                  <Link to="/register" className={`${authGradientCtaClass} w-full justify-center px-5 py-3 text-sm min-[400px]:w-auto`}>
                    Start free trial
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl px-3 py-3 text-center text-sm font-semibold text-indigo-700 transition-colors hover:bg-violet-50 min-[400px]:text-left"
                  >
                    I have an account →
                  </Link>
                </div>

                <p
                  className="landing-hero-enter mt-3 text-xs text-slate-500 sm:text-sm"
                  style={{ animationDelay: '220ms' }}
                >
                  <span className="font-medium text-slate-600">How it works:</span> connect data → run campaigns → track
                  outcomes in the dashboard.
                </p>
              </div>

              <div className="landing-hero-enter min-w-0 lg:justify-self-end" style={{ animationDelay: '260ms' }}>
                <HeroWorkspacePreview />
              </div>
            </div>
          </section>

          <section
            ref={featuresRef}
            className={`landing-reveal border-y border-violet-200/40 bg-white/50 py-8 backdrop-blur-sm sm:py-10 ${featuresVisible ? 'is-visible' : ''}`}
            aria-labelledby="features-heading"
          >
            <div className="mx-auto max-w-5xl px-4">
              <h2 id="features-heading" className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                What you get
              </h2>
              <ul
                className={`landing-reveal-stagger mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 ${featuresVisible ? 'is-visible' : ''}`}
              >
                {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
                  <li
                    key={title}
                    className={`landing-feature-card group rounded-xl border border-slate-200/80 bg-gradient-to-br ${accent} p-4 shadow-sm hover:border-violet-200/90 hover:shadow-md sm:p-4`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-indigo-700 shadow-sm ring-1 ring-slate-200/60 transition-transform duration-300 group-hover:scale-105 group-hover:ring-violet-200/80">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900 sm:text-base">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 pb-10 pt-2 sm:pb-12" aria-labelledby="cta-heading">
            <div
              ref={ctaRef}
              className={`landing-reveal relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-900 px-5 py-8 text-center shadow-xl shadow-indigo-950/20 sm:rounded-3xl sm:px-8 sm:py-10 ${ctaVisible ? 'is-visible' : ''}`}
            >
              <div
                className="landing-cta-shimmer pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'linear-gradient(105deg, transparent 0%, rgb(255 255 255 / 0.14) 45%, transparent 90%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <h2 id="cta-heading" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Start in minutes
                </h2>
                <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-indigo-100/95 sm:text-base">
                  Free account, then add campaigns and scripts when you are ready.
                </p>
                <div className="mt-6 flex flex-col items-stretch justify-center gap-2 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center min-[400px]:justify-center min-[400px]:gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-900 shadow-lg transition-[transform,box-shadow] hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-800"
                  >
                    Create account
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-800"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-violet-200/40 bg-white/40 py-5 text-center text-xs text-slate-500 backdrop-blur-sm sm:text-sm">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:text-left">
              <p className="text-slate-600">© {new Date().getFullYear()} AI Voice Agent · Voice-first CRM</p>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-end">
                <Link to="/login" className="font-medium text-indigo-700 hover:text-violet-800">
                  Sign in
                </Link>
                <Link to="/register" className="font-medium text-indigo-700 hover:text-violet-800">
                  Register
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
