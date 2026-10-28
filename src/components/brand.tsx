export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="Quorum">
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {!compact && <span className="brand-word">quorum</span>}
    </span>
  );
}
