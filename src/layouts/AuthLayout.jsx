import { useId } from 'react';
import { BrandLogoIcon } from '../components/BrandLogoMark';
import { authLogoTileClass } from '../constants/authTheme';
import { Outlet, Link } from 'react-router-dom';

const AUTH_FEATURES = [
  {
    title: 'AI voice & routing',
    blurb: 'Answer, qualify, and transfer calls without losing context.',
  },
  {
    title: 'Campaigns & leads',
    blurb: 'Track outreach, outcomes, and follow-ups in one place.',
  },
  {
    title: 'Live operations',
    blurb: 'See activity and health at a glance from your dashboard.',
  },
];

function FeatureCheckIcon({ className = 'w-5 h-5 shrink-0' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="10" cy="10" r="9" stroke="rgb(167 139 250 / 0.45)" strokeWidth="1" />
      <path d="M6 10.2 8.7 13 14 7.5" stroke="rgb(196 181 253 / 0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Background + SVG art: lower-right zone, copy stays on a legible left column. */
function AuthSidePanelBackdrop() {
  return (
    <div className="auth-side-panel pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(152deg, #06040f 0%, #0f0a1f 40%, #030712 100%)',
        }}
      />
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 85% 55% at 0% 18%, rgb(99 102 241 / 0.22), transparent 52%), radial-gradient(ellipse 78% 52% at 100% 88%, rgb(139 92 246 / 0.14), transparent 50%), radial-gradient(ellipse 48% 38% at 72% 12%, rgb(192 132 252 / 0.08), transparent 45%)',
          animation: 'auth-side-ambient 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgb(167 139 250 / 0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          animation: 'auth-side-grid 14s ease-in-out infinite',
        }}
      />
      {/* Keep typography readable — darken left / center where content sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 95% 90% at -5% 48%, rgb(3 7 18 / 0.94) 0%, transparent 55%), linear-gradient(100deg, rgb(15 23 42 / 0.62) 0%, transparent min(52%, 22rem))',
        }}
      />
      <div
        className="absolute inset-0 opacity-45"
        style={{
          background: 'linear-gradient(180deg, rgb(3 7 18 / 0.58) 0%, transparent 32%, transparent 68%, rgb(3 7 18 / 0.75) 100%)',
        }}
      />

      <svg
        className="absolute right-[-8%] bottom-[-4%] h-[min(300px,36vh)] w-[min(92%,340px)] sm:h-[min(320px,38vh)] sm:w-[min(94%,360px)] will-change-transform"
        style={{ animation: 'auth-side-float 11s ease-in-out infinite' }}
        viewBox="0 0 300 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="auth-side-stroke" x1="20" y1="20" x2="280" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" stopOpacity="0.48" />
            <stop offset="0.5" stopColor="#818cf8" stopOpacity="0.34" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="auth-side-fill" x1="40" y1="188" x2="188" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4f46e5" stopOpacity="0.3" />
            <stop offset="1" stopColor="#a855f7" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <g opacity={0.92}>
          <path
            d="M44 182c0-46 38-84 84-84v168c-46 0-84-38-84-84z"
            fill="url(#auth-side-fill)"
            style={{ animation: 'auth-side-glow 8s ease-in-out infinite' }}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${126 + i * 20} 56 Q ${138 + i * 20} 130 ${126 + i * 20} 204`}
              stroke="url(#auth-side-stroke)"
              strokeWidth={2.2 - i * 0.26}
              strokeLinecap="round"
              fill="none"
              style={{
                animation: `auth-side-wave ${4.2 + i * 0.35}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </g>

        <g stroke="rgb(148 163 184 / 0.4)" strokeWidth="1" strokeLinecap="round">
          <path d="M40 214h102" style={{ animation: 'auth-side-line 5s ease-in-out infinite' }} />
          <path d="M40 230h82" style={{ animation: 'auth-side-line 5s ease-in-out infinite', animationDelay: '0.35s' }} />
          <path d="M40 246h94" style={{ animation: 'auth-side-line 5s ease-in-out infinite', animationDelay: '0.7s' }} />
        </g>

        <g style={{ animation: 'auth-side-card 9s ease-in-out infinite' }}>
          <rect x="178" y="192" width="82" height="52" rx="11" stroke="url(#auth-side-stroke)" strokeWidth="1" fill="rgb(15 23 42 / 0.38)" />
          <path d="M194 214h50M194 226h34" stroke="rgb(148 163 184 / 0.34)" strokeWidth="1" strokeLinecap="round" />
        </g>
        <circle
          cx="210"
          cy="248"
          r="4.5"
          fill="rgb(139 92 246 / 0.82)"
          style={{
            transformOrigin: '210px 248px',
            animation: 'auth-side-live 2.4s ease-in-out infinite',
          }}
        />
        <circle
          cx="210"
          cy="248"
          r="8"
          fill="none"
          stroke="rgb(167 139 250 / 0.35)"
          strokeWidth="1"
          style={{
            transformOrigin: '210px 248px',
            animation: 'auth-side-live 2.4s ease-in-out infinite',
            animationDelay: '0.15s',
          }}
        />
        <path d="M207.5 248h5M210 245.5v5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Refined illustration behind the auth form — brand orbits, soft depth, voice-wave accent. */
function AuthFormPanelDecor() {
  const gid = useId().replace(/:/g, '');

  return (
    <div className="auth-form-panel-decor pointer-events-none absolute inset-0 select-none overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, rgb(255 255 255) 0%, rgb(250 250 252) 42%, rgb(248 247 255 / 0.92) 100%)',
        }}
      />
      <div
        className="absolute -right-28 -top-32 h-[min(32rem,78vw)] w-[min(32rem,78vw)] rounded-full opacity-[0.92] blur-[88px]"
        style={{
          background:
            'radial-gradient(circle at 42% 42%, rgb(167 139 250 / 0.2) 0%, rgb(129 140 248 / 0.08) 45%, transparent 68%)',
        }}
      />
      <div
        className="absolute -bottom-40 -left-36 h-[min(28rem,72vw)] w-[min(28rem,72vw)] rounded-full opacity-[0.88] blur-[80px]"
        style={{
          background:
            'radial-gradient(circle at 38% 52%, rgb(99 102 241 / 0.14) 0%, rgb(139 92 246 / 0.06) 50%, transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0 hidden opacity-[0.55] sm:block"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgb(99 102 241 / 0.045) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <svg
        className="absolute inset-0 h-full min-h-[560px] w-full"
        viewBox="0 0 1200 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={`${gid}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#818cf8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id={`${gid}-wave`} x1="-40" y1="0" x2="1120" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="24%" stopColor="#818cf8" stopOpacity="0.38" />
            <stop offset="52%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${gid}-card`} x1="0" y1="0" x2="88" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="1" stopColor="#f8fafc" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <g transform="translate(1010 130)">
          <g style={{ animation: 'auth-form-drift 20s ease-in-out infinite' }}>
            {[42, 72, 102, 132, 162].map((r, i) => (
              <circle
                key={r}
                cx="0"
                cy="0"
                r={r}
                fill="none"
                stroke={`url(#${gid}-ring)`}
                strokeWidth={i === 0 ? 1.05 : 0.72}
                opacity={0.5 - i * 0.075}
              />
            ))}
            <circle cx="0" cy="-102" r="3.2" fill="rgb(139 92 246 / 0.42)" />
            <circle cx="88" cy="-58" r="2.2" fill="rgb(99 102 241 / 0.38)" />
            <circle cx="-72" cy="74" r="1.8" fill="rgb(167 139 250 / 0.32)" />
          </g>
        </g>

        <g transform="translate(928 248) rotate(-7)">
          <g className="opacity-[0.72]" style={{ animation: 'auth-form-drift 24s ease-in-out infinite reverse' }}>
            <rect
              x="0"
              y="0"
              width="92"
              height="62"
              rx="14"
              fill={`url(#${gid}-card)`}
              stroke={`url(#${gid}-ring)`}
              strokeWidth="1"
            />
            <path d="M16 24h52M16 38h36" stroke="rgb(100 116 139 / 0.38)" strokeWidth="1.35" strokeLinecap="round" />
            <rect x="16" y="16" width="20" height="5" rx="2.5" fill="rgb(129 140 248 / 0.35)" />
          </g>
        </g>

        <path
          d="M -40 868 C 100 812 220 928 380 858 S 580 798 740 848 S 920 772 1080 832"
          stroke={`url(#${gid}-wave)`}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 20 918 C 140 868 260 968 400 902 S 560 848 720 892 S 880 828 1040 878"
          stroke="rgb(139 92 246 / 0.18)"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M 60 952 C 180 905 300 998 460 932"
          stroke="rgb(99 102 241 / 0.12)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-slate-950">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[44%] min-h-screen text-white flex-col relative overflow-hidden border-r border-violet-500/20">
        <AuthSidePanelBackdrop />
        <div className="relative z-10 flex min-h-screen flex-col px-10 py-11">
          <Link to="/" className="flex items-center gap-3 shrink-0 w-fit rounded-lg -ml-1 pl-1 pr-2 py-1 hover:bg-white/[0.04] transition-colors">
            <span className={authLogoTileClass}>
              <BrandLogoIcon className="h-9 w-9" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">AI Voice Agent</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center min-h-0 py-10 max-w-[20.5rem] pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/75 mb-4">Voice-first CRM</p>
            <h2 className="text-[1.65rem] xl:text-2xl font-semibold tracking-tight text-white leading-snug mb-4">
              Run campaigns and calls from one calm workspace.
            </h2>
            <p className="text-[15px] xl:text-base text-slate-300/90 leading-relaxed mb-8">
              Manage AI receptionists, campaigns, and leads in one place—no extra tools required.
            </p>
            <ul className="space-y-4">
              {AUTH_FEATURES.map(({ title, blurb }) => (
                <li key={title} className="flex gap-3.5">
                  <FeatureCheckIcon />
                  <div>
                    <p className="text-sm font-medium text-violet-50/95 leading-snug">{title}</p>
                    <p className="text-xs text-slate-400/95 leading-relaxed mt-0.5">{blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 shrink-0 text-violet-200/45 text-xs tracking-wide">© {new Date().getFullYear()} AI Voice Agent</p>
        </div>
      </div>

      <div className="relative flex min-h-[100dvh] flex-1 flex-col items-center overflow-y-auto overflow-x-hidden bg-slate-50 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-[max(1.75rem,env(safe-area-inset-bottom))] sm:pt-8 lg:min-h-screen lg:justify-center lg:overflow-y-visible lg:bg-transparent lg:p-6 lg:pb-6 lg:pt-6">
        <AuthFormPanelDecor />
        <div className="relative z-10 mx-auto my-auto flex w-full max-w-[400px] flex-col md:max-w-[440px] lg:my-0 lg:max-w-[400px]">
          <div className="lg:hidden mb-6 text-center sm:mb-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl px-2 py-1.5 text-slate-800 transition-colors hover:bg-slate-200/60 hover:text-blue-700"
            >
              <span className={authLogoTileClass + ' shadow-md'}>
                <BrandLogoIcon className="h-8 w-8" />
              </span>
              <span className="text-base font-semibold tracking-tight sm:text-lg">AI Voice Agent</span>
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-slate-900/10 sm:rounded-2xl sm:p-8 sm:shadow-xl sm:shadow-slate-900/20 lg:rounded-2xl lg:p-10">
            <Outlet />
          </div>
          <p className="mt-6 text-center text-xs text-slate-400 sm:mt-8 sm:text-sm lg:text-sm">
            Need help? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
