export function Badge({ children, variant = 'neutral' }) {
  const badgeClass = `badge badge-${variant}`
  return <span className={badgeClass}>{children}</span>
}
