import React from 'react';

/** Neutral CSS laptop frame around one real screenshot. */
export function Laptop({ shot, className = '' }) {
  return (
    <div className={`l3-laptop ${className}`}>
      <div className="l3-lid">
        <div className="l3-screen">
          <img
            src={shot.src} width={shot.w} height={shot.h} alt={shot.alt}
            loading="eager" decoding="async" draggable={false}
          />
        </div>
      </div>
      <div className="l3-base" aria-hidden="true" />
    </div>
  );
}

/** Neutral CSS iPhone frame around one real screenshot. */
export function IPhone({ shot, className = '' }) {
  return (
    <div className={`l3-phone ${className}`}>
      <div className="l3-phone-screen">
        <span className="l3-island" aria-hidden="true" />
        <img
          src={shot.src} width={shot.w} height={shot.h} alt={shot.alt}
          loading="eager" decoding="async" draggable={false}
        />
      </div>
    </div>
  );
}

export function Wordmark() {
  return (
    <span className="l3-wm" aria-hidden="true">ATLAS<i /></span>
  );
}
