import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { io } from 'socket.io-client';
import {
  Activity, Zap, RefreshCw, Send, Radio, Shield, CheckCircle2,
  AlertCircle, Cpu, Wifi, WifiOff, Terminal, Database, Tag, Scale, User, FileJson
} from 'lucide-react';

export const FlapMainTestPanel = () => {
  const { token, lang } = useAuth();

  // FlapMain Integration Environment Config
  const [config, setConfig] = useState({
    serverUrl: 'https://main.esainnovation.com/api',
    deviceId: 'flap-weight-fqs5',
    deviceKey: 'flap_dev_b31e42eb7b2dd794f18e8d4f4434c33cdc78901c4e15b332',
    partnerKey: 'flap_partner_bc1da6a0907e20fe8d917dec21653ca97994386864169ac1',
    wsUrl: 'wss://main.esainnovation.com'
  });

  // Scale Trigger Form state
  const [triggerForm, setTriggerForm] = useState({
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
      });

      socket.on('scale_measurement_completed', (data) => {
        addLog('🏋️ scale_measurement_completed', data, 'success');
        setPollResponse({ success: true, result: { latest_reading: data.reading || data } });
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

    const payload = {
      server_url: config.serverUrl,
      device_id: config.deviceId,
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
    } catch (err) {
      setTriggerResponse({ success: false, error: err.message });
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
      device_id: config.deviceId,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div className="card card-gradient" style={{ padding: '20px' }}>
        <div className="flex-between">
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
              🧪 IoT Telemetry & Device Integration Suite
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={24} />
              <span>FlapMain Scale & Sensor Integration Tester</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
            {wsConnected ? <Wifi color="#4ade80" size={16} /> : <WifiOff color="#f87171" size={16} />}
            <span>{wsConnected ? 'Socket.io Connected' : 'Socket.io Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Configuration Inputs */}
      <div className="card">
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
          <Shield size={18} />
          <span>FlapMain System Credentials & Endpoints</span>
        </h4>

        <div className="grid-2" style={{ gap: '10px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Server Base URL</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.85rem' }}
              value={config.serverUrl}
              onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Device ID (Hardware scale)</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}
              value={config.deviceId}
              onChange={e => setConfig({ ...config, deviceId: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Device Key (X-Device-Key)</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              value={config.deviceKey}
              onChange={e => setConfig({ ...config, deviceKey: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Partner API Key (x-partner-key)</label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
              value={config.partnerKey}
              onChange={e => setConfig({ ...config, partnerKey: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Testing Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

        {/* 1. Scale Measurement Trigger Session */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={18} />
            <span>1. Trigger Scale Session (`POST /v1/devices/:id/trigger`)</span>
          </h4>

          <form onSubmit={handleTriggerScale} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>External User / Patient ID *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
                value={triggerForm.externalUserId}
                onChange={e => setTriggerForm({ ...triggerForm, externalUserId: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>User Display Name</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
                value={triggerForm.userName}
                onChange={e => setTriggerForm({ ...triggerForm, userName: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Webhook Callback URL</label>
              <input
                type="url"
                className="form-input"
                style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}
                value={triggerForm.callbackUrl}
                onChange={e => setTriggerForm({ ...triggerForm, callbackUrl: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Notes / Metadata</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
                value={triggerForm.notes}
                onChange={e => setTriggerForm({ ...triggerForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={triggerLoading} style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
              <Send size={16} />
              <span>{triggerLoading ? 'Initiating Trigger...' : '🚀 Execute Scale Trigger Session'}</span>
            </button>
          </form>

          {triggerResponse && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              <div className="flex-between" style={{ marginBottom: '4px' }}>
                <strong>HTTP Response Status:</strong>
                <span className={`badge ${triggerResponse.success ? 'badge-verified' : 'badge-rejected'}`}>
                  {triggerResponse.result?.status || (triggerResponse.success ? '200 OK' : 'Failed')}
                </span>
              </div>
              <pre style={{ background: '#1e293b', color: '#38bdf8', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxHeight: '150px' }}>
                {JSON.stringify(triggerResponse.result || triggerResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 2. Poll Trigger Status & Sensor Telemetry */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="flex-between">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={18} />
              <span>2. Scale Reading & Telemetry (`GET /trigger-status`)</span>
            </h4>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoPoll}
                onChange={e => setAutoPoll(e.target.checked)}
              />
              <span>Auto-poll (3s)</span>
            </label>
          </div>

          <button onClick={() => handlePollStatus(false)} className="btn btn-outline" disabled={pollLoading} style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
            <RefreshCw size={16} className={pollLoading ? 'spin' : ''} />
            <span>{pollLoading ? 'Polling FlapMain...' : '📊 Poll Scale Reading & Status'}</span>
          </button>

          {/* Telemetry Gauge Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #99f6e4' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary-hover)', fontWeight: 700 }}>WEIGHT</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-hover)' }}>
                {latestReading?.weight_kg || latestReading?.weight ? `${latestReading.weight_kg || latestReading.weight} kg` : '--'}
              </div>
            </div>

            <div style={{ background: 'var(--secondary-light)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--secondary-hover)', fontWeight: 700 }}>HEIGHT</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary-hover)' }}>
                {latestReading?.height_cm || latestReading?.height ? `${latestReading.height_cm || latestReading.height} cm` : '--'}
              </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 700 }}>BMI</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>
                {latestReading?.bmi || (latestReading?.weight_kg && latestReading?.height_cm ? (latestReading.weight_kg / Math.pow(latestReading.height_cm/100, 2)).toFixed(2) : '--')}
              </div>
            </div>
          </div>

          {pollResponse && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              <div style={{ marginBottom: '4px', fontWeight: 700 }}>FlapMain Device Telemetry Response:</div>
              <pre style={{ background: '#1e293b', color: '#4ade80', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxHeight: '150px' }}>
                {JSON.stringify(pollResponse.result || pollResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* 3. NFC Tag / Cardholder Lookup */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={18} />
            <span>3. Card Reader NFC Lookup (`POST /tags/lookup`)</span>
          </h4>

          <form onSubmit={handleTagLookup} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>NFC Tag UID (e.g., 04:A1:B2:C3:D4:E5:F6) *</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}
                value={tagUid}
                onChange={e => setTagUid(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={tagLoading} style={{ padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}>
              <Send size={16} />
              <span>{tagLoading ? 'Looking up Tag...' : '🔍 Execute Tag Lookup'}</span>
            </button>
          </form>

          {tagResponse && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.78rem' }}>
              {tagResponse.result?.user && (
                <div style={{ background: '#e0f2fe', padding: '8px', borderRadius: '4px', marginBottom: '8px', color: '#0369a1' }}>
                  <strong>Cardholder:</strong> {tagResponse.result.user.name} ({tagResponse.result.user.flapid})
                  <div>Org: {tagResponse.result.user.organization || 'FlapMain User'}</div>
                </div>
              )}

              {tagResponse.result?.display && (
                <div style={{ background: '#0f172a', color: '#38bdf8', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', marginBottom: '8px' }}>
                  <div>[OLED Line 1]: {tagResponse.result.display.line1}</div>
                  <div>[OLED Line 2]: {tagResponse.result.display.line2}</div>
                  <div>[OLED Line 3]: {tagResponse.result.display.line3}</div>
                </div>
              )}

              <pre style={{ background: '#1e293b', color: '#f59e0b', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxHeight: '150px' }}>
                {JSON.stringify(tagResponse.result || tagResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>

      {/* Real-time WebSocket Log Stream Terminal */}
      <div className="card" style={{ background: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)' }}>
        <div className="flex-between" style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            <Terminal size={18} />
            <span>FlapMain Live Telemetry Log Stream</span>
          </h4>
          <button
            onClick={() => setLogs([])}
            className="btn btn-outline"
            style={{ width: 'auto', padding: '2px 8px', fontSize: '0.72rem', color: '#94a3b8', borderColor: '#475569' }}
          >
            Clear Console
          </button>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px 0' }}>
              Waiting for live telemetry packets from FlapMain...
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
                <pre style={{ color: '#cbd5e1', marginTop: '2px', background: '#1e293b', padding: '4px 8px', borderRadius: '4px', overflowX: 'auto' }}>
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
