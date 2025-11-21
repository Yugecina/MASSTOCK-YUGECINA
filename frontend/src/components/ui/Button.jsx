export function Button({ children, variant = 'primary', size = 'md', loading, disabled, ...props }) {
  const getClass = () => {
    let classes = 'btn btn-' + variant + ' btn-' + size;
    return classes;
  };

  return (
    <button
      className={getClass()}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <span className="spinner" style={{width: '16px', height: '16px'}}></span> : children}
    </button>
  )
}
