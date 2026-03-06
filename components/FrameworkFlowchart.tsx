import React from 'react';

const flowchartStyles = `
  .bg           { fill: #0e1117; }
  .grid-line    { stroke: #161b25; fill: none; }
  .start-rect   { fill: #161b25; stroke: #252d3d; }
  .start-text   { fill: #7a8499; }
  .node-rect    { fill: #1c2233; stroke: #354060; }
  .node-text    { fill: #e8eaf0; }
  .node-sub     { fill: #7a8499; }
  .q-label      { fill: #7a8499; }
  .conn         { stroke: #354060; fill: none; }
  .label-bg     { fill: #0e1117; }
  .yes-text     { fill: #3ecf8e; }
  .no-text      { fill: #e05c5c; }
  .yes-line     { stroke: #3ecf8e; fill: none; }
  .no-line      { stroke: #e05c5c; fill: none; }
  .yes-arrow    { fill: #3ecf8e; }
  .no-arrow     { fill: #e05c5c; }
  .conn-arrow   { fill: #354060; }
  .t-rect       { fill: #1a4a37; stroke: #3ecf8e; }
  .t-label      { fill: #3ecf8e; }
  .t-heading    { fill: #3ecf8e; }
  .t-body       { fill: rgba(232,234,240,0.75); }
  .d-rect       { fill: #1a2e5c; stroke: #3578e5; }
  .d-label      { fill: #3578e5; }
  .d-heading    { fill: #3578e5; }
  .d-body       { fill: rgba(232,234,240,0.75); }
  .footer       { fill: #354060; }

  @media (prefers-color-scheme: light) {
    .bg           { fill: #f5f6f8; }
    .grid-line    { stroke: #ebedf2; }
    .start-rect   { fill: #ffffff; stroke: #dde1ea; }
    .start-text   { fill: #6b7385; }
    .node-rect    { fill: #ffffff; stroke: #c8cfe0; }
    .node-text    { fill: #1a1f2e; }
    .node-sub     { fill: #6b7385; }
    .q-label      { fill: #6b7385; }
    .conn         { stroke: #b0b8cc; }
    .label-bg     { fill: #f5f6f8; }
    .yes-text     { fill: #1a9e65; }
    .no-text      { fill: #c0392b; }
    .yes-line     { stroke: #1a9e65; }
    .no-line      { stroke: #c0392b; }
    .yes-arrow    { fill: #1a9e65; }
    .no-arrow     { fill: #c0392b; }
    .conn-arrow   { fill: #b0b8cc; }
    .t-rect       { fill: #e6f7f0; stroke: #1a9e65; }
    .t-label      { fill: #1a9e65; }
    .t-heading    { fill: #1a9e65; }
    .t-body       { fill: rgba(26,31,46,0.75); }
    .d-rect       { fill: #e8eef9; stroke: #1f5fbf; }
    .d-label      { fill: #1f5fbf; }
    .d-heading    { fill: #1f5fbf; }
    .d-body       { fill: rgba(26,31,46,0.75); }
    .footer       { fill: #b0b8cc; }
  }
`;

export default function FrameworkFlowchart(): React.ReactElement {
  return (
    <figure style={{ width: '100%', maxWidth: '640px', margin: '2rem auto' }}>
      <svg
        viewBox="0 0 700 840"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', display: 'block' }}
        role="img"
        aria-label="Decision flowchart for choosing between Trellis Docs and Docusaurus"
      >
        <defs>
          <style>{flowchartStyles}</style>

          <marker id="fc-mc" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7 Z" className="conn-arrow" />
          </marker>
          <marker id="fc-my" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7 Z" className="yes-arrow" />
          </marker>
          <marker id="fc-mn" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1,1 L7,4 L1,7 Z" className="no-arrow" />
          </marker>

          <filter id="fc-glow-t" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="fc-glow-d" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          <pattern id="fc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" strokeWidth="1" className="grid-line" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width="700" height="840" rx="16" className="bg" />
        <rect width="700" height="840" rx="16" fill="url(#fc-grid)" opacity="0.5" />

        {/* START */}
        <rect x="225" y="28" width="250" height="44" rx="22" strokeWidth="1" className="start-rect" />
        <text x="350" y="55" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="12" letterSpacing="2" className="start-text">SETTING UP A DOCS SITE?</text>
        <line x1="350" y1="72" x2="350" y2="104" strokeWidth="1.5" markerEnd="url(#fc-mc)" className="conn" />

        {/* Q1 */}
        <rect x="60" y="106" width="580" height="78" rx="10" strokeWidth="1" className="node-rect" />
        <text x="350" y="130" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" letterSpacing="1.5" className="q-label">Q1</text>
        <text x="350" y="153" textAnchor="middle" fontSize="17" fontWeight="500" className="node-text">Is your environment behind a corporate firewall?</text>
        <text x="350" y="175" textAnchor="middle" fontSize="13" className="node-sub">(where Algolia can't reach)</text>
        {/* Q1 YES → Trellis */}
        <line x1="640" y1="145" x2="682" y2="145" strokeWidth="1.5" className="yes-line" />
        <line x1="682" y1="145" x2="682" y2="704" strokeWidth="1.5" className="yes-line" />
        <line x1="682" y1="704" x2="622" y2="704" strokeWidth="1.5" markerEnd="url(#fc-my)" className="yes-line" />
        <rect x="644" y="132" width="38" height="19" rx="4" className="label-bg" />
        <text x="663" y="145" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="yes-text">YES</text>
        {/* Q1 NO ↓ */}
        <line x1="350" y1="184" x2="350" y2="216" strokeWidth="1.5" markerEnd="url(#fc-mc)" className="conn" />
        <rect x="326" y="189" width="48" height="19" rx="4" className="label-bg" />
        <text x="350" y="202" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="no-text">NO</text>

        {/* Q2 */}
        <rect x="60" y="218" width="580" height="78" rx="10" strokeWidth="1" className="node-rect" />
        <text x="350" y="242" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" letterSpacing="1.5" className="q-label">Q2</text>
        <text x="350" y="265" textAnchor="middle" fontSize="17" fontWeight="500" className="node-text">Is writer-first setup more important than a large plugin ecosystem?</text>
        <text x="350" y="287" textAnchor="middle" fontSize="13" className="node-sub">(vs. years of community plugins and battle-tested upgrades)</text>
        {/* Q2 NO → Docusaurus */}
        <line x1="60" y1="257" x2="18" y2="257" strokeWidth="1.5" className="no-line" />
        <line x1="18" y1="257" x2="18" y2="704" strokeWidth="1.5" className="no-line" />
        <line x1="18" y1="704" x2="58" y2="704" strokeWidth="1.5" markerEnd="url(#fc-mn)" className="no-line" />
        <rect x="22" y="244" width="38" height="19" rx="4" className="label-bg" />
        <text x="41" y="257" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="no-text">NO</text>
        {/* Q2 YES ↓ */}
        <line x1="350" y1="296" x2="350" y2="328" strokeWidth="1.5" markerEnd="url(#fc-mc)" className="conn" />
        <rect x="326" y="301" width="48" height="19" rx="4" className="label-bg" />
        <text x="350" y="314" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="yes-text">YES</text>

        {/* Q3 */}
        <rect x="60" y="330" width="580" height="78" rx="10" strokeWidth="1" className="node-rect" />
        <text x="350" y="354" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" letterSpacing="1.5" className="q-label">Q3</text>
        <text x="350" y="377" textAnchor="middle" fontSize="17" fontWeight="500" className="node-text">Do you prefer React-light customization over swizzling?</text>
        <text x="350" y="399" textAnchor="middle" fontSize="13" className="node-sub">(no ejecting components, no reconciling upstream updates manually)</text>
        {/* Q3 NO → Docusaurus */}
        <line x1="60" y1="369" x2="36" y2="369" strokeWidth="1.5" className="no-line" />
        <line x1="36" y1="369" x2="36" y2="704" strokeWidth="1.5" className="no-line" />
        <line x1="36" y1="704" x2="58" y2="704" strokeWidth="1.5" markerEnd="url(#fc-mn)" className="no-line" />
        <rect x="40" y="356" width="38" height="19" rx="4" className="label-bg" />
        <text x="59" y="369" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="no-text">NO</text>
        {/* Q3 YES ↓ */}
        <line x1="350" y1="408" x2="350" y2="440" strokeWidth="1.5" markerEnd="url(#fc-mc)" className="conn" />
        <rect x="326" y="413" width="48" height="19" rx="4" className="label-bg" />
        <text x="350" y="426" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="yes-text">YES</text>

        {/* Q4 */}
        <rect x="60" y="442" width="580" height="78" rx="10" strokeWidth="1" className="node-rect" />
        <text x="350" y="466" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" letterSpacing="1.5" className="q-label">Q4</text>
        <text x="350" y="489" textAnchor="middle" fontSize="17" fontWeight="500" className="node-text">Does precise, metadata-driven search matter more than Algolia?</text>
        <text x="350" y="511" textAnchor="middle" fontSize="13" className="node-sub">(targeted keyword results vs. full-text indexing noise)</text>
        {/* Q4 YES → Trellis */}
        <line x1="640" y1="481" x2="664" y2="481" strokeWidth="1.5" className="yes-line" />
        <line x1="664" y1="481" x2="664" y2="704" strokeWidth="1.5" className="yes-line" />
        <line x1="664" y1="704" x2="622" y2="704" strokeWidth="1.5" markerEnd="url(#fc-my)" className="yes-line" />
        <rect x="644" y="468" width="38" height="19" rx="4" className="label-bg" />
        <text x="663" y="481" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="yes-text">YES</text>
        {/* Q4 NO ↓ */}
        <line x1="350" y1="520" x2="350" y2="552" strokeWidth="1.5" markerEnd="url(#fc-mc)" className="conn" />
        <rect x="326" y="525" width="48" height="19" rx="4" className="label-bg" />
        <text x="350" y="538" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="no-text">NO</text>

        {/* Q5 */}
        <rect x="60" y="554" width="580" height="78" rx="10" strokeWidth="1" className="node-rect" />
        <text x="350" y="578" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" letterSpacing="1.5" className="q-label">Q5</text>
        <text x="350" y="601" textAnchor="middle" fontSize="17" fontWeight="500" className="node-text">Are you a solo writer, small team, or early-stage startup?</text>
        <text x="350" y="623" textAnchor="middle" fontSize="13" className="node-sub">(who needs production-ready fast, not highly customized)</text>
        {/* Q5 YES → Trellis */}
        <line x1="350" y1="632" x2="350" y2="660" strokeWidth="1.5" className="yes-line" />
        <line x1="350" y1="660" x2="580" y2="660" strokeWidth="1.5" className="yes-line" />
        <line x1="580" y1="660" x2="580" y2="682" strokeWidth="1.5" markerEnd="url(#fc-my)" className="yes-line" />
        <rect x="326" y="636" width="48" height="19" rx="4" className="label-bg" />
        <text x="350" y="649" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="yes-text">YES</text>
        {/* Q5 NO → Docusaurus */}
        <line x1="60" y1="593" x2="54" y2="593" strokeWidth="1.5" className="no-line" />
        <line x1="54" y1="593" x2="54" y2="704" strokeWidth="1.5" className="no-line" />
        <line x1="54" y1="704" x2="58" y2="704" strokeWidth="1.5" markerEnd="url(#fc-mn)" className="no-line" />
        <rect x="40" y="580" width="38" height="19" rx="4" className="label-bg" />
        <text x="59" y="593" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="11" fontWeight="600" className="no-text">NO</text>

        {/* OUTCOME: DOCUSAURUS */}
        <rect x="8" y="684" width="290" height="126" rx="12" strokeWidth="1.5" filter="url(#fc-glow-d)" className="d-rect" />
        <text x="153" y="708" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="10" letterSpacing="2" className="d-label">USE THIS FRAMEWORK</text>
        <text x="153" y="736" textAnchor="middle" fontFamily="'DM Serif Display',serif" fontSize="26" className="d-heading">Docusaurus</text>
        <text x="153" y="758" textAnchor="middle" fontSize="13" className="d-body">Large team · Complex product</text>
        <text x="153" y="776" textAnchor="middle" fontSize="13" className="d-body">React engineers available</text>
        <text x="153" y="794" textAnchor="middle" fontSize="13" className="d-body">Mature ecosystem matters most</text>

        {/* OUTCOME: TRELLIS */}
        <rect x="402" y="684" width="290" height="126" rx="12" strokeWidth="1.5" filter="url(#fc-glow-t)" className="t-rect" />
        <text x="547" y="708" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="10" letterSpacing="2" className="t-label">USE THIS FRAMEWORK</text>
        <text x="547" y="736" textAnchor="middle" fontFamily="'DM Serif Display',serif" fontSize="26" className="t-heading">Trellis Docs</text>
        <text x="547" y="758" textAnchor="middle" fontSize="13" className="t-body">Firewall · Writer-first · Fast setup</text>
        <text x="547" y="776" textAnchor="middle" fontSize="13" className="t-body">Precise metadata-driven search</text>
        <text x="547" y="794" textAnchor="middle" fontSize="13" className="t-body">Solo writer or small team</text>

        {/* Footer */}
        <text x="350" y="826" textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize="10" letterSpacing="1" className="footer">trellisdocs.dev</text>
      </svg>

      <figcaption style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>
        Follow each question to find the right framework for your use case.
      </figcaption>
    </figure>
  );
}