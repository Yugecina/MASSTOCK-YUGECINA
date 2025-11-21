import { useState, useEffect } from 'react'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger';


/**
 * AdminErrors - "The Organic Factory" Design
 * Error logs with terminal-style code blocks
 * Severity badges: Critical=Red glow, Error=Red, Warning=Orange
 */
export function AdminErrors() {
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadErrors() {
      try {
        logger.debug('🔥 AdminErrors: Loading errors...')
        const data = await adminService.getErrors()
        logger.debug('✅ AdminErrors: Data loaded:', data)
        setErrors(data.errors || [])
      } catch (err) {
        logger.error('❌ AdminErrors: Failed to fetch errors:', {
          error: err,
          message: err.message,
          response: err.response
        })
      } finally {
        setLoading(false)
      }
    }
    loadErrors()
  }, [])

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'var(--error-light)',
          color: 'var(--error-dark)',
          glow: '0 0 20px rgba(255, 59, 48, 0.3)'
        }
      case 'error':
        return {
          bg: 'var(--error-light)',
          color: 'var(--error-dark)',
          glow: 'none'
        }
      case 'warning':
        return {
          bg: 'var(--warning-light)',
          color: 'var(--warning-dark)',
          glow: 'none'
        }
      default:
        return {
          bg: 'var(--neutral-100)',
          color: 'var(--neutral-600)',
          glow: 'none'
        }
    }
  }

  return (
    <AdminLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            className="font-display"
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}
          >
            Errors & Logs
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            System errors and performance monitoring
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : errors.length === 0 ? (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              No errors detected
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              System is running smoothly with no logged errors
            </p>
          </div>
        ) : (
          <>
            {/* Error Count Summary */}
            <div
              className="card-bento"
              style={{
                background: 'var(--canvas-pure)',
                padding: '32px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div>
                  <p
                    className="font-body"
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px'
                    }}
                  >
                    Total Errors
                  </p>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {errors.length}
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'var(--error-light)',
                      borderRadius: '8px'
                    }}
                  >
                    <p
                      className="font-body"
                      style={{
                        fontSize: '12px',
                        color: 'var(--error-dark)',
                        marginBottom: '4px',
                        fontWeight: 600
                      }}
                    >
                      CRITICAL
                    </p>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--error-dark)'
                      }}
                    >
                      {errors.filter(e => e.severity?.toLowerCase() === 'critical').length}
                    </p>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: '16px',
                      background: 'var(--warning-light)',
                      borderRadius: '8px'
                    }}
                  >
                    <p
                      className="font-body"
                      style={{
                        fontSize: '12px',
                        color: 'var(--warning-dark)',
                        marginBottom: '4px',
                        fontWeight: 600
                      }}
                    >
                      WARNING
                    </p>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: 'var(--warning-dark)'
                      }}
                    >
                      {errors.filter(e => e.severity?.toLowerCase() === 'warning').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Error List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errors.map((error, idx) => {
                const severityStyle = getSeverityStyle(error.severity)

                return (
                  <div
                    key={idx}
                    className="card-bento"
                    style={{
                      background: 'var(--canvas-pure)',
                      padding: '24px',
                      boxShadow: severityStyle.glow !== 'none' ? severityStyle.glow : 'var(--shadow-md)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3
                            className="font-display"
                            style={{
                              fontSize: '18px',
                              fontWeight: 600,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {error.type}
                          </h3>

                          {/* Severity Badge */}
                          <span
                            className="badge"
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              background: severityStyle.bg,
                              color: severityStyle.color,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            {error.severity}
                          </span>
                        </div>

                        <p
                          className="font-body"
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            marginBottom: '12px'
                          }}
                        >
                          {error.message}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '12px',
                              color: 'var(--neutral-500)'
                            }}
                          >
                            Occurrences: <strong style={{ color: 'var(--text-primary)' }}>{error.count}</strong>
                          </span>
                          <span
                            className="font-mono"
                            style={{
                              fontSize: '12px',
                              color: 'var(--neutral-500)'
                            }}
                          >
                            Last seen: {new Date(error.last_seen).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Terminal-style code block */}
                    {error.stack && (
                      <div
                        className="font-mono"
                        style={{
                          background: 'var(--neutral-900)',
                          color: 'var(--lime-500)',
                          padding: '16px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          overflow: 'auto',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all'
                        }}
                      >
                        {error.stack}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
