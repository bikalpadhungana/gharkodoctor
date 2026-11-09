import React, { useState, useCallback, useRef, useEffect } from 'react';

// Tiny transient status message ("Provider assigned", "Failed: …").
// Usage: const [flash, show] = useFlash(); show('Saved'); show('Oops', 'error'); render {flash}
export const useFlash = () => {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const show = useCallback((text, kind = 'ok') => {
    clearTimeout(timer.current);
    setMsg({ text, kind });
    timer.current = setTimeout(() => setMsg(null), kind === 'error' ? 6000 : 3000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = msg ? (
    <div className={`flash ${msg.kind === 'error' ? 'error' : ''}`} role={msg.kind === 'error' ? 'alert' : 'status'}>
      {msg.text}
    </div>
  ) : null;

  return [node, show];
};
