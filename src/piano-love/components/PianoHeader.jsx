import * as React from 'react';

/* ─────────────────────────────────────────────────────────────
   PianoHeader — self-contained, no external CSS needed
   Props:
     leftContent   — ReactNode rendered on the left
     centerContent — ReactNode rendered in the centre
     rightContent  — ReactNode rendered on the right
     variant       — 'default' | 'standalone' | 'fullscreen' | 'transparent'
     className     — extra class names
───────────────────────────────────────────────────────────── */

const STYLES = `
  .ph-wrapper {
    /* Flush sticky bar — zero margin, zero border-radius, zero side padding leakage */
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    width: 100%;

    background: rgba(253, 251, 247, 0.96);
    border-bottom: 1px solid rgba(45, 45, 45, 0.10);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);

    /* Prevent ANY ancestor padding/margin from pushing it inward */
    margin: 0;
    box-sizing: border-box;
  }

  /* variant: standalone — floats inside a centred container */
  .ph-wrapper--standalone {
    position: sticky;
    top: 72px;                      /* below a site-level navbar */
    width: min(1100px, 100%);
    margin: 0 auto 16px;
    border: 1px solid rgba(45, 45, 45, 0.12);
    border-radius: 16px;
    overflow: hidden;
  }

  /* variant: fullscreen — tight, no rounding */
  .ph-wrapper--fullscreen {
    top: 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
    background: rgba(253, 251, 247, 0.98);
    box-shadow: 0 3px 20px rgba(0, 0, 0, 0.07);
  }

  /* variant: transparent */
  .ph-wrapper--transparent {
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  /* Inner row — NO max-width cap, NO horizontal padding that offsets flush layout */
  .ph-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;             /* uniform comfortable padding */
    box-sizing: border-box;
    width: 100%;
  }

  /* Left slot */
  .ph-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;                 /* don't grow — let centre own space */
    min-width: 0;
  }

  /* Centre slot */
  .ph-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
  }

  /* Right slot */
  .ph-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;                 /* don't grow */
    justify-content: flex-end;
    flex-wrap: nowrap;
    min-width: 0;
  }

  /* ── Mobile: stack centre on its own row ── */
  @media (max-width: 640px) {
    .ph-inner {
      flex-wrap: wrap;
      padding: 8px 12px;
      gap: 8px;
    }

    .ph-center {
      order: 3;                     /* push centre BELOW left+right */
      flex-basis: 100%;
      align-items: flex-start;
      text-align: left;
    }

    .ph-left  { order: 1; }
    .ph-right { order: 2; }
  }
`;

const variantClass = {
  default:     '',
  standalone:  'ph-wrapper--standalone',
  fullscreen:  'ph-wrapper--fullscreen',
  transparent: 'ph-wrapper--transparent',
};

const PianoHeader = ({
  leftContent,
  centerContent,
  rightContent,
  variant = 'default',
  className = '',
}) => {
  return (
    <>
      <style>{STYLES}</style>
      <div className={`ph-wrapper ${variantClass[variant] ?? ''} ${className}`.trim()}>
        <div className="ph-inner">
          <div className="ph-left">{leftContent}</div>
          <div className="ph-center">{centerContent}</div>
          <div className="ph-right">{rightContent}</div>
        </div>
      </div>
    </>
  );
};

export default PianoHeader;