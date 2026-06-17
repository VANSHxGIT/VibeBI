import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, ChevronRight, MapPin, Globe, Compass, Grid, List, Layers, Play 
} from 'lucide-react';

const CHART_COLORS = ['#8b5cf6', '#00f2fe', '#ff007f', '#10b981', '#f59e0b', '#3b82f6'];

// A highly simplified continent path list in a 200x100 box
const WORLD_PATHS = [
  // North America
  { name: 'North America', path: "M 25,12 L 40,8 L 50,8 L 65,12 L 68,18 L 64,25 L 58,25 L 56,35 L 50,42 L 42,42 L 44,30 L 32,25 Z" },
  // South America
  { name: 'South America', path: "M 50,44 L 56,44 L 62,50 L 60,65 L 56,76 L 50,88 L 46,72 L 44,56 Z" },
  // Greenland
  { name: 'Greenland', path: "M 46,2 L 56,2 L 58,6 L 52,10 L 46,6 Z" },
  // Eurasia
  { name: 'Eurasia', path: "M 75,10 L 90,8 L 120,6 L 150,8 L 175,10 L 180,18 L 175,25 L 165,30 L 155,25 L 150,38 L 140,42 L 132,38 L 124,45 L 116,42 L 105,42 L 98,35 L 85,38 L 80,30 L 72,25 L 70,15 Z" },
  // Africa
  { name: 'Africa', path: "M 88,40 L 98,36 L 108,36 L 118,40 L 122,46 L 118,58 L 112,68 L 106,78 L 100,74 L 98,62 L 94,56 L 86,46 Z" },
  // Australia
  { name: 'Australia', path: "M 155,60 L 168,58 L 174,62 L 168,70 L 158,68 L 150,62 Z" }
];

// Helper to project coordinates into a 200x100 grid box
const projectCoords = (lat, lng, width = 200, height = 100) => {
  const x = ((Number(lng) + 180) / 360) * width;
  // Lat ranges from 90 (top) to -90 (bottom)
  const y = ((90 - Number(lat)) / 180) * height;
  return { x, y };
};

// ==========================================
// 1. GAUGE CHART
// ==========================================
export const GaugeChartVisual = ({ title, value, aggregation, xAxis, yAxis }) => {
  const percent = Math.min(Math.max(value, 0), 100);
  const angle = (percent / 100) * 180 - 90; // -90deg to +90deg

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{ minHeight: '260px' }}>
      <svg width="220" height="140" viewBox="0 0 200 120">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff007f" />
            <stop offset="50%" stopColor="#ffd200" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background arc */}
        <path 
          d="M 20,110 A 80,80 0 0,1 180,110" 
          fill="none" 
          stroke="rgba(255, 255, 255, 0.05)" 
          strokeWidth="16" 
          strokeLinecap="round"
        />
        
        {/* Foreground colored gradient arc */}
        <path 
          d="M 20,110 A 80,80 0 0,1 180,110" 
          fill="none" 
          stroke="url(#gaugeGrad)" 
          strokeWidth="16" 
          strokeLinecap="round"
          strokeDasharray="502"
          strokeDashoffset={502 - (percent / 100) * 251} // 251 is length of semi-circle arc
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />

        {/* Needle pin */}
        <circle cx="100" cy="110" r="8" fill="#8b5cf6" filter="url(#glow)" />
        
        {/* Needle hand */}
        <line 
          x1="100" y1="110" 
          x2="100" y2="40" 
          stroke="#8b5cf6" 
          strokeWidth="3" 
          strokeLinecap="round"
          transform={`rotate(${angle} 100 110)`}
          style={{ transformOrigin: '100px 110px', transition: 'transform 1s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}
        />
      </svg>
      <div className="text-center" style={{ marginTop: '-20px' }}>
        <h4 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', textShadow: '0 0 10px rgba(139, 92, 246, 0.4)' }}>
          {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{aggregation === 'percent' || percent === value ? '%' : ''}
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {aggregation} of {yAxis || 'Rows'}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 2. FUNNEL CHART
// ==========================================
export const FunnelChartVisual = ({ chartData, yAxis }) => {
  const maxVal = useMemo(() => {
    return chartData.reduce((max, d) => Math.max(max, d.value), 1);
  }, [chartData]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 overflow-y-auto" style={{ minHeight: '260px' }}>
      <div className="w-full space-y-3">
        {chartData.slice(0, 5).map((item, idx, arr) => {
          const percentOfMax = (item.value / maxVal) * 100;
          const nextPercentOfMax = arr[idx + 1] ? (arr[idx + 1].value / maxVal) * 100 : 0;
          const color = CHART_COLORS[idx % CHART_COLORS.length];

          return (
            <div key={item.name} className="relative flex flex-col items-center">
              {/* Funnel segment */}
              <div 
                className="flex items-center justify-between px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  width: `${Math.max(percentOfMax, 25)}%`,
                  background: `linear-gradient(95deg, ${color} 0%, rgba(139, 92, 246, 0.15) 100%)`,
                  border: `1px solid ${color}40`,
                  boxShadow: `0 4px 12px ${color}15`,
                  height: '38px',
                  transition: 'all 0.5s ease'
                }}
              >
                <span className="truncate" title={item.name}>{item.name}</span>
                <span>{item.value.toLocaleString()}</span>
              </div>
              
              {/* Connector line overlay */}
              {idx < arr.length - 1 && arr.length > 1 && (
                <svg width="100%" height="16" viewBox="0 0 100 16" preserveAspectRatio="none" style={{ opacity: 0.35, marginTop: '2px', marginBottom: '2px' }}>
                  <polygon 
                    points={`${50 - percentOfMax / 2},0 ${50 + percentOfMax / 2},0 ${50 + nextPercentOfMax / 2},16 ${50 - nextPercentOfMax / 2},16`}
                    fill={`url(#funnelGrad-${idx})`}
                  />
                  <defs>
                    <linearGradient id={`funnelGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} />
                      <stop offset="100%" stopColor={CHART_COLORS[(idx + 1) % CHART_COLORS.length]} />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 3. TABLE MATRIX
// ==========================================
export const TableMatrixVisual = ({ chartData, seriesNames, xAxis, yAxis }) => {
  // Find max value in dataset for heatmap scaling
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach(row => {
      seriesNames.forEach(ser => {
        if (row[ser] && typeof row[ser] === 'number') {
          max = Math.max(max, row[ser]);
        }
      });
    });
    return max || 1;
  }, [chartData, seriesNames]);

  return (
    <div className="w-full overflow-auto max-h-[280px] border border-[rgba(255,255,255,0.08)] rounded-xl">
      <table className="w-full border-collapse text-left text-xs text-[var(--color-text-main)]">
        <thead>
          <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.1)]">
            <th className="p-3 font-semibold text-[var(--color-text-muted)] text-[10px] uppercase tracking-wider">{xAxis}</th>
            {seriesNames.map(ser => (
              <th key={ser} className="p-3 font-semibold text-[var(--color-text-muted)] text-[10px] uppercase tracking-wider text-right">{ser}</th>
            ))}
            <th className="p-3 font-bold text-[var(--color-text-muted)] text-[10px] uppercase tracking-wider text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.name} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.01)]">
              <td className="p-3 font-medium truncate max-w-[120px]">{row.name}</td>
              {seriesNames.map(ser => {
                const val = row[ser] || 0;
                const ratio = val / maxValue;
                return (
                  <td 
                    key={ser} 
                    className="p-3 text-right"
                    style={{
                      background: ratio > 0 ? `rgba(139, 92, 246, ${Math.min(ratio * 0.45, 0.5)})` : 'transparent',
                      fontWeight: ratio > 0.6 ? 'bold' : 'normal',
                      borderRight: '1px solid rgba(255,255,255,0.01)'
                    }}
                  >
                    {val.toLocaleString()}
                  </td>
                );
              })}
              <td className="p-3 text-right font-semibold bg-[rgba(255,255,255,0.02)]">
                {row._total?.toLocaleString() || row.value?.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ==========================================
// 4. MULTI-ROW CARD
// ==========================================
export const MultiRowCardVisual = ({ chartData, yAxis }) => {
  return (
    <div className="grid grid-cols-2 gap-3 p-2 h-full w-full overflow-y-auto" style={{ minHeight: '260px' }}>
      {chartData.slice(0, 6).map((item, idx) => {
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        return (
          <div 
            key={item.name}
            className="flex flex-col justify-between p-3 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]"
            style={{
              borderLeft: `4px solid ${color}`
            }}
          >
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider truncate mb-1">
              {item.name}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-white">
                {item.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-[9px] text-[var(--color-text-muted)] font-medium">
                {yAxis || 'Count'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 5. MAPS
// ==========================================
export const MapVisual = ({ chartData, type, cleanedRows, columnMetadata, yAxis }) => {
  const [mapStyle, setMapStyle] = useState('dark'); // dark, grid, hud

  // Locate lat/lng keys in columns
  const latKey = useMemo(() => {
    return Object.keys(columnMetadata).find(c => ['lat', 'latitude', 'y_coord'].includes(c.toLowerCase()));
  }, [columnMetadata]);

  const lngKey = useMemo(() => {
    return Object.keys(columnMetadata).find(c => ['lng', 'lon', 'longitude', 'x_coord'].includes(c.toLowerCase()));
  }, [columnMetadata]);

  // Coordinates data mapping
  const points = useMemo(() => {
    if (!latKey || !lngKey) return [];
    
    // Get unique coordinate points and aggregate values
    const coordsMap = {};
    
    cleanedRows.forEach(row => {
      const lat = parseFloat(row[latKey]);
      const lng = parseFloat(row[lngKey]);
      const val = yAxis ? parseFloat(row[yAxis]) : 1;

      if (!isNaN(lat) && !isNaN(lng)) {
        const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
        if (!coordsMap[key]) {
          coordsMap[key] = { lat, lng, value: 0, count: 0, label: String(row[Object.keys(row)[0]] || 'Location') };
        }
        coordsMap[key].value += isNaN(val) ? 0 : val;
        coordsMap[key].count += 1;
      }
    });

    return Object.values(coordsMap);
  }, [cleanedRows, latKey, lngKey, yAxis]);

  const maxPointVal = useMemo(() => {
    return points.reduce((max, p) => Math.max(max, p.value), 1);
  }, [points]);

  // Render instructions if coordinates are not available
  if (!latKey || !lngKey) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 h-full min-h-[260px]">
        <MapPin size={32} className="text-[var(--color-error)] mb-2" />
        <span className="text-sm font-semibold">Missing Coordinates columns</span>
        <p className="text-xs text-[var(--color-text-muted)] max-w-xs mt-1">
          This dataset does not contain columns for Latitude and Longitude. Please verify your headers (e.g. "lat", "lng", "latitude", "longitude").
        </p>
      </div>
    );
  }

  const renderNormalMap = () => (
    <div className="relative w-full h-[220px] bg-[#07050d] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      {/* Continental SVG Outline */}
      <svg viewBox="0 0 200 100" className="w-full h-full opacity-35 stroke-[0.5] stroke-purple-500 fill-[#0d091e]">
        {WORLD_PATHS.map((c, i) => (
          <path key={i} d={c.path} />
        ))}
      </svg>
      
      {/* Plotted bubble coordinates */}
      <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full">
        {points.map((p, idx) => {
          const { x, y } = projectCoords(p.lat, p.lng);
          const ratio = p.value / maxPointVal;
          const radius = type === 'map_filled' ? 12 : Math.max(ratio * 12, 3);
          const color = CHART_COLORS[idx % CHART_COLORS.length];

          return (
            <g key={idx}>
              {/* Heat glow outer ring */}
              <circle 
                cx={x} cy={y} 
                r={radius + 4} 
                fill={color} 
                opacity={type === 'map_filled' ? 0.25 : 0.15} 
                className="animate-pulse"
              />
              {/* Inner dot */}
              <circle 
                cx={x} cy={y} 
                r={radius} 
                fill={color} 
                opacity={0.8} 
                stroke="#fff" 
                strokeWidth={0.5} 
              >
                <title>{`${p.label}\nValue: ${p.value.toLocaleString()}\nLat: ${p.lat}, Lng: ${p.lng}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Mini HUD coordinates tracker list */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[9px] bg-black/60 backdrop-blur px-2 py-1 rounded border border-purple-500/20 text-[var(--color-text-muted)]">
        <Compass size={10} className="animate-spin" />
        <span>Tracking {points.length} Coordinates</span>
      </div>
    </div>
  );

  const renderAzureMap = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[240px] border border-cyan-500/20 bg-[#060e18] p-3 rounded-2xl overflow-hidden font-mono text-[10px] text-cyan-400">
      
      {/* Left HUD side: Globe graphics & coordinate plot */}
      <div className="md:col-span-8 relative border border-cyan-500/10 bg-[#020509] rounded-xl overflow-hidden">
        {/* Holographic grid scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,242,254,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
        
        {/* SV Globe projection */}
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-45 stroke-[0.8] stroke-cyan-500 fill-[#031525]">
          {/* Grid lines */}
          <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(0,242,254,0.15)" strokeDasharray="2 2" />
          <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(0,242,254,0.15)" strokeDasharray="2 2" />
          {WORLD_PATHS.map((c, i) => (
            <path key={i} d={c.path} />
          ))}
        </svg>

        {/* HUD targeting lines & coordinates */}
        <svg viewBox="0 0 200 100" className="absolute inset-0 w-full h-full">
          {points.map((p, idx) => {
            const { x, y } = projectCoords(p.lat, p.lng);
            const ratio = p.value / maxPointVal;
            const radius = Math.max(ratio * 8, 3);
            const isHovered = idx === 0; // Simulate telemetry targeting first node

            return (
              <g key={idx}>
                {/* HUD rings */}
                <circle cx={x} cy={y} r={radius + 6} fill="none" stroke="rgba(0,242,254,0.15)" strokeWidth={0.5} strokeDasharray="2 2" />
                <circle cx={x} cy={y} r={radius} fill="#00f2fe" opacity={0.6} />
                
                {isHovered && points.length > 0 && (
                  <g>
                    {/* Targeting crosshair lines */}
                    <line x1={x - 15} y1={y} x2={x + 15} y2={y} stroke="#00f2fe" strokeWidth={0.5} opacity={0.8} />
                    <line x1={x} y1={y - 15} x2={x} y2={y + 15} stroke="#00f2fe" strokeWidth={0.5} opacity={0.8} />
                    {/* Text node metadata */}
                    <text x={x + 10} y={y - 10} fill="#00f2fe" fontSize="5" fontWeight="bold">TARGET LOCATED</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute top-2 left-2 text-[8px] tracking-widest text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
          SYSTEM STATUS: ACTIVE [AZURE HUD PROLEMETRY]
        </div>
      </div>

      {/* Right HUD side: Coordinates telemetry terminal */}
      <div className="md:col-span-4 border border-cyan-500/10 bg-[#020509] p-2 rounded-xl flex flex-col h-full overflow-hidden">
        <span className="text-[8px] uppercase tracking-wider text-cyan-500 font-bold border-b border-cyan-500/20 pb-1.5 mb-1.5 flex items-center gap-1.5">
          <List size={10} />
          Telemetry Matrix logs
        </span>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {points.length > 0 ? (
            points.slice(0, 8).map((p, idx) => (
              <div key={idx} className="flex justify-between border-b border-cyan-950/20 pb-1 text-[8px]">
                <div className="flex flex-col">
                  <span className="text-white font-bold truncate max-w-[70px]">{p.label}</span>
                  <span className="text-cyan-600">lat: {p.lat.toFixed(2)} / lng: {p.lng.toFixed(2)}</span>
                </div>
                <span className="font-extrabold text-cyan-300 self-center">
                  +{p.value.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-cyan-800 text-[8px] mt-6">No telemetry links</div>
          )}
        </div>
      </div>

    </div>
  );

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Map Style Controls */}
      <div className="flex justify-end gap-1.5">
        <button 
          onClick={() => setMapStyle('dark')} 
          className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mapStyle === 'dark' ? 'bg-purple-600 text-white' : 'bg-transparent text-[var(--color-text-muted)] border border-purple-500/20'}`}
        >
          Geo Map
        </button>
        <button 
          onClick={() => setMapStyle('hud')} 
          className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${mapStyle === 'hud' ? 'bg-cyan-600 text-white' : 'bg-transparent text-[var(--color-text-muted)] border border-cyan-500/20'}`}
        >
          Azure HUD
        </button>
      </div>
      {mapStyle === 'hud' || type === 'map_azure' ? renderAzureMap() : renderNormalMap()}
    </div>
  );
};

// ==========================================
// 6. DECOMPOSITION TREE
// ==========================================
export const DecompositionTreeVisual = ({ cleanedRows, columnMetadata, yAxis, aggregation }) => {
  // Configured split columns sequence
  const [drillFields, setDrillFields] = useState([]);
  const [selectedDrillNode, setSelectedDrillNode] = useState(null); // node that is currently clicked/expanded
  const [openSplitIndex, setOpenSplitIndex] = useState(null); // which column's split menu is open

  // Get available fields to drill down into
  const availableFields = useMemo(() => {
    return Object.keys(columnMetadata).filter(col => 
      columnMetadata[col].type === 'categorical' || columnMetadata[col].type === 'boolean'
    );
  }, [columnMetadata]);

  // Step 1: Calculate root total metric
  const rootTotal = useMemo(() => {
    const vals = cleanedRows.map(r => yAxis ? parseFloat(r[yAxis]) : 1).filter(v => !isNaN(v));
    if (vals.length === 0) return 0;
    if (aggregation === 'avg') return vals.reduce((a,b)=>a+b, 0)/vals.length;
    return vals.reduce((a,b)=>a+b, 0); // default sum / count
  }, [cleanedRows, yAxis, aggregation]);

  // Step 2: Build tree column-by-column
  // We represent nodes horizontally as columns
  const treeColumns = useMemo(() => {
    const columns = [];
    
    // Root Column
    columns.push({
      field: 'Total',
      nodes: [{ id: 'total-root', label: 'All Records', value: rootTotal, percent: 100 }]
    });

    let activeFilterQuery = cleanedRows;

    // Drilled level branches
    drillFields.forEach((field, levelIndex) => {
      // Aggregate data split by this field based on current parent filter
      const parentNode = selectedDrillNode && levelIndex > 0 ? selectedDrillNode : null;
      
      // Filter rows based on previous selections (active path)
      let currentFilteredRows = activeFilterQuery;
      
      // Calculate split nodes
      const groups = {};
      currentFilteredRows.forEach(row => {
        const xVal = row[field] === null || row[field] === undefined ? 'Unknown' : String(row[field]);
        const yVal = yAxis ? parseFloat(row[yAxis]) : 1;
        if (!groups[xVal]) groups[xVal] = [];
        if (!isNaN(yVal)) groups[xVal].push(yVal);
      });

      const nodes = Object.keys(groups).map(key => {
        const arr = groups[key];
        let val = 0;
        if (aggregation === 'avg') val = arr.reduce((a,b)=>a+b, 0) / arr.length;
        else val = arr.reduce((a,b)=>a+b, 0);
        return {
          id: `${field}-${key}`,
          label: key,
          value: val,
          percent: rootTotal > 0 ? (val / rootTotal) * 100 : 0
        };
      }).sort((a,b) => b.value - a.value);

      columns.push({
        field,
        nodes
      });
    });

    return columns;
  }, [drillFields, cleanedRows, yAxis, aggregation, rootTotal, selectedDrillNode]);

  const addDrillField = (field) => {
    if (!drillFields.includes(field)) {
      setDrillFields(prev => [...prev, field]);
    }
    setOpenSplitIndex(null);
  };

  const removeDrillField = (idx) => {
    setDrillFields(prev => prev.slice(0, idx));
    setOpenSplitIndex(null);
  };

  return (
    <div className="w-full overflow-x-auto flex gap-6 p-4 border border-[rgba(255,255,255,0.06)] rounded-2xl bg-[rgba(18,14,36,0.2)] scrollbar-thin" style={{ minHeight: '300px' }}>
      {treeColumns.map((col, idx) => (
        <div key={idx} className="flex flex-col gap-3 min-w-[170px] max-w-[170px] relative">
          
          {/* Column Header */}
          <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-1.5 mb-1 text-[11px] font-extrabold text-[var(--color-text-muted)] uppercase tracking-wider">
            <span>{col.field.replace(/_/g, ' ')}</span>
            {idx > 0 && (
              <button 
                onClick={() => removeDrillField(idx)} 
                className="text-[var(--color-error)] hover:opacity-80 text-[10px]"
              >
                &times; Remove
              </button>
            )}
          </div>

          {/* Node Cards */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[240px] pr-1.5 scrollbar-thin">
            {col.nodes.slice(0, 5).map((node) => {
              const isSelected = selectedDrillNode?.id === node.id;
              
              return (
                <div 
                  key={node.id}
                  onClick={() => setSelectedDrillNode(node)}
                  className={`p-2.5 rounded-xl border cursor-pointer relative overflow-hidden transition-all duration-300 ${
                    isSelected 
                      ? 'border-[var(--color-secondary)] bg-[rgba(0,242,254,0.08)] shadow-[0_0_12px_rgba(0,242,254,0.15)]' 
                      : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-purple-500/30'
                  }`}
                >
                  {/* Share indicator mini-bar background */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-[var(--color-primary-glow)]" 
                    style={{ 
                      width: `${node.percent}%`,
                      background: isSelected ? 'var(--color-secondary)' : 'var(--color-primary)'
                    }} 
                  />

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white truncate" title={node.label}>
                      {node.label}
                    </span>
                    <span className="text-[13px] font-extrabold mt-1 text-[var(--color-secondary)]">
                      {node.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-[8px] text-[var(--color-text-muted)] mt-0.5">
                      {node.percent.toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drill Selector button */}
          {idx === treeColumns.length - 1 && drillFields.length < 3 && (
            <div className="mt-2 relative">
              <button 
                onClick={() => setOpenSplitIndex(idx)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-purple-500/35 text-purple-400 hover:bg-purple-950/15 hover:border-purple-400 transition text-[10px] font-bold"
              >
                <Plus size={12} />
                Split Dimension
              </button>
              
              {openSplitIndex === idx && (
                <div className="absolute top-8 left-0 right-0 z-50 bg-[#0d0a1b] border border-purple-900/30 rounded-xl p-2 shadow-2xl flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                  {availableFields
                    .filter(f => !drillFields.includes(f))
                    .map(f => (
                      <button 
                        key={f}
                        onClick={() => addDrillField(f)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-purple-900/20 text-[9px] text-[var(--color-text-main)] transition truncate"
                      >
                        {f.replace(/_/g, ' ')}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Connection lines between column levels */}
          {idx < treeColumns.length - 1 && (
            <div className="absolute top-[50%] right-[-24px] w-6 h-[1px] bg-purple-900/30 z-0 pointer-events-none" />
          )}

        </div>
      ))}
    </div>
  );
};

// ==========================================
// 7. RIBBON CHART
// ==========================================
export const RibbonChartVisual = ({ chartData, seriesNames }) => {
  // A Ribbon chart displays stacked elements, but orders series at each category point by rank value.
  // Ribbon connectors bridge adjacent categories with translucent bezier flow bands.
  
  // Transform data: order series for each category
  const categoriesData = useMemo(() => {
    return chartData.map(category => {
      // Map series values and filter out non-legend variables
      const sortedSeries = seriesNames.map(name => ({
        name,
        value: category[name] || 0
      })).sort((a, b) => b.value - a.value); // Sort descending (rank-order at this point!)

      const totalVal = sortedSeries.reduce((s, item) => s + item.value, 0) || 1;
      
      // Calculate stacked percentage heights
      let yOffset = 0;
      const stacked = sortedSeries.map(item => {
        const heightPercent = (item.value / totalVal) * 100;
        const startY = yOffset;
        const endY = yOffset + heightPercent;
        yOffset = endY;
        return {
          ...item,
          startY,
          endY,
          heightPercent
        };
      });

      return {
        name: category.name,
        totalVal,
        stacked
      };
    });
  }, [chartData, seriesNames]);

  return (
    <div className="relative w-full h-[240px] flex flex-col justify-between" style={{ minHeight: '260px' }}>
      
      {/* Ribbon Draw Board SVG */}
      <svg className="w-full h-[210px] bg-[rgba(255,255,255,0.01)] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.04)]">
        {/* Draw ribbon flows */}
        {categoriesData.map((cat, idx) => {
          if (idx === categoriesData.length - 1) return null;
          
          const nextCat = categoriesData[idx + 1];
          const widthStep = 100 / (categoriesData.length - 1);
          const x1 = idx * widthStep + 6; // column center percent
          const x2 = (idx + 1) * widthStep - 6;

          return cat.stacked.map((item) => {
            // Find matching series in next category
            const nextItem = nextCat.stacked.find(n => n.name === item.name);
            if (!nextItem) return null;

            const colorIdx = seriesNames.indexOf(item.name);
            const color = CHART_COLORS[colorIdx % CHART_COLORS.length];

            // Render a smooth bezier flow ribbon connecting items
            const d = `
              M ${x1}%,${item.startY}% 
              C ${(x1 + x2) / 2}%,${item.startY}% ${(x1 + x2) / 2}%,${nextItem.startY}% ${x2}%,${nextItem.startY}%
              L ${x2}%,${nextItem.endY}%
              C ${(x1 + x2) / 2}%,${nextItem.endY}% ${(x1 + x2) / 2}%,${item.endY}% ${x1}%,${item.endY}%
              Z
            `;

            return (
              <path 
                key={item.name} 
                d={d} 
                fill={color} 
                opacity="0.3" 
                className="transition hover:opacity-60 cursor-pointer"
              >
                <title>{`${item.name}\n${cat.name}: ${item.value.toLocaleString()}\n${nextCat.name}: ${nextItem.value.toLocaleString()}`}</title>
              </path>
            );
          });
        })}

        {/* Draw Column stacked blocks */}
        {categoriesData.map((cat, idx) => {
          const widthStep = 100 / (categoriesData.length - 1 || 1);
          const x = idx * widthStep;
          const colWidth = 12; // percentage width of columns

          return (
            <g key={cat.name}>
              {/* Stacked rects */}
              {cat.stacked.map((item) => {
                const colorIdx = seriesNames.indexOf(item.name);
                const color = CHART_COLORS[colorIdx % CHART_COLORS.length];
                
                return (
                  <rect 
                    key={item.name}
                    x={`${Math.max(x - colWidth/2, 2)}%`}
                    y={`${item.startY}%`}
                    width={`${colWidth}%`}
                    height={`${Math.max(item.heightPercent, 0.5)}%`}
                    fill={color}
                    rx="1.5"
                    stroke="#000"
                    strokeWidth="0.5"
                    opacity="0.9"
                  >
                    <title>{`${cat.name} - ${item.name}: ${item.value.toLocaleString()}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Mini Legend labels at bottom */}
      <div className="flex justify-center flex-wrap gap-2.5 mt-2 overflow-x-auto max-h-[36px] px-1 text-[9px] text-[var(--color-text-muted)] font-medium">
        {seriesNames.slice(0, 5).map((ser, i) => (
          <div key={ser} className="flex items-center gap-1 truncate max-w-[80px]">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="truncate">{ser}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
