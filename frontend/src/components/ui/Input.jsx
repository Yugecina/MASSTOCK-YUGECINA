export function Input({ label, error, disabled, ...props }) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input
        className={error ? 'input-error' : ''}
        disabled={disabled}
        {...props}
      />
      {error && <p className="text-error text-body-sm" style={{marginTop: 'var(--spacing-sm)'}}>{error}</p>}
    </div>
  )
}
