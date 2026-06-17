import React from 'react';
import { Database, ShieldCheck, RefreshCw } from 'lucide-react';

const Navbar = ({ onReset, hasData }) => {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Database className="logo-icon" size={28} style={{ color: 'var(--color-secondary)' }} />
        <span>VibeBI</span>
        <span className="nav-badge">PROTOTYPE</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
          <span>Client-Side Secured (100% Private)</span>
        </div>
        
        {hasData && (
          <button className="btn-secondary" onClick={onReset} style={{ padding: '8px 16px', fontSize: '13px' }}>
            <RefreshCw size={14} />
            <span>Upload New</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
