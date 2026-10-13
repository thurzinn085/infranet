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
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold tracking-tight text-neutral-100">InfraNet</p>
        </div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-6 shadow-card">
          <h1 className="mb-1 text-lg font-semibold text-neutral-100">{title}</h1>
          {subtitle && <p className="mb-5 text-sm text-neutral-400">{subtitle}</p>}
          {!subtitle && <div className="mb-5" />}
          {children}
        </div>
      </div>
    </main>
  );
}
