import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  RefreshCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import api from '../api';

const REVIEW_FIELDS = [
  ['current_price', 'Issue price'],
  ['gmp', 'GMP'],
  ['qib_subscription', 'QIB subscription'],
  ['retail_subscription', 'Retail subscription'],
  ['pe_ratio', 'P/E ratio'],
  ['revenue_growth_yoy', 'Revenue growth YoY'],
  ['profit_growth_yoy', 'Profit growth YoY'],
  ['sentiment_score', 'Sentiment score'],
];

const STAGES = [
  'Live Inputs',
  'Normalization',
  'Validation',
  'Application Handoff',
  'Allotment',
  'Sell Decision',
  'Reports',
];

const STATUS_ICONS = {
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
  NEEDS_REVIEW: ShieldAlert,
};

const NEXT_EVENT_LABELS = {
  READY_TO_APPLY: 'Simulate apply',
  APPLICATION_SIMULATED: 'Simulate mandate',
  MANDATE_SIMULATED: 'Simulate allotment',
  ALLOTMENT_SIMULATED: 'Generate exit',
  EXIT_RECOMMENDED: 'Close trade',
};

function emptyReviewForm() {
  return REVIEW_FIELDS.reduce(
    (values, [field]) => ({ ...values, [field]: '', note: '' }),
    {},
  );
}

function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return null;
  return `${Number(value).toFixed(2)}${suffix}`;
}

function formatDisplay(value, suffix = '') {
  const v = formatValue(value, suffix);
  return v !== null ? v : '—';
}

function formatTime(value) {
  if (!value) return 'Not yet';
  return new Date(value).toLocaleString();
}

export default function IPODecisionFeed() {
  const [ipos, setIpos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [sourceHealth, setSourceHealth] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [runner, setRunner] = useState({ enabled: false, interval_seconds: 20 });
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [filter, setFilter] = useState('ALL');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadShell = useCallback(async () => {
    const [ipoResponse, healthResponse, runnerResponse, notificationResponse] =
      await Promise.all([
        api.get('/ipos'),
        api.get('/sources/health'),
        api.get('/simulation/runner'),
        api.get('/notifications'),
      ]);
    setIpos(ipoResponse.data);
    setSourceHealth(healthResponse.data);
    setRunner(runnerResponse.data);
    setNotifications(notificationResponse.data);
    setSelectedId((current) => current || ipoResponse.data[0]?.id || null);
  }, []);

  const loadDetail = useCallback(async (ipoId) => {
    if (!ipoId) {
      setDetail(null);
      return;
    }
    const response = await api.get(`/ipos/${ipoId}`);
    setDetail(response.data);
  }, []);

  useEffect(() => {
    Promise.resolve()
      .then(loadShell)
      .catch(() => setError('Unable to load IPO workflow data.'));
    const interval = setInterval(() => {
      loadShell().catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [loadShell]);

  useEffect(() => {
    Promise.resolve()
      .then(() => loadDetail(selectedId))
      .catch(() => setError('Unable to load IPO detail.'));
  }, [loadDetail, selectedId]);

  const visibleIpos = useMemo(() => {
    if (filter === 'ALL') return ipos;
    return ipos.filter((ipo) => ipo.decision === filter);
  }, [filter, ipos]);

  const renderIpoList = (title, list) => {
    if (list.length === 0) return null;
    return (
      <div className="ipo-feed-section" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', margin: '0 0 12px 4px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{title}</h3>
        <div className="ipo-feed">
          {list.map((ipo) => {
            const StatusIcon = STATUS_ICONS[ipo.decision] || ShieldAlert;
            const hasData = ipo.gmp !== null || ipo.qib_subscription !== null;
            return (
              <button
                type="button"
                key={ipo.id}
                className={`ipo-card ipo-select ${selectedId === ipo.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedId(ipo.id);
                  setReviewForm(emptyReviewForm());
                }}
              >
                <div className="ipo-card-top">
                  <div className="ipo-header">
                    <h3>{ipo.company_name}</h3>
                    <span className="ipo-board-tag">{ipo.is_sme ? 'SME' : 'Mainboard'}</span>
                  </div>
                  <div className={`status-badge status-${ipo.decision.toLowerCase()}`}>
                    <StatusIcon size={14} />
                    {ipo.decision.replace('_', ' ')}
                  </div>
                </div>
                <div className="ipo-metrics-row">
                  <div className="metric-chip">
                    <span className="chip-label">GMP</span>
                    <span className={`chip-value ${ipo.gmp === null ? 'chip-empty' : ''}`}>
                      {formatDisplay(ipo.gmp)}
                    </span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-label">QIB</span>
                    <span className={`chip-value ${ipo.qib_subscription === null ? 'chip-empty' : ''}`}>
                      {formatDisplay(ipo.qib_subscription, 'x')}
                    </span>
                  </div>
                  <div className="metric-chip">
                    <span className="chip-label">Score</span>
                    <span className="chip-value">{formatDisplay(ipo.decision_score)}</span>
                  </div>
                  {!hasData && (
                    <span className="fetching-badge">⏳ Fetching data…</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const runAction = async (label, action) => {
    setBusy(label);
    setError('');
    setMessage('');
    try {
      const result = await action();
      await loadShell();
      await loadDetail(selectedId);
      return result;
    } catch (requestError) {
      setError(requestError.response?.data?.detail || `Unable to ${label}.`);
      return null;
    } finally {
      setBusy('');
    }
  };

  const runDiscovery = () =>
    runAction('run discovery', async () => {
      const response = await api.post('/discovery/run');
      setMessage(
        `Discovery checked ${response.data.records_seen} IPO input row(s) across public adapters.`,
      );
      return response;
    });

  const revalidate = () =>
    runAction('revalidate IPO', async () => {
      const response = await api.post(`/ipos/${detail.id}/revalidate`);
      setDetail(response.data.ipo);
      setMessage('Validation rules were re-run.');
      return response;
    });

  const saveReview = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      Object.entries(reviewForm)
        .filter(([field, value]) => field === 'note' || value !== '')
        .map(([field, value]) => [field, field === 'note' ? value : Number(value)]),
    );
    return runAction('save metric review', async () => {
      const response = await api.post(`/ipos/${detail.id}/review-metrics`, payload);
      setDetail(response.data);
      setMessage('Reviewer metrics were saved and validation was re-run.');
      return response;
    });
  };

  const advanceLifecycle = () =>
    runAction('advance lifecycle', async () => {
      const response = await api.post(`/ipos/${detail.id}/simulate-event`, {
        event_type: 'ADVANCE',
      });
      setDetail(response.data.ipo);
      setMessage(response.data.event.message);
      return response;
    });

  const updateRunner = (payload) =>
    runAction('update demo runner', async () => {
      const response = await api.post('/simulation/runner', payload);
      setRunner(response.data.runner);
      setMessage(payload.advance_now ? 'One timed-demo step was simulated.' : 'Demo runner updated.');
      return response;
    });

  return (
    <div className="workflow-page">
      <section className="glass-panel workflow-command">
        <div>
          <p className="eyebrow">IPO management flow</p>
          <h2><Activity size={20} /> Public inputs to reporting</h2>
          <div className="stage-strip">
            {STAGES.map((stage, index) => (
              <Fragment key={stage}>
                <span>{stage}</span>
                {index < STAGES.length - 1 && <ArrowRight size={14} />}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="command-buttons">
          <button className="btn" onClick={runDiscovery} disabled={Boolean(busy)}>
            <RefreshCcw size={16} className={busy === 'run discovery' ? 'spin' : ''} />
            Run discovery
          </button>
          <button
            className={`btn btn-muted ${runner.enabled ? 'active' : ''}`}
            onClick={() => updateRunner({ enabled: !runner.enabled })}
            disabled={Boolean(busy)}
          >
            <Clock3 size={16} />
            Timed runner {runner.enabled ? 'on' : 'off'}
          </button>
          <button
            className="icon-btn"
            title="Advance one eligible accepted IPO"
            onClick={() => updateRunner({ advance_now: true })}
            disabled={Boolean(busy)}
          >
            <DatabaseZap size={18} />
          </button>
        </div>
      </section>

      {(message || error) && (
        <div className={`notice ${error ? 'danger' : 'success'}`}>
          {error || message}
        </div>
      )}

      <div className="workflow-grid">
        <section className="queue-column">
          <div className="glass-panel">
            <div className="section-head">
              <h2>Decision Queue</h2>
              <div className="segmented-control">
                {['ALL', 'NEEDS_REVIEW', 'ACCEPTED', 'REJECTED'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={filter === item ? 'active' : ''}
                  >
                    {item.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {visibleIpos.length === 0 && (
              <div className="ipo-feed">
                <p className="empty-state">No IPO records match this decision state yet.</p>
              </div>
            )}
            {renderIpoList('Mainboard IPOs', visibleIpos.filter(ipo => !ipo.is_sme))}
            {renderIpoList('SME IPOs', visibleIpos.filter(ipo => ipo.is_sme))}
          </div>

          <div className="glass-panel source-panel">
            <h2><DatabaseZap size={18} /> Source Health</h2>
            <div className="source-list">
              {sourceHealth.length === 0 && (
                <p className="empty-state">Run discovery to inspect public adapter health.</p>
              )}
              {sourceHealth.map((source) => (
                <div key={source.source_name} className="source-row">
                  <span className={`dot ${source.status.toLowerCase()}`} />
                  <div>
                    <strong>{source.source_name}</strong>
                    <p>{source.message || `${source.records_seen} record(s) parsed.`}</p>
                  </div>
                  <time>{formatTime(source.last_attempt_at)}</time>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="detail-column">
          {!detail && (
            <div className="glass-panel">
              <p className="empty-state">Select an IPO after discovery to inspect its workflow.</p>
            </div>
          )}
          {detail && (
            <>
              <div className="glass-panel detail-hero">
                <div>
                  <p className="eyebrow">
                    Rank {detail.comparative_rank || '-'} / {detail.lifecycle_status.replaceAll('_', ' ')}
                  </p>
                  <h2>{detail.company_name}</h2>
                  <p className="muted">{detail.next_action}</p>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-muted" onClick={revalidate} disabled={Boolean(busy)}>
                    <RefreshCcw size={16} />
                    Revalidate
                  </button>
                  {NEXT_EVENT_LABELS[detail.lifecycle_status] && (
                    <button className="btn" onClick={advanceLifecycle} disabled={Boolean(busy)}>
                      <ArrowRight size={16} />
                      {NEXT_EVENT_LABELS[detail.lifecycle_status]}
                    </button>
                  )}
                </div>
              </div>

              <div className="detail-split">
                <div className="glass-panel">
                  <h2>Normalized Metrics</h2>
                  <div className="metric-grid">
                    {REVIEW_FIELDS.map(([field, label]) => (
                      <div key={field} className={detail.missing_metrics.includes(field) ? 'missing' : ''}>
                        <small>{label}</small>
                        <strong className={detail[field] === null || detail[field] === undefined ? 'value-missing' : ''}>
                          {detail[field] !== null && detail[field] !== undefined
                            ? formatDisplay(detail[field])
                            : 'Awaiting Data'}
                        </strong>
                        <span>{detail.metric_sources[field] || 'Not sourced'}</span>
                      </div>
                    ))}
                  </div>
                  <div className="reason-list">
                    {detail.decision_reasons.map((reason) => (
                      <p key={reason}>{reason}</p>
                    ))}
                  </div>
                </div>

                <div className="glass-panel">
                  <h2>Reviewer Metrics</h2>
                  <form className="review-form" onSubmit={saveReview}>
                    {REVIEW_FIELDS.map(([field, label]) => (
                      <label key={field}>
                        <span>{label}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={reviewForm[field]}
                          placeholder={detail[field] ?? 'Required'}
                          onChange={(event) =>
                            setReviewForm((current) => ({
                              ...current,
                              [field]: event.target.value,
                            }))
                          }
                        />
                      </label>
                    ))}
                    <label className="review-note">
                      <span>Audit note</span>
                      <input
                        value={reviewForm.note}
                        placeholder="RHP or reviewer source note"
                        onChange={(event) =>
                          setReviewForm((current) => ({ ...current, note: event.target.value }))
                        }
                      />
                    </label>
                    <button className="btn" disabled={Boolean(busy)}>
                      <CheckCircle2 size={16} />
                      Save review
                    </button>
                  </form>
                </div>
              </div>

              <div className="detail-split">
                <div className="glass-panel">
                  <h2>Lifecycle Timeline</h2>
                  <div className="timeline">
                    {detail.lifecycle_events.length === 0 && (
                      <p className="empty-state">No simulated application events yet.</p>
                    )}
                    {detail.lifecycle_events.map((event) => (
                      <article key={event.id}>
                        <strong>{event.event_type}</strong>
                        <p>{event.message}</p>
                        <time>{formatTime(event.created_at)}</time>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="glass-panel">
                  <h2><Bell size={18} /> Demo Notifications</h2>
                  <div className="notification-list">
                    {notifications.length === 0 && (
                      <p className="empty-state">Lifecycle events will create local notifications.</p>
                    )}
                    {notifications.slice(0, 5).map((item) => (
                      <article key={item.id}>
                        <strong>{item.title}</strong>
                        <p>{item.message}</p>
                      </article>
                    ))}
                  </div>
                  {detail.exit_rationale && (
                    <div className="exit-summary">
                      <strong>{detail.exit_rationale}</strong>
                      <span>
                        Listing {formatValue(detail.listing_price)} / Simulated PnL {formatValue(detail.simulated_pnl)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
