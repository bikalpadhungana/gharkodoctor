import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { fileToBase64 } from '../utils/fileUtils';
import { X, Camera, CheckSquare, FileText, Activity, UploadCloud, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const VisitReportModal = ({ isOpen, onClose, booking, onReportSubmitted }) => {
  const { lang, token } = useAuth();

  const defaultChecklist = [
    { text: lang === 'ne' ? 'बिरामीको भाइटल साईन जाँच (BP, Pulse, Temp, SpO2)' : 'Patient Vital Signs Checked', checked: true, photo: '' },
    { text: lang === 'ne' ? 'औषधि सेवन वा सुई/सलाइन प्रशासन' : 'Medication / IV Administration', checked: false, photo: '' },
    { text: lang === 'ne' ? 'घाउ सरसफाई र पट्टी (Wound Dressing)' : 'Wound Care & Dressing', checked: false, photo: '' },
    { text: lang === 'ne' ? 'रगत नमूना संकलन (Blood Sample Collection)' : 'Lab Specimen Collection', checked: false, photo: '' },
    { text: lang === 'ne' ? 'बिरामी र परिवारलाई स्वास्थ्य सल्लाह' : 'Health & Recovery Advice', checked: true, photo: '' }
  ];

  const [vitalSigns, setVitalSigns] = useState({
    bp: '120/80',
    pulse: '72',
    temp: '98.6',
    spo2: '98'
  });

  const [checklist, setChecklist] = useState(defaultChecklist);
  const [customTask, setCustomTask] = useState('');
  const [summary, setSummary] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  const toggleCheckItem = (index) => {
    setChecklist(prev => {
      const updated = [...prev];
      updated[index].checked = !updated[index].checked;
      return updated;
    });
  };

  const handleTaskPhotoUpload = async (index, file) => {
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 800, 800, 0.7);
      setChecklist(prev => {
        const updated = [...prev];
        updated[index].photo = base64;
        updated[index].checked = true;
        return updated;
      });
    } catch (err) {
      console.error('Task photo upload error', err);
    }
  };

  const handleDocumentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file, 1200, 1200, 0.8);
        setDocuments(prev => [
          ...prev,
          {
            name: file.name || 'Medical Document',
            fileData: base64,
            mimeType: file.type || 'image/jpeg'
          }
        ]);
      } catch (err) {
        console.error('Doc upload error', err);
      }
    }
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomTask = () => {
    if (!customTask.trim()) return;
    setChecklist(prev => [...prev, { text: customTask.trim(), checked: true, photo: '' }]);
    setCustomTask('');
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const completedTaskTexts = checklist
        .filter(item => item.checked)
        .map(item => item.text + (item.photo ? ' 📸 (Photo Attached)' : ''));

      // Include task photos into document list
      const taskPhotoDocuments = checklist
        .filter(item => item.photo)
        .map(item => ({
          name: `Task Photo: ${item.text.slice(0, 30)}`,
          fileData: item.photo,
          mimeType: 'image/jpeg'
        }));

      const finalDocuments = [...documents, ...taskPhotoDocuments];

      const visitReport = {
        vitalSigns,
        completedTasks: completedTaskTexts,
        summary: summary || (lang === 'ne' ? 'भिजिट सफलतापुर्वक सम्पन्न भयो।' : 'Visit completed successfully.'),
        documents: finalDocuments
      };

      const res = await api.updateBookingStatus(
        booking._id,
        'completed',
        '',
        token,
        visitReport
      );

      if (res.success) {
        if (onReportSubmitted) onReportSubmitted(res.booking);
        onClose();
      } else {
        setError(res.message || 'रिपोर्ट बुझाउन सकिएन');
      }
    } catch (err) {
      setError(lang === 'ne' ? 'सर्भर त्रुटि भयो' : 'Server error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '22px'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={22} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', background: 'var(--primary-light)', borderRadius: 'var(--radius-full)', color: 'var(--primary)', marginBottom: '6px' }}>
            <Activity size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'भिजिट सम्पन्न र मेडिकल रिपोर्ट बुझाउनुहोस्' : 'Complete Visit & Submit Medical Report'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {booking.serviceType?.displayName?.[lang] || booking.serviceType?.displayName?.ne} — {booking.patient?.name}
          </span>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-light)', color: 'var(--accent-hover)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Vital Signs */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} />
              {lang === 'ne' ? 'भाइटल साईन दर्ता (Vital Signs)' : 'Vital Signs Measurements'}
            </h4>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>रक्तचाप (BP mmHg)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="120/80"
                  value={vitalSigns.bp}
                  onChange={e => setVitalSigns({ ...vitalSigns, bp: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>नाडी दर (Pulse BPM)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="72"
                  value={vitalSigns.pulse}
                  onChange={e => setVitalSigns({ ...vitalSigns, pulse: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>शारीरिक तापक्रम (Temp °F)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="98.6"
                  value={vitalSigns.temp}
                  onChange={e => setVitalSigns({ ...vitalSigns, temp: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>अक्सिजन मात्रा (SpO2 %)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="98"
                  value={vitalSigns.spo2}
                  onChange={e => setVitalSigns({ ...vitalSigns, spo2: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Task Checklist with Camera Buttons */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckSquare size={16} />
              {lang === 'ne' ? 'सम्पन्न कार्य चेकलिस्ट र क्यामेरा फोटो' : 'Completed Task Checklist & Camera Upload'}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    background: item.checked ? 'var(--primary-light)' : 'white',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleCheckItem(idx)}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontWeight: item.checked ? 600 : 400, color: item.checked ? 'var(--primary-hover)' : 'var(--text-main)' }}>
                      {item.text}
                    </span>
                  </label>

                  {/* Camera Upload Button per checklist item */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.photo && (
                      <img
                        src={item.photo}
                        alt="Task photo"
                        style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--primary)' }}
                      />
                    )}
                    <label
                      className="btn-outline"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title={lang === 'ne' ? 'क्यामेरा फोटो लिनुहोस्' : 'Take Task Photo'}
                    >
                      <Camera size={14} />
                      <span>{item.photo ? 'Change' : 'Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files && handleTaskPhotoUpload(idx, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Task Input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'ne' ? 'अन्य थप कार्य जोड्नुहोस्...' : 'Add additional performed task...'}
                value={customTask}
                onChange={e => setCustomTask(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px' }}
              />
              <button
                type="button"
                onClick={addCustomTask}
                className="btn btn-outline"
                style={{ width: 'auto', padding: '8px 12px', fontSize: '0.8rem' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Section 3: Summary & Prescription Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{lang === 'ne' ? 'मेडिकल टिप्पणी र सल्लाह (Summary & Advice)' : 'Medical Summary & Advice'}</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={lang === 'ne' ? 'बिरामीको अवस्था, दिइएको औषधि र आगामी भिजिट सल्लाह...' : 'Clinical notes, prescribed medicines, recovery guidelines...'}
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>

          {/* Section 4: Attach Medical Documents / Lab Receipts (Data URI in MongoDB) */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UploadCloud size={16} />
                {lang === 'ne' ? 'मेडिकल कागजात तथा बिल (Lab Reports / Prescriptions)' : 'Attach Medical Documents / Reports'}
              </h4>
              <label
                className="btn btn-primary"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                <Camera size={14} />
                <span>📸 {lang === 'ne' ? 'अपलोड वा फोटो' : 'Upload File / Photo'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleDocumentUpload}
                />
              </label>
            </div>

            {documents.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                {lang === 'ne' ? 'कुनै कागजात संलग्न गरिएको छैन। क्यामेरा थिचेर ल्याब रिपोर्ट वा प्रेस्किप्सन थप्नुहोस्।' : 'No documents attached. Click upload to attach lab reports or prescriptions.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'white',
                      border: '1px solid var(--border)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    {doc.fileData?.startsWith('data:image/') && (
                      <img src={doc.fileData} alt="Thumb" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '3px' }} />
                    )}
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDocument(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-secondary" disabled={loading} style={{ padding: '12px', fontWeight: 800 }}>
            <CheckCircle2 size={18} />
            <span>{loading ? (lang === 'ne' ? 'सम्पन्न गर्दै...' : 'Submitting...') : (lang === 'ne' ? 'सम्पन्न भयो र रिपोर्ट पठाउनुहोस्' : 'Submit Report & Complete Visit')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
