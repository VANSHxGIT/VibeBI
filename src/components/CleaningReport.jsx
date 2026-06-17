import React from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, Check, AlertTriangle, HelpCircle, Calendar, Hash, Type, ToggleLeft } from 'lucide-react';

const CleaningReport = ({ stats, cleaningOptions, onOptionToggle }) => {
  const score = stats.qualityScore ?? 100;
  
  // Circular progress stroke calculation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getIconForType = (type) => {
    switch (type) {
      case 'numeric': return <Hash size={14} style={{ color: 'var(--color-secondary)' }} />;
      case 'date': return <Calendar size={14} style={{ color: 'var(--color-primary)' }} />;
      case 'categorical': return <ToggleLeft size={14} style={{ color: 'var(--color-accent)' }} />;
      case 'boolean': return <Check size={14} style={{ color: 'var(--color-success)' }} />;
      default: return <Type size={14} style={{ color: 'var(--color-text-muted)' }} />;
    }
  };

  return (
    <div className="cleaning-report-container">
      {/* 1. Quality Score Circular Dial */}
      <div className="glass-card score-card">
        <h3 className="card-title-small" style={{ marginBottom: '16px' }}>Data Quality Audit</h3>
        
        <div className="circular-progress-container">
          <svg width="120" height="120">
            <circle className="circular-progress-bg" cx="60" cy="60" r={radius} />
            <motion.circle 
              className="circular-progress-bar" 
              cx="60" 
              cy="60" 
              r={radius}
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                stroke: score > 80 ? 'var(--color-success)' : score > 50 ? 'var(--color-warn)' : 'var(--color-error)'
              }}
            />
          </svg>
          <div className="circular-progress-text">{score}%</div>
        </div>

        <p style={{ fontSize: '14px', fontWeight: '600', color: score > 80 ? 'var(--color-success)' : 'var(--color-warn)' }}>
          {score > 80 ? 'Ready for Dashboard' : 'Review Imputations'}
        </p>
        
        <div className="stats-list">
          <div className="stats-row">
            <span className="stats-label">Original Rows:</span>
            <span className="stats-value">{stats.originalRows}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Cleaned Rows:</span>
            <span className="stats-value">{stats.cleanedRows}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Duplicates Removed:</span>
            <span className={`stats-value ${stats.duplicatesRemoved > 0 ? 'warn' : ''}`}>{stats.duplicatesRemoved}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Nulls Filled:</span>
            <span className={`stats-value ${stats.nullValuesFilled > 0 ? 'warn' : ''}`}>{stats.nullValuesFilled}</span>
          </div>
          <div className="stats-row">
            <span className="stats-label">Type Castings:</span>
            <span className="stats-value">{stats.typeCorrections}</span>
          </div>
        </div>
      </div>

      {/* 2. Cleaning Configuration Options */}
      <div className="glass-card">
        <h3 className="card-title-small">
          <Settings size={16} />
          <span>Cleaning Engine</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={cleaningOptions.removeDuplicates}
              onChange={() => onOptionToggle('removeDuplicates')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Remove Exact Duplicates</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={cleaningOptions.fillMissingValues}
              onChange={() => onOptionToggle('fillMissingValues')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Impute Empty Values</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={cleaningOptions.normalizeText}
              onChange={() => onOptionToggle('normalizeText')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Strip Whitespace Whitespace</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={cleaningOptions.standardizeCategories}
              onChange={() => onOptionToggle('standardizeCategories')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Normalise Category Casing</span>
          </label>
        </div>
      </div>

      {/* 3. Columns & Datatype Inspector */}
      {stats.columnMetadata && (
        <div className="glass-card">
          <h3 className="card-title-small">Schema Inspector</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
            {Object.keys(stats.columnMetadata).map((colName) => {
              const meta = stats.columnMetadata[colName];
              return (
                <div 
                  key={colName} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    {getIconForType(meta.type)}
                    <span 
                      style={{ 
                        fontWeight: '600', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap'
                      }}
                      title={colName}
                    >
                      {colName}
                    </span>
                  </div>
                  <span 
                    style={{ 
                      fontSize: '10px', 
                      color: 'var(--color-text-muted)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {meta.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningReport;
