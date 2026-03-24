import Link from "next/link";
import { analyzeVideo, NOT_AVAILABLE, type VideoAnalysisReport } from "@/lib/video-analysis";
import { AnalyzeProgressScreen } from "@/components/analyze-progress-screen";
import { AuthModalForm } from "@/components/auth-modal-form";
import { HomepageAnalyzeSection } from "@/components/homepage-analyze-section";
import { ReportConfidenceGauge } from "@/components/report-confidence-gauge";
import { ReportVideoPanel } from "@/components/report-video-panel";

type ScreenDefinition = {
  slug: string;
  name: string;
  description: string;
};

type AppMode =
  | "home"
  | "home-link-upload"
  | "signup-empty"
  | "signup-filled"
  | "connect-wallet"
  | "login-empty"
  | "login-filled"
  | "analyzing"
  | "report"
  | "report-share"
  | "verify-email";

type AuthVariant = "signup-empty" | "signup-filled" | "login-empty" | "login-filled";

type CheckyScreenProps = {
  mode: AppMode;
};

const screenDefinitions: ScreenDefinition[] = [
  { slug: "", name: "Home", description: "Landing hero with the base analyze input." },
  { slug: "home-link-upload", name: "Home, link upload", description: "Landing screen with URL and uploaded media state." },
  { slug: "signup-empty", name: "Get started", description: "Sign-up modal with empty fields and password guidance." },
  { slug: "signup-filled", name: "Get started, filled", description: "Completed sign-up form state with active CTA." },
  { slug: "connect-wallet", name: "Connect wallet", description: "Wallet network and provider selection modal." },
  { slug: "login-empty", name: "Login", description: "Login modal with empty fields and disabled CTA." },
  { slug: "login-filled", name: "Login, filled", description: "Login modal with completed credentials and enabled CTA." },
  { slug: "analyzing", name: "Analyzing", description: "Loading screen with concentric animated rings." },
  { slug: "report", name: "Upload done", description: "Verification report with evidence, metadata, and guidance." },
  { slug: "report-share", name: "Report share", description: "Share modal presented on top of the report view." },
  { slug: "verify-email", name: "Verify your email", description: "Centered confirmation state after sign-up." }
];

export function getScreenDefinitions() {
  return screenDefinitions;
}

export function isValidMode(mode: string): mode is AppMode {
  return screenDefinitions.some((definition) => definition.slug === mode);
}

function readSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? null : null;
}

export async function CheckyScreen({
  mode,
  searchParams
}: CheckyScreenProps & {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const sourceUrl = readSearchParam(searchParams?.url);
  const modal = readSearchParam(searchParams?.modal);
  const showAuthModal = mode === "home" && (modal === "get-started" || modal === "log-in");
  const homepageAuthVariant: AuthVariant = modal === "log-in" ? "login-empty" : "signup-empty";

  if (mode === "analyzing") {
    return (
      <BaseScreen hideFooter hideMenu>
        <AnalyzeProgressScreen sourceUrl={sourceUrl} />
      </BaseScreen>
    );
  }

  if (mode === "report" || mode === "report-share") {
    const report = sourceUrl ? await getReportData(sourceUrl) : null;

    return (
      <BaseScreen compactFooter hideFooter>
        <ReportScreen report={report} shareOpen={mode === "report-share"} sourceUrl={sourceUrl} />
      </BaseScreen>
    );
  }

  if (mode === "verify-email") {
    const verificationEmail = readSearchParam(searchParams?.email);

    return (
      <BaseScreen topActionLabel="Help?">
        <VerifyEmailState email={verificationEmail} />
      </BaseScreen>
    );
  }

  if (mode === "connect-wallet") {
    return (
      <div className="screen">
        <div className="overlay centered">
          <ConnectWalletModal />
        </div>
      </div>
    );
  }

  if (mode === "signup-empty" || mode === "signup-filled" || mode === "login-empty" || mode === "login-filled") {
    return (
      <BaseScreen showHeroOrbit>
        <LandingHero mode="home" />
        <Footer />
        <div className="overlay modal-offset">
          <AuthModal variant={mode} />
        </div>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen showHeroOrbit={showAuthModal} getStartedHref="/?modal=get-started">
      <LandingHero mode={mode} />
      <Footer />
      {showAuthModal ? (
        <div className="overlay modal-offset">
          <AuthModal closeHref="/" variant={homepageAuthVariant} />
        </div>
      ) : null}
    </BaseScreen>
  );
}

export function ScreenIndex() {
  return (
    <div className="screen">
      <Menu />
      <div className="screens-index">
        <h1>Checky Figma Screens</h1>
        <p>
          Each route below corresponds to one of the 11 Figma frames you provided. The shared shell, auth flows, loading
          state, and report experience are all implemented as reusable components.
        </p>
        <div className="screen-grid">
          {screenDefinitions.map((definition) => {
            const href = definition.slug ? `/screens/${definition.slug}` : "/";

            return (
              <Link className="screen-link" href={href} key={definition.slug || "home"}>
                <h2>{definition.name}</h2>
                <span>{definition.description}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BaseScreen({
  children,
  loggedIn = false,
  topActionLabel = "Get started",
  compactFooter = false,
  hideFooter = false,
  hideMenu = false,
  showHeroOrbit = false,
  getStartedHref
}: {
  children: React.ReactNode;
  loggedIn?: boolean;
  topActionLabel?: string;
  compactFooter?: boolean;
  hideFooter?: boolean;
  hideMenu?: boolean;
  showHeroOrbit?: boolean;
  getStartedHref?: string;
}) {
  return (
    <div className="screen">
      {!hideMenu && <Menu getStartedHref={getStartedHref} loggedIn={loggedIn} topActionLabel={topActionLabel} />}
      {showHeroOrbit && <HeroOrbit />}
      {children}
      {!hideFooter && <Footer compact={compactFooter} loggedIn={loggedIn} />}
    </div>
  );
}

function Menu({
  loggedIn = false,
  topActionLabel = "Get started",
  getStartedHref
}: {
  loggedIn?: boolean;
  topActionLabel?: string;
  getStartedHref?: string;
}) {
  return (
    <header className="menu">
      <Link className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">
          <EyeLogoIcon />
        </span>
        <span>Checky</span>
      </Link>

      {loggedIn ? (
        <div className="wallet-chip">
          <span className="wallet-avatar-icon" aria-hidden="true">
            <ProfileIcon />
          </span>
          <span>0xF0Ef88...9802</span>
        </div>
      ) : (
        <Link className="top-action" href={getStartedHref ?? "/screens/signup-empty"}>
          {topActionLabel}
        </Link>
      )}
    </header>
  );
}

function HeroOrbit() {
  return (
    <div className="hero-orbit" aria-hidden="true">
      <svg className="hero-union-svg" fill="none" viewBox="0 0 960 759">
        <rect height="649" stroke="rgba(46,49,79,0.5)" strokeWidth="2" width="670" x="128" y="0" />
        <ellipse cx="461" cy="312" rx="341" ry="75" stroke="rgba(255,255,250,0.95)" strokeWidth="2" transform="rotate(-7 461 312)" />
        <rect fill="url(#unionLine)" height="261" width="2" x="128" y="251" />
        <defs>
          <linearGradient id="unionLine" x1="129" x2="129" y1="251" y2="512" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,250,0.95)" />
            <stop offset="1" stopColor="rgba(255,255,250,0.08)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function LandingHero({ mode }: { mode: "home" | "home-link-upload" }) {
  return (
    <main className="hero-copy">
      <div className="hero-text">
        <h1 className="hero-title">Decentralized content authentication &amp; verification</h1>
        <p className="hero-subtitle">
          Verify the authenticity of any media content you and you can also generate authenticity for your media content
        </p>
      </div>

      <div className="input-stack">
        {mode === "home" ? <HomepageAnalyzeSection /> : <StaticAnalyzeBar />}

        {mode === "home-link-upload" ? <UploadCard /> : null}
      </div>
    </main>
  );
}

function StaticAnalyzeBar() {
  return (
    <div className="analyze-bar" style={{ borderColor: "#da5678" }}>
      <div className="analyze-value">https://x.com/newmedia/</div>
      <button className="gradient-button" type="button">
        Analyze
      </button>
    </div>
  );
}


function UploadCard() {
  return (
    <div className="upload-card">
      <div className="upload-thumb" aria-hidden="true" />
      <div className="upload-meta">
        <p className="upload-name">Micheal Jackson said so.mp4</p>
        <p className="upload-size">3.4mb</p>
      </div>
      <button className="close-icon" type="button" aria-label="Remove file" />
    </div>
  );
}

function Footer({
  compact = false,
  loggedIn = false
}: {
  compact?: boolean;
  loggedIn?: boolean;
}) {
  return (
    <footer className="page-footer">
      <div className="footer-left">
        <div className="footer-year">
          <span className="footer-copyright" aria-hidden="true">
            <CopyrightIcon />
          </span>
          <span>2026</span>
        </div>
      </div>
      <div className="footer-nav-wrap">
        <nav className="bottom-nav" aria-label="Primary">
          <Link className="nav-item active" href="/">
            <span className="nav-glyph" aria-hidden="true">
              <HomeIcon />
            </span>
            <span>Home</span>
          </Link>
          <Link className="nav-item" href="/screens">
            <span className="nav-glyph" aria-hidden="true">
              <DocumentIcon />
            </span>
            <span>How it works</span>
          </Link>
          <Link className="nav-item" href="/screens/report">
            <span className="nav-glyph" aria-hidden="true">
              <DocumentIcon />
            </span>
            <span>Case Studies</span>
          </Link>
          <Link className="nav-item" href="/screens/verify-email">
            <span className="nav-glyph" aria-hidden="true">
              <ChatIcon />
            </span>
            <span>Help</span>
          </Link>
          {compact || loggedIn ? (
            <button className="nav-item" type="button" aria-label="More">
              <span className="nav-glyph" aria-hidden="true">
                <MenuIcon />
              </span>
            </button>
          ) : null}
        </nav>
      </div>
      {!compact && !loggedIn ? <SocialLinks /> : null}
    </footer>
  );
}

function SocialLinks() {
  return (
    <div className="socials" aria-label="Social links">
      <span className="social-glyph" aria-hidden="true">
        <TwitterIcon />
      </span>
      <span className="social-sep" aria-hidden="true" />
      <span className="social-glyph" aria-hidden="true">
        <LinkedInIcon />
      </span>
      <span className="social-sep" aria-hidden="true" />
      <span className="social-glyph" aria-hidden="true">
        <InstagramIcon />
      </span>
    </div>
  );
}

function CopyrightIcon() {
  return (
    <svg fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.8 10.4C9.3 10.87 8.72 11.1 8.05 11.1C6.57 11.1 5.4 9.81 5.4 8C5.4 6.19 6.57 4.9 8.05 4.9C8.72 4.9 9.3 5.13 9.8 5.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function EyeLogoIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <path
        d="M2.25 12C4.4 8.15 7.69 6.25 12 6.25C16.31 6.25 19.6 8.15 21.75 12C19.6 15.85 16.31 17.75 12 17.75C7.69 17.75 4.4 15.85 2.25 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.35" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8.25" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 19C6.65 15.95 8.93 14.5 12 14.5C15.07 14.5 17.35 15.95 19 19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20">
      <path d="M3.5 9.17L10 4l6.5 5.17V16a1 1 0 0 1-1 1h-3.83v-4.83H8.33V17H4.5a1 1 0 0 1-1-1V9.17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20">
      <path d="M6 2.75h5.9l2.85 2.85V16A1.25 1.25 0 0 1 13.5 17.25H6A1.25 1.25 0 0 1 4.75 16V4A1.25 1.25 0 0 1 6 2.75Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M11.75 2.9V6h3.1" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20">
      <path d="M5.5 5.25h9a1.75 1.75 0 0 1 1.75 1.75v5.25A1.75 1.75 0 0 1 14.5 14h-3.75L7 16.75V14H5.5a1.75 1.75 0 0 1-1.75-1.75V7A1.75 1.75 0 0 1 5.5 5.25Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg fill="none" viewBox="0 0 20 20">
      <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.9 3H22l-6.77 7.73L23.2 21h-6.25l-4.9-6.4L6.44 21H3.33l7.24-8.28L.8 3h6.4l4.42 5.84L18.9 3Zm-1.1 16.13h1.72L6.28 4.77H4.43L17.8 19.13Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M5.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 10h3v10H4V10Zm5 0h2.88v1.37h.04c.4-.76 1.38-1.56 2.85-1.56 3.05 0 3.62 2 3.62 4.61V20h-3v-4.95c0-1.18-.02-2.7-1.65-2.7-1.65 0-1.9 1.29-1.9 2.61V20H9V10Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="4" stroke="currentColor" strokeWidth="1.7" width="14" x="5" y="5" />
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" fill="currentColor" r="1.1" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function InfoGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 7.25v4.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="9" cy="5.25" fill="currentColor" r=".9" />
    </svg>
  );
}

function CheckCircleGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.25 8.2 7.15 10.1 10.85 6.15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function EyeOpenGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 16 16">
      <path
        d="M1.5 8c1.42-2.32 3.57-3.5 6.5-3.5S13.08 5.68 14.5 8c-1.42 2.32-3.57 3.5-6.5 3.5S2.92 10.32 1.5 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" fill="currentColor" r="1.4" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M17.85 10.23c0-.57-.05-.97-.15-1.38H10v2.77h4.53c-.09.69-.58 1.74-1.67 2.44l-.01.09 2.43 1.84.17.02c1.53-1.37 2.4-3.39 2.4-5.78Z" fill="#4285F4" />
      <path d="M10 18c2.22 0 4.09-.72 5.45-1.96l-2.59-1.95c-.69.47-1.62.8-2.86.8-2.18 0-4.03-1.4-4.69-3.33l-.09.01-2.53 1.91-.03.08A8.24 8.24 0 0 0 10 18Z" fill="#34A853" />
      <path d="M5.31 11.56A4.84 4.84 0 0 1 5.03 10c0-.54.1-1.06.27-1.56l-.01-.1-2.56-1.94-.08.04A7.87 7.87 0 0 0 1.8 10c0 1.28.31 2.49.85 3.56l2.66-2Z" fill="#FBBC05" />
      <path d="M10 5.11c1.57 0 2.63.66 3.24 1.21l2.37-2.25C14.08 2.67 12.22 2 10 2 6.66 2 3.77 3.88 2.65 6.44l2.65 2c.67-1.93 2.51-3.33 4.7-3.33Z" fill="#EA4335" />
    </svg>
  );
}

function WalletGlyph() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path d="M3.25 6.25A2.25 2.25 0 0 1 5.5 4h7.25a2 2 0 0 1 1.52.7l1.48 1.73v8.07A1.5 1.5 0 0 1 14.25 16H5.5a2.25 2.25 0 0 1-2.25-2.25v-7.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
      <path d="M3.4 7h12.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="13.1" cy="11.5" fill="currentColor" r="1.1" />
    </svg>
  );
}

function AuthModal({ variant, closeHref }: { variant: AuthVariant; closeHref?: string }) {
  return <AuthModalForm closeHref={closeHref} variant={variant} />;
}

function ConnectWalletModal() {
  return (
    <div className="modal small">
      <div className="modal-body">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">Connect wallet</h2>
            <p className="modal-subtitle">Select what network and wallet of your choice</p>
          </div>
          <button className="icon-button close-icon" type="button" aria-label="Close modal" />
        </div>

        <div className="form-stack">
          <div className="field">
            <label>Network</label>
            <div className="network-grid">
              <div className="wallet-card active">
                <div className="solana-logo" aria-hidden="true">
                  <span />
                </div>
                <span>Sol</span>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Choose wallet</label>
            <div className="wallet-grid">
              <div className="wallet-card">
                <div className="wallet-logo">M</div>
                <span>Metamask</span>
              </div>
              <div className="wallet-card">
                <div className="wallet-logo">〰</div>
                <span>Wallet Connect</span>
              </div>
              <div className="wallet-card">
                <div className="wallet-logo">V</div>
                <span>Venly</span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-row">
          <span>or</span>
        </div>

        <div className="social-row">
          <div className="auth-option">
            <span className="auth-option-chip">G</span>
            <span className="auth-option-label">Google</span>
          </div>
          <div className="auth-option">
            <span className="auth-option-chip">@</span>
            <span className="auth-option-label">Email</span>
          </div>
        </div>

        <div className="auth-switch">
          <span>Have an account? </span>
          <strong>Log in</strong>
        </div>
      </div>
    </div>
  );
}

async function getReportData(sourceUrl: string) {
  try {
    return await analyzeVideo(sourceUrl);
  } catch {
    return null;
  }
}

function ReportScreen({
  report,
  shareOpen,
  sourceUrl
}: {
  report: VideoAnalysisReport | null;
  shareOpen: boolean;
  sourceUrl: string | null;
}) {
  const shareHref = sourceUrl ? `/screens/report-share?url=${encodeURIComponent(sourceUrl)}` : "/screens/report-share";
  const hasReport = Boolean(report);

  return (
    <>
      <main className="report-shell">
        <Link className="report-back-button" href="/">
          Back to home
        </Link>

        <section className="report-grid">
          <div>
            <div className="report-top">
              <ReportConfidenceGauge confidenceRate={report?.confidenceRate ?? null} />
              <div className="stat-pair">
                <div className="stat-block">
                  <span className="stat-label">Status:</span>
                  <span className="stat-value">{report?.riskLabel ?? NOT_AVAILABLE}</span>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Confidence rate</span>
                  <span className="stat-value">{typeof report?.confidenceRate === "number" ? `${report.confidenceRate}%` : NOT_AVAILABLE}</span>
                </div>
              </div>
              <div className="stat-pair">
                <div className="stat-block">
                  <span className="stat-label">File name:</span>
                  <span className="stat-value">{report?.fileName ?? NOT_AVAILABLE}</span>
                </div>
                <div className="stat-block">
                  <span className="stat-label">File size</span>
                  <span className="stat-value">{report?.fileSizeLabel ?? NOT_AVAILABLE}</span>
                </div>
              </div>
            </div>

            <ReportVideoPanel report={report} shareHref={shareHref} />
          </div>

          <div className="report-divider" />

          <aside className="meta-sidebar">
            <MetaSection
              title="Metadata"
              rows={report?.metadataRows ?? []}
              extra={
                <>
                  <div className="meta-row">
                    <span className="meta-key">Original source:</span>
                    {report?.preview.sourceUrl ? (
                      <a
                        className="meta-value meta-link meta-link-truncate"
                        href={report.preview.sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                        title={report.preview.sourceUrl}
                      >
                        {report.preview.sourceUrl}
                      </a>
                    ) : (
                      <span className="meta-value">{NOT_AVAILABLE}</span>
                    )}
                  </div>
                  <div className="meta-row">
                    <span className="meta-key">Media Hash:</span>
                    <span className="meta-value">{report?.mediaHash ?? NOT_AVAILABLE}</span>
                  </div>
                </>
              }
            />

            <MetaSection
              title="Source Access"
              rows={report?.retrievalRows ?? []}
              extra={
                <>
                  <div className="meta-row">
                    <span className="meta-key">Capability:</span>
                    <span className="meta-value">{report?.analysisCapabilityLabel ?? NOT_AVAILABLE}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-key">Next step:</span>
                    <span className="meta-value">{report?.nextAnalysisStep ?? NOT_AVAILABLE}</span>
                  </div>
                </>
              }
            />

            <MetaSection
              title="Blockchain Verification"
              rows={report?.verificationRows ?? []}
              extra={
                <div className="meta-row">
                  <span className="meta-key">Record:</span>
                  <span className="meta-value meta-link">
                    {report?.hasBlockchainRecord && report.transactionUrl ? (
                      <a href={report.transactionUrl} rel="noreferrer" target="_blank">
                        Explore record
                      </a>
                    ) : (
                      NOT_AVAILABLE
                    )}
                  </span>
                </div>
              }
            />

            <MetaSection
              title="Technical Details"
              rows={report?.technicalRows ?? []}
            />
          </aside>
        </section>
      </main>

      {shareOpen ? (
        <div className="overlay centered">
          <ShareReportModal sourceUrl={sourceUrl} />
        </div>
      ) : null}
    </>
  );
}

function MetaSection({
  title,
  rows,
  extra
}: {
  title: string;
  rows: [string, string][];
  extra?: React.ReactNode;
}) {
  return (
    <section className="meta-section">
      <h2 className="section-title">{title}</h2>
      <div className="meta-list">
        {rows.map(([key, value]) => (
          <div className="meta-row" key={`${title}-${key}`}>
            <span className="meta-key">{key}</span>
            <span className="meta-value">{value || NOT_AVAILABLE}</span>
          </div>
        ))}
        {extra}
      </div>
    </section>
  );
}

function ShareReportModal({ sourceUrl }: { sourceUrl: string | null }) {
  const closeHref = sourceUrl ? `/screens/report?url=${encodeURIComponent(sourceUrl)}` : "/screens/report";

  return (
    <div className="modal">
      <div className="modal-body">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">Share this report</h2>
            <p className="modal-subtitle">Let other people know about this content</p>
          </div>
          <Link className="icon-button close-icon" href={closeHref} aria-label="Close share modal" />
        </div>

        <div className="share-icons">
          <ShareIcon label="Instagram" glyph="IG" />
          <ShareIcon label="Tiktok" glyph="TT" />
          <ShareIcon label="Discord" glyph="DS" />
          <ShareIcon label="Whatsapp" glyph="WA" />
        </div>

        <div className="share-link">
          <p className="share-link-value">{sourceUrl ?? "https://example.com/article/social-share-modal"}</p>
          <span className="copy-icon" aria-hidden="true">
            ⧉
          </span>
        </div>
      </div>
    </div>
  );
}

function ShareIcon({ label, glyph }: { label: string; glyph: string }) {
  return (
    <div className="share-icon-item">
      <div className="share-icon-circle" aria-hidden="true">
        <span>{glyph}</span>
      </div>
      <span>{label}</span>
    </div>
  );
}

function VerifyEmailState({ email }: { email: string | null }) {
  return (
    <main className="verify-shell">
      <div className="verify-card">
        <div className="mail-icon" aria-hidden="true" />
        <h1 className="verify-title">Verify your email</h1>
        <p className="verify-subtitle">
          {email
            ? `We sent a mail to ${email} to verify your email.`
            : "We sent a mail to the email you provided to verify your email."}
        </p>
      </div>
    </main>
  );
}
