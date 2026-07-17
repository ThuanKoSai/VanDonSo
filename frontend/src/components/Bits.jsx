import { STATUS_META } from "../lib/ui";

/** Thẻ trắng bo góc — khối giao diện cơ bản của toàn bộ dashboard. */
export function Card({ children, className = "" }) {
  return (
    <div className={"bg-paper2 border border-rule rounded-none shadow-none " + className}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "—", badge: "bg-paper3 text-inksoft" };
  return (
    <span className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium " + meta.badge}>
      <span className={"w-1.5 h-1.5 rounded-full " + (meta.dot || "bg-inksoft")} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = "text-forest bg-cream" }) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={"w-11 h-11 rounded-sm flex items-center justify-center shrink-0 " + tone}>
        {Icon && <Icon size={22} />}
      </div>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold text-ink leading-tight">{value}</div>
        <div className="text-sm text-inksoft">{label}</div>
        {sub && <div className="text-xs text-inksoft mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

export function SkeletonRows({ count = 3, height = "h-14" }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={"animate-pulse bg-paper3 rounded-sm " + height} />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon size={36} className="mx-auto text-rule mb-3" />}
      <div className="text-sm font-medium text-ink">{title}</div>
      {desc && <div className="text-xs text-inksoft mt-1">{desc}</div>}
    </div>
  );
}

export function PageHeader({ title, desc, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {desc && <p className="text-sm text-inksoft mt-1">{desc}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
