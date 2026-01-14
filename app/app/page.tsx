import Link from 'next/link';

export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          AI Radiologist
        </h1>
        <p className="mb-8 text-lg text-text-secondary">
          AI-powered radiology report generation with voice transcription and
          professional PDF export.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="btn-primary"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-secondary"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
