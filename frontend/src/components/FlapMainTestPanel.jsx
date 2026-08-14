import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';
import {
  Zap, Play, RefreshCw, Send, Radio, Shield, CheckCircle2,
  AlertCircle, Cpu, Wifi, WifiOff, Terminal, Database, Tag, Scale, User, Settings, ChevronDown, ChevronUp
} from 'lucide-react';

export const FlapMainTestPanel = () => {
  const { token } = useAuth();

  // FlapMain Integration Environment Config
  const [config, setConfig] = useState({
    serverUrl: 'https://main.esainnovation.com/api',
    deviceId: 'flap-weight-fqs5',
    deviceKey: 'flap_dev_b31e42eb7b2dd794f18e8d4f4434c33cdc78901c4e15b332',
    partnerKey: 'flap_partner_bc1da6a0907e20fe8d917dec21653ca97994386864169ac1',
    wsUrl: 'wss://main.esainnovation.com'
  });

  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Scale Trigger Form state
  const [triggerForm, setTriggerForm] = useState({
    deviceId: 'flap-weight-fqs5',
    externalUserId: 'PATIENT-1042',
    userName: 'Bikalpa Dhungana',
    callbackUrl: 'https://www.gharkodoctor.com/api/v1/webhooks/scale-readings',
    notes: 'Annual health assessment'
  });

  // NFC Tag Lookup state
  const [tagUid, setTagUid] = useState('04:A1:B2:C3:D4:E5:F6');

  // Response states
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResponse, setTriggerResponse] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Ready to trigger scale measurement session.');

  const [pollLoading, setPollLoading] = useState(false);
  const [pollResponse, setPollResponse] = useState(null);
  const [autoPoll, setAutoPoll] = useState(false);

  const [tagLoading, setTagLoading] = useState(false);
  const [tagResponse, setTagResponse] = useState(null);

  // WebSocket Live Log Stream
  const [wsConnected, setWsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);

  const addLog = (title, data, type = 'info') => {
    setLogs(prev => [
      {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString(),
        title,
        data,
        type
      },
      ...prev.slice(0, 49) // Keep last 50 entries
    ]);
  };

  // Socket.io Connection Setup
  useEffect(() => {
    try {
      const socket = io(config.wsUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setWsConnected(true);
        addLog('Socket.io Connected', `Connected to ${config.wsUrl}`, 'success');
      });

      socket.on('disconnect', (reason) => {
        setWsConnected(false);
        addLog('Socket.io Disconnected', `Reason: ${reason}`, 'warning');
      });

      socket.on('connect_error', (err) => {
        setWsConnected(false);
        addLog('Socket.io Error', err.message, 'danger');
      });

      socket.on('device_trigger_initiated', (data) => {
        addLog('⚡ device_trigger_initiated', data, 'success');
        setStatusMessage(`Device session active for ${data.external_user_id || 'User'}`);
      });

      socket.on('scale_measurement_completed', (data) => {
        addLog('🏋️ scale_measurement_completed', data, 'success');
        setPollResponse({ success: true, result: { latest_reading: data.reading || data } });
        setStatusMessage(`Measurement completed! Weight: ${data.reading?.weight_kg || data.weight_kg} kg`);
      });

      socket.on('new_scale_reading', (reading) => {
        addLog('📡 new_scale_reading', reading, 'info');
      });

      return () => {
        socket.disconnect();
      };
    } catch (err) {
      addLog('Socket Init Exception', err.message, 'danger');
    }
  }, [config.wsUrl]);

  // Auto-polling interval timer
  useEffect(() => {
    let intervalId = null;
    if (autoPoll) {
      intervalId = setInterval(() => {
        handlePollStatus(true);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoPoll, config]);

  // Handler 1: Trigger Scale Measurement
  const handleTriggerScale = async (e) => {
    if (e) e.preventDefault();
    setTriggerLoading(true);
    setTriggerResponse(null);
    setStatusMessage('Initiating device readiness for scale measurement...');

    const payload = {
      server_url: config.serverUrl,
      device_id: triggerForm.deviceId || config.deviceId,
      device_key: config.deviceKey,
      partner_key: config.partnerKey,
      external_user_id: triggerForm.externalUserId,
      user_name: triggerForm.userName,
      callback_url: triggerForm.callbackUrl,
      notes: triggerForm.notes
    };

    try {
      addLog('POST /v1/devices/:id/trigger', payload, 'info');
      const res = await api.triggerFlapMainDevice(payload, token);
      setTriggerResponse(res);
      addLog('Trigger Response', res, res.success ? 'success' : 'warning');

      if (res.success) {
        setStatusMessage(`Session initiated! Scale is READY for ${triggerForm.externalUserId}.`);
      } else {
        setStatusMessage(`Trigger notice: ${res.result?.message || 'Check server response'}`);
      }
    } catch (err) {
      setTriggerResponse({ success: false, error: err.message });
      setStatusMessage(`Trigger failed: ${err.message}`);
      addLog('Trigger Exception', err.message, 'danger');
    } finally {
      setTriggerLoading(false);
    }
  };

  // Handler 2: Poll Trigger Status & Measurement
  const handlePollStatus = async (isBackground = false) => {
    if (!isBackground) setPollLoading(true);

    const payload = {
      server_url: config.serverUrl,
      device_id: triggerForm.deviceId || config.deviceId,
      device_key: config.deviceKey,
      partner_key: config.partnerKey
    };

    try {
      const res = await api.getFlapMainTriggerStatus(payload, token);
      setPollResponse(res);
      if (!isBackground) {
        addLog('GET /v1/devices/:id/trigger-status', res, res.success ? 'success' : 'warning');
      }
    } catch (err) {
      if (!isBackground) {
        setPollResponse({ success: false, error: err.message });
        addLog('Poll Exception', err.message, 'danger');
      }
    } finally {
      if (!isBackground) setPollLoading(false);
    }
  };

  // Handler 3: NFC Tag Lookup
  const handleTagLookup = async (e) => {
    if (e) e.preventDefault();
    setTagLoading(true);
    setTagResponse(null);

    const payload = {
      server_url: config.serverUrl,
      uid: tagUid,
      device_key: config.deviceKey,
      partner_key: config.partnerKey
    };

    try {
      addLog('POST /tags/lookup', payload, 'info');
      const res = await api.lookupFlapMainTag(payload, token);
      setTagResponse(res);
      addLog('Tag Lookup Response', res, res.success ? 'success' : 'warning');
    } catch (err) {
      setTagResponse({ success: false, error: err.message });
      addLog('Tag Lookup Exception', err.message, 'danger');
    } finally {
      setTagLoading(false);
    }
  };

  const latestReading = pollResponse?.result?.latest_reading || pollResponse?.result?.active_trigger?.latest_reading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ⚡ Initiate Scale Measurement & Third-Party Integration API Card (Exact Match to User UI) */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Card Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)'
              }}
            >
              <Zap size={22} fill="#4f46e5" />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                Initiate Scale Measurement & Third-Party Integration API
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Trigger device readiness for patient readings & automatically forward data to connected external platform APIs
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f1f5f9',
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#475569',
              letterSpacing: '0.5px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: triggerLoading ? '#f59e0b' : wsConnected ? '#10b981' : '#94a3b8'
              }}
            />
            <span>{triggerLoading ? 'INITIALIZING' : wsConnected ? 'STANDBY' : 'OFFLINE'}</span>
          </div>
        </div>

        {/* Input Form Fields Row */}
        <form onSubmit={handleTriggerScale} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

            {/* Target Device ID */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                Target Device ID
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  color: '#0f172a',
                  fontWeight: 600
                }}
                value={triggerForm.deviceId}
                onChange={e => setTriggerForm({ ...triggerForm, deviceId: e.target.value })}
                placeholder="scale_hw_001 or flap-weight-fqs5"
                required
              />
            </div>

            {/* External User / Patient Handle */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                External User / Patient Handle
              </label>
              <input
                type="text"
                className="form-input"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.95rem',
                  color: '#0f172a'
                }}
                value={triggerForm.externalUserId}
                onChange={e => setTriggerForm({ ...triggerForm, externalUserId: e.target.value })}
                placeholder="e.g. PATIENT-1042 or Bikalpa"
                required
              />
            </div>

            {/* External Webhook Callback API (Optional) */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                External Webhook Callback API (Optional)
              </label>
              <input
                type="url"
                className="form-input"
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  fontFamily: 'monospace'
                }}
                value={triggerForm.callbackUrl}
                onChange={e => setTriggerForm({ ...triggerForm, callbackUrl: e.target.value })}
                placeholder="https://external-platform.com/api/v1/scale-measurement"
              />
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', pt: '6px' }}>
            <div style={{ fontSize: '0.88rem', color: '#64748b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>{statusMessage}</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className="btn btn-outline"
                style={{
                  width: 'auto',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Settings size={16} />
                <span>API Keys & Credentials</span>
                {showConfigDrawer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <button
                type="submit"
                className="btn"
                disabled={triggerLoading}
                style={{
                  width: 'auto',
                  background: '#4f46e5',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Play size={18} fill="white" />
                <span>{triggerLoading ? 'Initiating Scale Session...' : 'Initiate Scale Reading'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Collapsible API Keys & Credentials Drawer */}
        {showConfigDrawer && (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="#4f46e5" />
              <span>FlapMain Backend Credentials & Endpoints</span>
            </h4>

            <div className="grid-2" style={{ gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Server Base URL</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.82rem' }}
                  value={config.serverUrl}
                  onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Device Key (X-Device-Key)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                  value={config.deviceKey}
                  onChange={e => setConfig({ ...config, deviceKey: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Partner API Key (x-partner-key)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                  value={config.partnerKey}
                  onChange={e => setConfig({ ...config, partnerKey: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>WebSocket Endpoint</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
                  value={config.wsUrl}
                  onChange={e => setConfig({ ...config, wsUrl: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Trigger Response Payload Inspection */}
        {triggerResponse && (
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Trigger API Response Payload:</span>
              <span className={`badge ${triggerResponse.success ? 'badge-verified' : 'badge-rejected'}`}>
                {triggerResponse.result?.status || (triggerResponse.success ? '200 Session Created' : 'Error')}
              </span>
            </div>
            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', overflowX: 'auto', maxHeight: '160px', margin: 0 }}>
              {JSON.stringify(triggerResponse.result || triggerResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Sensor Telemetry & Reading Display */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="flex-between">
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={20} color="#4f46e5" />
            <span>Live Sensor Reading & Status (`GET /v1/devices/:id/trigger-status`)</span>
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={e => setAutoPoll(e.target.checked)}
              />
              <span>Auto-poll (3s)</span>
            </label>

            <button onClick={() => handlePollStatus(false)} className="btn btn-outline" disabled={pollLoading} style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}>
              <RefreshCw size={14} className={pollLoading ? 'spin' : ''} />
              <span>{pollLoading ? 'Polling...' : 'Poll Status'}</span>
            </button>
          </div>
        </div>

        {/* Live Gauges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', textAlign: 'center' }}>
          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 800, letterSpacing: '0.5px' }}>WEIGHT (KG)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              {latestReading?.weight_kg || latestReading?.weight ? `${latestReading.weight_kg || latestReading.weight} kg` : '--'}
            </div>
          </div>

          <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: '0.75rem', color: '#075985', fontWeight: 800, letterSpacing: '0.5px' }}>HEIGHT (CM)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369a1', marginTop: '2px' }}>
              {latestReading?.height_cm || latestReading?.height ? `${latestReading.height_cm || latestReading.height} cm` : '--'}
            </div>
          </div>

          <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
            <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 800, letterSpacing: '0.5px' }}>BMI INDEX</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '2px' }}>
              {latestReading?.bmi || (latestReading?.weight_kg && latestReading?.height_cm ? (latestReading.weight_kg / Math.pow(latestReading.height_cm/100, 2)).toFixed(2) : '--')}
            </div>
          </div>
        </div>

        {pollResponse && (
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
            <div style={{ marginBottom: '4px', fontWeight: 700 }}>Telemetry Stream Payload:</div>
            <pre style={{ background: '#0f172a', color: '#4ade80', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxHeight: '140px', margin: 0 }}>
              {JSON.stringify(pollResponse.result || pollResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Card Reader NFC Lookup Tool */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={20} color="#4f46e5" />
          <span>Card Reader NFC Tag Lookup (`POST /tags/lookup`)</span>
        </h4>

        <form onSubmit={handleTagLookup} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.82rem' }}>NFC Tag UID</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}
              value={tagUid}
              onChange={e => setTagUid(e.target.value)}
              placeholder="04:A1:B2:C3:D4:E5:F6"
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" disabled={tagLoading} style={{ width: 'auto', padding: '12px 20px', fontSize: '0.88rem' }}>
            <Send size={16} />
            <span>{tagLoading ? 'Searching Tag...' : 'Lookup NFC Tag'}</span>
          </button>
        </form>

        {tagResponse && (
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
            {tagResponse.result?.user && (
              <div style={{ background: '#e0f2fe', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', color: '#0369a1' }}>
                <strong>Cardholder:</strong> {tagResponse.result.user.name} ({tagResponse.result.user.flapid})
                <div>Org: {tagResponse.result.user.organization || 'FlapMain User'}</div>
              </div>
            )}

            <pre style={{ background: '#0f172a', color: '#f59e0b', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxHeight: '140px', margin: 0 }}>
              {JSON.stringify(tagResponse.result || tagResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Real-time WebSocket Log Stream Terminal */}
      <div className="card" style={{ background: '#0f172a', color: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            <Terminal size={18} />
            <span>FlapMain Live Telemetry Log Stream (`wss://main.esainnovation.com`)</span>
          </h4>
          <button
            onClick={() => setLogs([])}
            className="btn btn-outline"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', color: '#94a3b8', borderColor: '#475569' }}
          >
            Clear Log Console
          </button>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
              Awaiting live telemetry packets from FlapMain sensor...
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>[{log.time}]</span>
                  <span style={{ fontWeight: 700, color: log.type === 'success' ? '#4ade80' : log.type === 'warning' ? '#f59e0b' : log.type === 'danger' ? '#f87171' : '#38bdf8' }}>
                    {log.title}
                  </span>
                </div>
                <pre style={{ color: '#cbd5e1', marginTop: '2px', background: '#1e293b', padding: '4px 8px', borderRadius: '4px', overflowX: 'auto', margin: 0 }}>
                  {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
