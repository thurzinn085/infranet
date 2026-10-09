export default function Alert({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    kind === "error"
      ? "border-danger/30 bg-ink-100 text-danger"
      : "border-success/30 bg-ink-100 text-success";

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
