export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold tracking-tight text-ink-900">InfraNet</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-6 shadow-card">
          <h1 className="mb-1 text-lg font-semibold text-ink-900">{title}</h1>
          {subtitle && <p className="mb-5 text-sm text-ink-500">{subtitle}</p>}
          {!subtitle && <div className="mb-5" />}
          {children}
        </div>
      </div>
    </main>
  );
}
