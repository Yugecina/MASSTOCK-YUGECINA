export function Spinner({ size = 'md', className = '', ...props }) {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  }

  return (
    <div
      className={`spinner ${className}`}
      data-testid="loading-spinner"
      style={{
        width: sizes[size],
        height: sizes[size],
        border: '2px solid var(--primary)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        display: 'inline-block'
      }}
      {...props}
    />
  )
}
