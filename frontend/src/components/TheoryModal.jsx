import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, FileCode, CheckCircle } from 'lucide-react';

export default function TheoryModal({ isOpen, onClose, theoryData }) {
  const [activeConceptId, setActiveConceptId] = useState('fft_spectrum');

  if (!isOpen) return null;

  const concepts = theoryData?.concepts || [];
  const activeConcept = concepts.find(c => c.id === activeConceptId) || concepts[0];

  return (
    <div className="glass-modal-backdrop" onClick={onClose}>
      <div className="glass-modal-card" style={{ maxWidth: '920px', height: '82vh' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(200, 190, 250, 0.12)',
          background: 'rgba(21, 17, 48, 0.85)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(200, 190, 250, 0.15)',
              border: '1px solid rgba(200, 190, 250, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} color="var(--lavender-tonic)" />
            </div>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '19px',
                fontWeight: '400',
                color: 'var(--lavender-tonic)',
                letterSpacing: '0.01em'
              }}>
                CSE 220 Signals &amp; Systems &mdash; Theory &amp; Code Inspector
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: '2px' }}>
                Mathematical foundations and their implementation in your Python files
              </p>
            </div>
          </div>
          <button className="swiss-btn" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Concept Selector List */}
          <div style={{
            width: '270px',
            borderRight: '1px solid rgba(200, 190, 250, 0.1)',
            background: 'rgba(16, 13, 38, 0.65)',
            padding: '16px 12px',
            overflowY: 'auto'
          }}>
            <div className="swiss-tag" style={{ padding: '0 8px 10px 8px', color: 'var(--lavender-tonic)' }}>
              COURSE MODULES
            </div>
            {concepts.map((concept) => {
              const isActive = concept.id === activeConcept?.id;
              return (
                <button
                  key={concept.id}
                  onClick={() => setActiveConceptId(concept.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(200, 190, 250, 0.4)' : 'transparent',
                    background: isActive ? 'rgba(200, 190, 250, 0.12)' : 'transparent',
                    color: isActive ? 'var(--lavender-tonic)' : 'var(--text-secondary)',
                    fontWeight: isActive ? '700' : '500',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {concept.title}
                  </span>
                  {isActive && <ChevronRight size={14} color="var(--lavender-tonic)" />}
                </button>
              );
            })}
          </div>

          {/* Right: Formulation Details */}
          <div style={{ flex: 1, padding: '28px', overflowY: 'auto', background: 'rgba(21, 17, 48, 0.5)' }}>
            {activeConcept && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', fontFamily: 'var(--font-sans)' }}>
                    {activeConcept.title}
                  </h3>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '3px 9px',
                    borderRadius: '4px',
                    background: 'rgba(200, 190, 250, 0.15)',
                    color: 'var(--lavender-tonic)',
                    border: '1px solid rgba(200, 190, 250, 0.3)'
                  }}>
                    <FileCode size={13} />
                    {activeConcept.file}
                  </span>
                </div>

                {/* Mathematical Equation Card */}
                <div style={{
                  background: 'rgba(16, 13, 38, 0.9)',
                  border: '1px solid rgba(200, 190, 250, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 22px',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px rgba(10, 7, 24, 0.5)'
                }}>
                  <div className="swiss-tag" style={{ color: 'var(--lavender-tonic)', marginBottom: '8px' }}>
                    MATHEMATICAL FORMULATION
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    color: '#FFFFFF',
                    letterSpacing: '0.02em',
                    lineHeight: '1.6'
                  }}>
                    {activeConcept.formula}
                  </div>
                </div>

                {/* Conceptual Description */}
                <div style={{ marginBottom: '20px' }}>
                  <div className="swiss-tag" style={{ marginBottom: '6px' }}>
                    THEORETICAL EXPLANATION
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.65', fontFamily: 'var(--font-sans)' }}>
                    {activeConcept.description}
                  </p>
                </div>

                {/* Properties & Key Points */}
                <div style={{ marginBottom: '22px' }}>
                  <div className="swiss-tag" style={{ marginBottom: '8px' }}>
                    SYSTEM PROPERTIES &amp; NOTES
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeConcept.key_points?.map((pt, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '13px', color: '#E2E8F0', fontFamily: 'var(--font-sans)' }}>
                        <CheckCircle size={15} color="var(--lavender-tonic)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Python Mapping */}
                <div style={{
                  background: 'rgba(16, 13, 38, 0.7)',
                  border: '1px solid rgba(200, 190, 250, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div className="swiss-tag">
                      PYTHON SOURCE IMPLEMENTATION
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--lavender-tonic)', fontWeight: '700', marginTop: '3px' }}>
                      {activeConcept.function}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    File: ./{activeConcept.file}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
