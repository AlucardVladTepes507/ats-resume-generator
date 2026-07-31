import React from 'react'

export default function AiOrbLoader({ size = 'medium', text, hint }) {
  return (
    <div className={`ai-orb-loader-container ${size}`}>
      <div className="ai-orb-wrapper">
        <div className="ai-orb-glow-backdrop"></div>
        <div className="ai-orb-outer-layer"></div>
        <div className="ai-orb-middle-layer"></div>
        <div className="ai-orb-inner-core"></div>
        <div className="ai-orb-center-light"></div>
      </div>
      {text && <p className="ai-orb-text">{text}</p>}
      {hint && <p className="ai-orb-hint">{hint}</p>}
    </div>
  )
}
