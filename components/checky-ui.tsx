import Image from "next/image";
import Link from "next/link";
import { analyzeVideo, type EvidenceItemData, type VideoAnalysisReport } from "@/lib/video-analysis";
import { AnalyzeProgressScreen } from "@/components/analyze-progress-screen";
import { HomepageAnalyzeSection } from "@/components/homepage-analyze-section";

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
    return (
      <BaseScreen topActionLabel="Help?" showHeroOrbit>
        <VerifyEmailState />
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
    <BaseScreen showHeroOrbit>
      <LandingHero mode={mode} />
      <Footer />
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
  showHeroOrbit = false
}: {
  children: React.ReactNode;
  loggedIn?: boolean;
  topActionLabel?: string;
  compactFooter?: boolean;
  hideFooter?: boolean;
  hideMenu?: boolean;
  showHeroOrbit?: boolean;
}) {
  return (
    <div className="screen">
      {!hideMenu && <Menu loggedIn={loggedIn} topActionLabel={topActionLabel} />}
      {showHeroOrbit && <HeroOrbit />}
      {children}
      {!hideFooter && <Footer compact={compactFooter} loggedIn={loggedIn} />}
    </div>
  );
}

function Menu({ loggedIn = false, topActionLabel = "Get started" }: { loggedIn?: boolean; topActionLabel?: string }) {
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
        <button className="top-action" type="button">
          {topActionLabel}
        </button>
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

function AuthModal({ variant }: { variant: AuthVariant }) {
  const isSignup = variant === "signup-empty" || variant === "signup-filled";
  const filled = variant === "signup-filled" || variant === "login-filled";
  const title = isSignup ? "Get started" : "Log in";
  const submitLabel = isSignup ? "Create account" : "Login";
  const switchLabel = isSignup ? "Have an account? Log in" : "New to checky? Create account";
  const secondaryLabel = isSignup ? "Connect wallet" : "Connect wallet";

  return (
    <div className="modal">
      <div className="modal-body">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="icon-button close-icon" type="button" aria-label="Close modal" />
        </div>

        {isSignup ? (
          <div className="info-banner">
            <span className="info-dot" aria-hidden="true" />
            <span>A wallet address on Solana will be created for you.</span>
          </div>
        ) : null}

        <div className="form-stack">
          {isSignup ? (
            <>
              <TextField label="Email" defaultValue={filled ? "johndoe@gmail.com" : ""} placeholder="e.g johndoe@gmail.com" />
              <TextField label="Username (optional)" defaultValue={filled ? "johndoe" : ""} placeholder="e.g johndoe" />
            </>
          ) : (
            <TextField
              label="Email/Username"
              defaultValue={filled ? "johndoe@gmail.com" : ""}
              placeholder="e.g johndoe"
            />
          )}

          <TextField label="Password" defaultValue={filled ? "***********" : ""} placeholder="" password />

          {isSignup ? (
            <div className="password-rules">
              <div className="rule-list">
                <div className="rule-title">
                  <span className="info-dot" aria-hidden="true" />
                  <span>Your password:</span>
                </div>
                <div className="rule-item">
                  <span className="rule-check done" aria-hidden="true" />
                  <span>Must be at least 8-digits long</span>
                </div>
                <div className="rule-item">
                  <span className="rule-check done" aria-hidden="true" />
                  <span>Must include an Upper Case Character</span>
                </div>
                <div className="rule-item">
                  <span className="rule-check done" aria-hidden="true" />
                  <span>Mut Special Character</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <button className={`gradient-button large${filled ? "" : " dimmed"}`} type="button">
          {submitLabel}
        </button>

        <div className="divider-row">
          <span>or</span>
        </div>

        <div className="social-row">
          <div className="auth-option">
            <span className="auth-option-chip">G</span>
            <span className="auth-option-label">Google</span>
          </div>
          <div className="auth-option">
            <span className="auth-option-chip">{isSignup ? "W" : "W"}</span>
            <span className="auth-option-label">{secondaryLabel}</span>
          </div>
        </div>

        <div className="auth-switch">
          <span>{switchLabel.split("?")[0]}? </span>
          <strong>{switchLabel.split("?")[1]?.trim() ?? ""}</strong>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  defaultValue,
  password = false
}: {
  label: string;
  placeholder: string;
  defaultValue: string;
  password?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="text-input">
        <input aria-label={label} defaultValue={defaultValue} placeholder={placeholder} readOnly />
        {password ? <span className="eye-icon" aria-hidden="true">o</span> : null}
      </div>
    </div>
  );
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
              <ConfidenceMeter confidenceRate={report?.confidenceRate ?? 0} />
              <div className="stat-pair">
                <div className="stat-block">
                  <span className="stat-label">Status:</span>
                  <span className="stat-value">{report?.riskLabel ?? "No analysis available"}</span>
                </div>
                <div className="stat-block">
                  <span className="stat-label">Confidence rate</span>
                  <span className="stat-value">{report ? `${report.confidenceRate}%` : "Unavailable"}</span>
                </div>
              </div>
              <div className="stat-pair">
                <div className="stat-block">
                  <span className="stat-label">File name:</span>
                  <span className="stat-value">{report?.fileName ?? "Unavailable"}</span>
                </div>
                <div className="stat-block">
                  <span className="stat-label">File size</span>
                  <span className="stat-value">{report?.fileSizeLabel ?? "Unavailable"}</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <div className="video-card">
                {report ? (
                  <>
                    <Image
                      alt={`${report.fileName} preview`}
                      className="video-card-image"
                      fill
                      priority
                      sizes="(max-width: 1080px) 100vw, 929px"
                      src={report.preview.thumbnailUrl}
                      unoptimized
                    />
                    <div className="video-card-overlay" />
                    <div className="play-badge" aria-hidden="true" />
                  </>
                ) : (
                  <div className="video-card-empty">Unable to load report details for this video.</div>
                )}
              </div>

              <div className="section-rule" />

              <div className="section-copy">
                <p className="eyebrow">Verification Details</p>
                <h2 className="section-title">{report?.detectionHeadline ?? "Analysis unavailable"}</h2>
                <p className="section-text">
                  {report?.detectionSummary ??
                    "Checky could not generate a full verification report for this link. Try the original source URL or a direct video file URL."}
                </p>
              </div>

              <div className="section-rule" />

              <div className="section-copy">
                <p className="eyebrow">Visual Evidence</p>
                <h2 className="section-title">{report?.detectionHeadline ?? "Detected manipulation"}</h2>
                <div className="evidence-list">
                  {report?.evidence.map((item) => <EvidenceItem key={item.title} {...item} />)}
                </div>
                <div className="section-copy">
                  <h3 className="section-title">Comparison</h3>
                  <p className="section-text">{report?.visualSummary ?? "No comparison data available."}</p>
                </div>
                <div className="evidence-list">
                  {report?.comparisonEvidence.map((item) => <EvidenceItem key={item.title} {...item} />)}
                </div>
              </div>

              <div className="section-rule" />

              <div className="section-copy">
                <p className="eyebrow">What to do next</p>
                <h2 className="section-title">User Guidance</h2>
                <p className="section-text">{report?.guidance ?? "Try analyzing another supported video URL."}</p>
                <div className="cta-row">
                  <button className="report-action-button report-action-button-inverse" type="button">
                    Report video
                  </button>
                  <Link className="report-action-button" href={shareHref}>
                    Share report
                  </Link>
                </div>
              </div>
            </div>
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
                    <span className="meta-value verified-pill">{report?.preview.sourceUrl ?? "Unavailable"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-key">Media Hash:</span>
                    <span className="meta-value">{report?.mediaHash ?? "Unavailable"}</span>
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
                    {report?.hasBlockchainRecord ? <Link href={report.transactionUrl}>Explore record</Link> : "No record found"}
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

function ConfidenceMeter({ confidenceRate }: { confidenceRate: number }) {
  const normalizedValue = Number.isFinite(confidenceRate) ? Math.min(100, Math.max(0, confidenceRate)) : 0;
  const centerX = 117.5;
  const centerY = 118;
  const startAngle = 190;
  const endAngle = 350;
  const angle = startAngle + (endAngle - startAngle) * (normalizedValue / 100);
  const radians = (angle * Math.PI) / 180;
  const needleLength = 66;
  const needleX = centerX + Math.cos(radians) * needleLength;
  const needleY = centerY + Math.sin(radians) * needleLength;
  const segments = Array.from({ length: 32 }, (_, index) => {
    const segmentStart = startAngle + ((endAngle - startAngle) / 31) * index;
    const segmentEnd = segmentStart + 3.2;
    const outerRadius = 81;
    const innerRadius = 65;
    const startRadians = (segmentStart * Math.PI) / 180;
    const endRadians = (segmentEnd * Math.PI) / 180;
    const x1 = centerX + Math.cos(startRadians) * innerRadius;
    const y1 = centerY + Math.sin(startRadians) * innerRadius;
    const x2 = centerX + Math.cos(endRadians) * outerRadius;
    const y2 = centerY + Math.sin(endRadians) * outerRadius;
    const stroke = index < 13 ? "#f12d28" : index < 23 ? "#7d6516" : "#1f8a2f";

    return {
      path: `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      stroke
    };
  });

  return (
    <div className="confidence">
      <svg className="confidence-svg" viewBox="0 0 235 182" aria-hidden="true">
        {segments.map((segment) => (
          <path
            key={segment.path}
            d={segment.path}
            fill="none"
            stroke={segment.stroke}
            strokeLinecap="round"
            strokeOpacity="0.92"
            strokeWidth="3.6"
          />
        ))}
        <line x1={centerX} y1={centerY} x2={needleX} y2={needleY} stroke="#353535" strokeWidth="3" strokeLinecap="round" />
        <circle cx={centerX} cy={centerY} r="6.5" fill="#53535c" />
      </svg>
      <div className="confidence-center">
        <div className="confidence-value">{normalizedValue}%</div>
      </div>
      <span className="confidence-axis zero">0</span>
      <span className="confidence-axis fifty">50</span>
      <span className="confidence-axis hundred">100</span>
      <span className="confidence-label low">Low confidence</span>
      <span className="confidence-label high">Extreme confidence</span>
    </div>
  );
}

function EvidenceItem({
  title,
  range,
  date,
  original = false
}: EvidenceItemData) {
  return (
    <div className="evidence-item">
      <div className={`thumb-small${original ? " original" : ""}`} aria-hidden="true" />
      <div className="evidence-copy">
        <p className="evidence-title">{title}</p>
        <div className="evidence-meta">
          <span>{range}</span>
          <span className="meta-dot" aria-hidden="true" />
          <span>{date}</span>
        </div>
      </div>
    </div>
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
            <span className="meta-value">{value}</span>
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

function VerifyEmailState() {
  return (
    <main className="verify-shell">
      <div className="verify-card">
        <div className="mail-icon" aria-hidden="true" />
        <h1 className="verify-title">Verify your email</h1>
        <p className="verify-subtitle">We sent a mail to the email you provided to verify your email.</p>
      </div>
    </main>
  );
}
