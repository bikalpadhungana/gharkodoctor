import React from 'react';

// Lightweight skeleton shown while a route chunk or session loads. No spinner GIFs — pure CSS.
export const PageLoader = () => (
  <div className="container page-loader" role="status" aria-live="polite">
    <div className="skeleton skeleton-hero" />
    <div className="skeleton skeleton-line" />
    <div className="skeleton skeleton-line short" />
    <div className="skeleton skeleton-card" />
    <span className="sr-only">लोड हुँदैछ… Loading…</span>
  </div>
);
