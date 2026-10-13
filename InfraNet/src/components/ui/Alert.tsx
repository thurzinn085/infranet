export default function Alert({
  kind,
  children,
}: {
  kind: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    kind === "error"
      ? "border-red-400/30 bg-red-950/40 text-red-200"
      : "border-green-400/30 bg-green-950/40 text-green-200";

  return (
    <div className={`rounded-md border px-3 py-2 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
