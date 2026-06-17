import React from 'react';
import { FileDown, FileCode, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExportPanel = ({ cleanedRows, widgets, tableName, columnMetadata }) => {
  
  // 1. Download Cleaned CSV
  const downloadCSV = () => {
    if (cleanedRows.length === 0) return;
    
    const headers = Object.keys(cleanedRows[0]);
    const csvRows = [headers.join(',')];
    
    cleanedRows.forEach(row => {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = String(val === null || val === undefined ? '' : val).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${tableName}_cleaned.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download Cleaned Excel
  const downloadExcel = () => {
    if (cleanedRows.length === 0) return;
    
    const worksheet = XLSX.utils.json_to_sheet(cleanedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Data");
    
    XLSX.writeFile(workbook, `${tableName}_cleaned.xlsx`);
  };

  // 3. Print / Save to PDF
  const triggerPDF = () => {
    window.print();
  };

  // 4. Download Standalone Interactive HTML Report (Offline Capable)
  const downloadInteractiveHTML = () => {
    if (cleanedRows.length === 0) return;

    // We generate a self-contained, highly interactive dashboard in a single HTML file.
    // It embeds the data and uses CDNs for Tailwind/ApexCharts, rendering custom visuals via injected DOM scripts.
    const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tableName} - Interactive Data Dashboard</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- ApexCharts -->
  <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #06040a;
      color: #f3f1f6;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(0, 242, 254, 0.06) 0%, transparent 40%);
      background-attachment: fixed;
    }
    h1, h2, h3, h4 {
      font-family: 'Outfit', sans-serif;
    }
    .glass-card {
      background: rgba(18, 14, 36, 0.45);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(139, 92, 246, 0.15);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    }
    .apexcharts-tooltip {
      background: #0d0a1b !important;
      border: 1px solid rgba(139, 92, 246, 0.3) !important;
      color: #f3f1f6 !important;
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.2);
      border-radius: 2px;
    }
  </style>
  <script>
    // Embedded Data and Configs
    const dataset = ${JSON.stringify(cleanedRows)};
    const widgets = ${JSON.stringify(widgets)};
    const columnMetadata = ${JSON.stringify(columnMetadata)};
    const CHART_COLORS = ['#8b5cf6', '#00f2fe', '#ff007f', '#10b981', '#f59e0b', '#3b82f6'];

    const WORLD_PATHS = [
      { name: 'North America', path: "M 25,12 L 40,8 L 50,8 L 65,12 L 68,18 L 64,25 L 58,25 L 56,35 L 50,42 L 42,42 L 44,30 L 32,25 Z" },
      { name: 'South America', path: "M 50,44 L 56,44 L 62,50 L 60,65 L 56,76 L 50,88 L 46,72 L 44,56 Z" },
      { name: 'Greenland', path: "M 46,2 L 56,2 L 58,6 L 52,10 L 46,6 Z" },
      { name: 'Eurasia', path: "M 75,10 L 90,8 L 120,6 L 150,8 L 175,10 L 180,18 L 175,25 L 165,30 L 155,25 L 150,38 L 140,42 L 132,38 L 124,45 L 116,42 L 105,42 L 98,35 L 85,38 L 80,30 L 72,25 L 70,15 Z" },
      { name: 'Africa', path: "M 88,40 L 98,36 L 108,36 L 118,40 L 122,46 L 118,58 L 112,68 L 106,78 L 100,74 L 98,62 L 94,56 L 86,46 Z" },
      { name: 'Australia', path: "M 155,60 L 168,58 L 174,62 L 168,70 L 158,68 L 150,62 Z" }
    ];

    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#8b5cf6',
            secondary: '#00f2fe',
            accent: '#ff007f',
          }
        }
      }
    }
  </script>
</head>
<body class="p-6 md:p-12 min-h-screen">
  
  <div class="max-w-7xl mx-auto space-y-8">
    
    <!-- Header -->
    <header class="flex justify-between items-center border-b border-purple-900/30 pb-6">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          ${tableName} Report
        </h1>
        <p class="text-sm text-gray-400 mt-1">Interactive standalone dashboard generated by VibeBI</p>
      </div>
      <div class="flex items-center gap-2 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-full font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="m9 12 2 2 4-4"/></svg>
        Offline Interactive Dashboard
      </div>
    </header>

    <!-- Filters Section -->
    <div id="filters-container" class="glass-card rounded-2xl p-6 flex flex-wrap items-center gap-6">
      <div class="flex items-center gap-2 text-sm text-gray-300 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        <span>Slicer Filters:</span>
      </div>
    </div>

    <!-- KPI Metrics Row -->
    <div id="kpi-row" class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>

    <!-- Visual Charts Workspace Grid -->
    <div id="charts-grid" class="grid grid-cols-1 md:grid-cols-2 gap-8"></div>

  </div>

  <script>
    // State management
    let activeFilters = {};
    let activeCharts = {};
    let decompTreePaths = {}; // widgetId -> array of drill columns

    // Pivot Data Aggregation inside stand-alone HTML
    function aggregatePivot(data, xAxis, yAxis, legendCol, type) {
      if (!data || data.length === 0 || !xAxis) return { chartData: [], seriesNames: [] };

      // Simple aggregation
      if (!legendCol) {
        const groups = {};
        data.forEach(row => {
          const xVal = row[xAxis] === null || row[xAxis] === undefined ? 'Unknown' : String(row[xAxis]);
          const yVal = yAxis ? Number(row[yAxis]) : 0;

          if (!groups[xVal]) groups[xVal] = { sum: 0, count: 0 };
          if (yAxis) {
            if (!isNaN(yVal) && row[yAxis] !== null && row[yAxis] !== undefined) {
              groups[xVal].sum += yVal;
              groups[xVal].count += 1;
            }
          } else {
            groups[xVal].sum += 1;
            groups[xVal].count += 1;
          }
        });

        const chartData = Object.keys(groups).map(key => {
          let val = 0;
          if (type === 'sum') val = groups[key].sum;
          else if (type === 'avg') val = groups[key].count > 0 ? (groups[key].sum / groups[key].count) : 0;
          else if (type === 'count') val = groups[key].count;
          return { name: key, value: Number(val.toFixed(2)) };
        });

        return { chartData, seriesNames: ['value'] };
      }

      // pivoted aggregation
      const groups = {};
      const seriesSet = new Set();

      data.forEach(row => {
        const xVal = row[xAxis] === null || row[xAxis] === undefined ? 'Unknown' : String(row[xAxis]);
        const legendVal = row[legendCol] === null || row[legendCol] === undefined ? 'Unknown' : String(row[legendCol]);
        const yVal = yAxis ? Number(row[yAxis]) : 0;

        seriesSet.add(legendVal);
        if (!groups[xVal]) groups[xVal] = {};
        if (!groups[xVal][legendVal]) groups[xVal][legendVal] = { sum: 0, count: 0 };

        if (yAxis) {
          if (!isNaN(yVal) && row[yAxis] !== null && row[yAxis] !== undefined) {
            groups[xVal][legendVal].sum += yVal;
            groups[xVal][legendVal].count += 1;
          }
        } else {
          groups[xVal][legendVal].sum += 1;
          groups[xVal][legendVal].count += 1;
        }
      });

      const seriesNames = Array.from(seriesSet).sort();
      const chartData = Object.keys(groups).map(xVal => {
        const item = { name: xVal };
        let total = 0;
        seriesNames.forEach(s => {
          const g = groups[xVal][s];
          if (g) {
            let val = 0;
            if (type === 'sum') val = g.sum;
            else if (type === 'avg') val = g.count > 0 ? (g.sum / g.count) : 0;
            else if (type === 'count') val = g.count;
            item[s] = Number(val.toFixed(2));
            total += item[s];
          } else {
            item[s] = 0;
          }
        });
        item._total = Number(total.toFixed(2));
        return item;
      });

      return { chartData, seriesNames };
    }

    function calculateKPI(data, col, type) {
      if (!data || data.length === 0) return 0;
      if (type === 'count') return data.length;
      if (!col) return 0;

      const validVals = data
        .map(row => Number(row[col]))
        .filter(val => !isNaN(val) && val !== null && val !== undefined);

      if (validVals.length === 0) return 0;

      if (type === 'sum') return validVals.reduce((a, b) => a + b, 0);
      if (type === 'avg') return validVals.reduce((a, b) => a + b, 0) / validVals.length;
      if (type === 'max') return Math.max(...validVals);
      if (type === 'min') return Math.min(...validVals);
      return 0;
    }

    // Coordinates projection helper
    function projectCoords(lat, lng) {
      const x = ((Number(lng) + 180) / 360) * 100; // percent width
      const y = ((90 - Number(lat)) / 180) * 100; // percent height
      return { x, y };
    }

    // Filter logic
    function getFilteredData() {
      let filtered = dataset;
      Object.keys(activeFilters).forEach((col) => {
        const val = activeFilters[col];
        if (val) {
          filtered = filtered.filter(row => String(row[col]) === String(val));
        }
      });
      return filtered;
    }

    // Dynamic rendering of custom visuals (Decomposition Tree, Gauge, maps, funnels)
    function drawCustomVisuals() {
      const filteredData = getFilteredData();
      
      widgets.forEach((widget) => {
        const container = document.getElementById(\`custom-visual-container-\${widget.id}\`);
        if (!container) return;

        const { chartData, seriesNames } = aggregatePivot(filteredData, widget.xAxis, widget.yAxis, widget.legend, widget.aggregation);

        // ==========================================
        // GAUGE CHART
        // ==========================================
        if (widget.type === 'gauge') {
          const sumVal = chartData.reduce((acc, d) => acc + d.value, 0);
          const gaugeVal = widget.aggregation === 'avg' ? sumVal / (chartData.length || 1) : sumVal;
          const percent = Math.min(Math.max(gaugeVal, 0), 100);
          const angle = (percent / 100) * 180 - 90;

          container.innerHTML = \`
            <div class="flex flex-col items-center justify-center h-full w-full py-4">
              <svg width="220" height="120" viewBox="0 0 200 120">
                <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="16" stroke-linecap="round"/>
                <path id="gauge-arc-\${widget.id}" d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="url(#gaugeGradHTML)" stroke-width="16" stroke-linecap="round" stroke-dasharray="251" stroke-dashoffset="\${251 - (percent/100)*251}"/>
                <circle cx="100" cy="110" r="8" fill="#8b5cf6" />
                <line x1="100" y1="110" x2="100" y2="40" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" transform="rotate(\${angle} 100 110)" style="transform-origin: 100px 110px;" />
                <defs>
                  <linearGradient id="gaugeGradHTML" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#ff007f" />
                    <stop offset="50%" stop-color="#ffd200" />
                    <stop offset="100%" stop-color="#00f2fe" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="text-center -mt-4">
                <h4 class="text-2xl font-extrabold text-white">\${gaugeVal.toLocaleString(undefined, {maximumFractionDigits:1})}\${percent === gaugeVal ? '%' : ''}</h4>
                <span class="text-[9px] uppercase tracking-wider text-gray-500">\${widget.aggregation} of \${widget.yAxis || 'Records'}</span>
              </div>
            </div>
          \`;
        }

        // ==========================================
        // FUNNEL CHART
        // ==========================================
        else if (widget.type === 'funnel') {
          const maxVal = chartData.reduce((max, d) => Math.max(max, d.value), 1);
          container.innerHTML = \`
            <div class="w-full space-y-2 p-2">
              \${chartData.slice(0, 5).map((item, idx) => {
                const pct = (item.value / maxVal) * 100;
                const color = CHART_COLORS[idx % CHART_COLORS.length];
                return \`
                  <div class="flex flex-col items-center">
                    <div class="flex justify-between items-center text-[10px] px-3 py-1.5 rounded-lg text-white font-bold h-[32px]" style="width: \${Math.max(pct, 25)}%; background: linear-gradient(90deg, \${color} 0%, rgba(139,92,246,0.1) 100%); border: 1px solid \${color}30">
                      <span class="truncate">\${item.name}</span>
                      <span>\${item.value.toLocaleString()}</span>
                    </div>
                  </div>
                \`;
              }).join('')}
            </div>
          \`;
        }

        // ==========================================
        // MATRIX TABLE
        // ==========================================
        else if (widget.type === 'table_matrix') {
          const maxVal = Math.max(...chartData.map(r => Math.max(...seriesNames.map(s => r[s] || 0))), 1);
          container.innerHTML = \`
            <div class="w-full overflow-auto max-h-[220px] rounded-lg border border-purple-500/10 text-[11px] scrollbar-thin">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-purple-950/20 border-b border-purple-900/30 text-gray-400">
                    <th class="p-2">\${widget.xAxis}</th>
                    \${seriesNames.map(s => \`<th class="p-2 text-right">\${s}</th>\`).join('')}
                    <th class="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  \${chartData.map(row => \`
                    <tr class="border-b border-purple-900/10 hover:bg-white/5">
                      <td class="p-2 font-bold">\${row.name}</td>
                      \${seriesNames.map(s => {
                        const v = row[s] || 0;
                        const opacity = v / maxVal;
                        return \`<td class="p-2 text-right" style="background: rgba(139, 92, 246, \${opacity * 0.35})">\${v.toLocaleString()}</td>\`;
                      }).join('')}
                      <td class="p-2 text-right bg-white/5 font-semibold">\${(row._total || row.value).toLocaleString()}</td>
                    </tr>
                  \`).join('')}
                </tbody>
              </table>
            </div>
          \`;
        }

        // ==========================================
        // MULTI-ROW CARD
        // ==========================================
        else if (widget.type === 'multi_row_card') {
          container.innerHTML = \`
            <div class="grid grid-cols-2 gap-2 p-1">
              \${chartData.slice(0, 6).map((item, idx) => \`
                <div class="bg-white/5 border border-purple-950/30 rounded-xl p-2.5 flex flex-col justify-between" style="border-left: 3px solid \${CHART_COLORS[idx % CHART_COLORS.length]}">
                  <span class="text-[9px] uppercase tracking-wider text-gray-400 font-bold truncate">\${item.name}</span>
                  <span class="text-lg font-extrabold text-white mt-1">\${item.value.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                </div>
              \`).join('')}
            </div>
          \`;
        }

        // ==========================================
        // SVG MAPS
        // ==========================================
        else if (['map_lat_long', 'map_filled', 'map_azure'].includes(widget.type)) {
          const latCol = Object.keys(columnMetadata).find(c => ['lat', 'latitude'].includes(c.toLowerCase()));
          const lngCol = Object.keys(columnMetadata).find(c => ['lng', 'lon', 'longitude'].includes(c.toLowerCase()));

          if (!latCol || !lngCol) {
            container.innerHTML = '<div class="text-xs text-red-400 text-center mt-12">Latitude/Longitude columns not found</div>';
            return;
          }

          // Gather points
          const coordsMap = {};
          filteredData.forEach(row => {
            const lat = parseFloat(row[latCol]);
            const lng = parseFloat(row[lngCol]);
            const val = widget.yAxis ? parseFloat(row[widget.yAxis]) : 1;
            if (!isNaN(lat) && !isNaN(lng)) {
              const k = \`\${lat.toFixed(2)},\${lng.toFixed(2)}\`;
              if (!coordsMap[k]) coordsMap[k] = { lat, lng, value: 0, label: row[Object.keys(row)[0]] || 'Point' };
              coordsMap[k].value += isNaN(val) ? 0 : val;
            }
          });

          const pts = Object.values(coordsMap);
          const maxP = Math.max(...pts.map(p => p.value), 1);
          const isHUD = widget.type === 'map_azure';

          container.innerHTML = \`
            <div class="relative w-full h-[220px] rounded-xl overflow-hidden border \${isHUD ? 'border-cyan-500/20 bg-[#020509]' : 'border-purple-500/10 bg-[#07050d]'}" style="font-family: monospace">
              
              <!-- SVG outlines -->
              <svg viewBox="0 0 200 100" class="w-full h-full stroke-[0.4] \${isHUD ? 'stroke-cyan-500 fill-[#031525] opacity-50' : 'stroke-purple-500 fill-[#0d091e] opacity-30'}">
                \${isHUD ? \`
                  <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(0,242,254,0.1)" stroke-dasharray="2 2" />
                  <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(0,242,254,0.1)" stroke-dasharray="2 2" />
                \` : ''}
                \${WORLD_PATHS.map(c => \`<path d="\${c.path}" />\`).join('')}
              </svg>
              
              <!-- Dots overlay -->
              <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                \${pts.map((p, idx) => {
                  const { x, y } = projectCoords(p.lat, p.lng);
                  const sizePct = (p.value / maxP) * 5;
                  const rad = Math.max(sizePct, 1.5);
                  const color = isHUD ? '#00f2fe' : CHART_COLORS[idx % CHART_COLORS.length];
                  return \`
                    <circle cx="\${x}" cy="\${y}" r="\${rad + 2}" fill="\${color}" opacity="0.15" class="animate-pulse" />
                    <circle cx="\${x}" cy="\${y}" r="\${rad}" fill="\${color}" opacity="0.8">
                      <title>\${p.label}: \${p.value.toLocaleString()}</title>
                    </circle>
                  \`;
                }).join('')}
              </svg>

              <div class="absolute bottom-2 left-2 text-[8px] px-2 py-0.5 rounded bg-black/60 \${isHUD ? 'text-cyan-400 border border-cyan-500/20' : 'text-purple-400 border border-purple-500/20'}">
                TRACKING: \${pts.length} PLOTS
              </div>

            </div>
          \`;
        }

        // ==========================================
        // DECOMPOSITION TREE
        // ==========================================
        else if (widget.type === 'decomposition_tree') {
          const treeId = widget.id;
          if (!decompTreePaths[treeId]) {
            // Find unique columns to select from
            const available = Object.keys(columnMetadata).filter(col => 
              columnMetadata[col].type === 'categorical' || columnMetadata[col].type === 'boolean'
            );
            decompTreePaths[treeId] = { drillFields: [], selectedNode: null, available };
          }

          const treeData = decompTreePaths[treeId];
          const drillFields = treeData.drillFields;

          // Render Decomposition Tree Horizontal Viewport
          let activeSubset = filteredData;
          const columnsHTML = [];

          // Root Metric
          const rootTotal = calculateKPI(filteredData, widget.yAxis, widget.aggregation === 'avg' ? 'avg' : 'sum');
          columnsHTML.push(\`
            <div class="flex flex-col gap-2 min-w-[140px] max-w-[140px]">
              <div class="text-[9px] uppercase font-bold text-gray-500 tracking-wider border-b border-purple-500/20 pb-1">TOTAL</div>
              <div class="p-2.5 rounded-lg border border-purple-500/20 bg-purple-900/10 relative overflow-hidden">
                <span class="text-[9px] font-bold text-white block">All Records</span>
                <span class="text-sm font-extrabold text-secondary mt-1 block">\${rootTotal.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
              </div>
            </div>
          \`);

          // Drill branch levels
          drillFields.forEach((field, fIdx) => {
            const groups = {};
            activeSubset.forEach(row => {
              const xVal = row[field] === null || row[field] === undefined ? 'Unknown' : String(row[field]);
              const yVal = widget.yAxis ? parseFloat(row[widget.yAxis]) : 1;
              if (!groups[xVal]) groups[xVal] = [];
              if (!isNaN(yVal)) groups[xVal].push(yVal);
            });

            const nodes = Object.keys(groups).map(key => {
              const arr = groups[key];
              let val = 0;
              if (widget.aggregation === 'avg') val = arr.reduce((a,b)=>a+b, 0) / arr.length;
              else val = arr.reduce((a,b)=>a+b, 0);
              return { label: key, value: val, percent: rootTotal > 0 ? (val / rootTotal) * 100 : 0 };
            }).sort((a,b) => b.value - a.value).slice(0, 5);

            columnsHTML.push(\`
              <div class="flex flex-col gap-2 min-w-[140px] max-w-[140px]">
                <div class="text-[9px] uppercase font-bold text-gray-500 tracking-wider border-b border-purple-500/20 pb-1 flex justify-between">
                  <span>\${field}</span>
                  <button onclick="removeReportDrill('\${treeId}', \${fIdx})" class="text-red-400 hover:opacity-85">&times;</button>
                </div>
                <div class="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  \${nodes.map(n => \`
                    <div class="p-2 rounded-lg border border-purple-900/20 bg-white/5 relative overflow-hidden text-[9px]">
                      <div class="absolute bottom-0 left-0 h-[3px] bg-primary" style="width: \${n.percent}%"></div>
                      <span class="font-bold text-white block truncate">\${n.label}</span>
                      <span class="font-bold text-secondary mt-0.5 block">\${n.value.toLocaleString(undefined, {maximumFractionDigits:1})}</span>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \`);
          });

          // Next Level Drill Selector Card
          if (drillFields.length < 3) {
            const remaining = treeData.available.filter(f => !drillFields.includes(f));
            columnsHTML.push(\`
              <div class="flex flex-col gap-2 min-w-[140px] max-w-[140px]">
                <div class="text-[9px] uppercase font-bold text-gray-500 tracking-wider border-b border-purple-500/20 pb-1">SPLIT</div>
                <div class="border border-dashed border-purple-500/30 rounded-xl p-2 flex flex-col gap-1 max-h-[160px] overflow-y-auto scrollbar-thin">
                  \${remaining.map(f => \`
                    <button onclick="addReportDrill('\${treeId}', '\${f}')" class="text-left text-[8px] bg-purple-950/25 border border-purple-900/20 text-white rounded p-1 hover:bg-primary transition truncate">\${f}</button>
                  \`).join('')}
                </div>
              </div>
            \`);
          }

          container.innerHTML = \`
            <div class="w-full overflow-x-auto flex gap-4 p-2 bg-purple-950/10 rounded-xl scrollbar-thin">
              \${columnsHTML.join('')}
            </div>
          \`;
        }

        // ==========================================
        // RIBBON CHART
        // ==========================================
        else if (widget.type === 'ribbon') {
          // Rank-ordered flows
          const widthStep = 100 / (chartData.length - 1 || 1);
          
          // Re-sort series per category
          const rankData = chartData.map(cat => {
            const sorted = seriesNames.map(s => ({ name: s, value: cat[s] || 0 })).sort((a,b)=>b.value - a.value);
            const sum = sorted.reduce((a,b)=>a+b.value, 0) || 1;
            let offset = 0;
            const stacks = sorted.map(item => {
              const pct = (item.value / sum) * 100;
              const y1 = offset;
              const y2 = offset + pct;
              offset = y2;
              return { ...item, y1, y2, h: pct };
            });
            return { name: cat.name, stacks };
          });

          const ribbonPaths = [];
          rankData.forEach((cat, idx) => {
            if (idx === rankData.length - 1) return;
            const nextCat = rankData[idx+1];
            const x1 = idx * widthStep + 6;
            const x2 = (idx+1) * widthStep - 6;

            cat.stacks.forEach(item => {
              const nextItem = nextCat.stacks.find(n => n.name === item.name);
              if (!nextItem) return;
              const colorIdx = seriesNames.indexOf(item.name);
              const color = CHART_COLORS[colorIdx % CHART_COLORS.length];
              
              const d = \`
                M \${x1},\${item.y1} 
                C \${(x1+x2)/2},\${item.y1} \${(x1+x2)/2},\${nextItem.y1} \${x2},\${nextItem.y1}
                L \${x2},\${nextItem.y2}
                C \${(x1+x2)/2},\${nextItem.y2} \${(x1+x2)/2},\${item.y2} \${x1},\${item.y2}
                Z
              \`;
              ribbonPaths.push(\`<path d="\${d}" fill="\${color}" opacity="0.3" stroke="none" />\`);
            });
          });

          // Draw columns
          const columnShapes = rankData.map((cat, idx) => {
            const x = idx * widthStep;
            return cat.stacks.map(item => {
              const colorIdx = seriesNames.indexOf(item.name);
              const color = CHART_COLORS[colorIdx % CHART_COLORS.length];
              return \`
                <rect x="\${x - 4}%" y="\${item.y1}%" width="8%" height="\${Math.max(item.h, 0.5)}%" fill="\${color}" opacity="0.85" rx="1" />
              \`;
            }).join('');
          }).join('');

          container.innerHTML = \`
            <div class="relative w-full h-[220px] flex flex-col justify-between">
              <svg viewBox="0 0 100 100" class="w-full h-[190px] border border-purple-500/10 rounded-lg overflow-hidden bg-purple-950/5" preserveAspectRatio="none">
                \${ribbonPaths.join('')}
                \${columnShapes}
              </svg>
              <div class="flex justify-center gap-2 mt-1 px-1 overflow-x-auto text-[8px] text-gray-500 font-bold max-h-[20px]">
                \${seriesNames.slice(0, 4).map((s,i) => \`
                  <div class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full" style="background: \${CHART_COLORS[i % CHART_COLORS.length]}"></span>
                    <span>\${s}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
        }

      });
    }

    // Global handles for Decomposition tree splits
    window.addReportDrill = function(treeId, field) {
      if (!decompTreePaths[treeId]) return;
      if (!decompTreePaths[treeId].drillFields.includes(field)) {
        decompTreePaths[treeId].drillFields.push(field);
      }
      drawCustomVisuals();
    }

    window.removeReportDrill = function(treeId, idx) {
      if (!decompTreePaths[treeId]) return;
      decompTreePaths[treeId].drillFields = decompTreePaths[treeId].drillFields.slice(0, idx);
      drawCustomVisuals();
    }

    // Update the dashboard visuals based on state
    function updateDashboard() {
      // 1. Update KPIs
      const filteredAll = getFilteredData();
      const kpis = widgets.filter(w => w.type === 'kpi');
      
      if (kpis.length === 0) {
        const val = calculateKPI(filteredAll, null, 'count');
        const element = document.getElementById('kpi-val-fallback');
        if (element) element.innerText = val.toLocaleString();
      }

      kpis.forEach((kpi) => {
        const val = calculateKPI(filteredAll, kpi.yAxis, kpi.aggregation);
        const element = document.getElementById(\`kpi-val-\${kpi.id}\`);
        if (element) {
          element.innerText = typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 1 }) : val;
        }
      });

      // 2. Redraw Custom Visuals
      drawCustomVisuals();

      // 3. Update ApexCharts
      const charts = widgets.filter(w => !['kpi', 'gauge', 'funnel', 'table_matrix', 'multi_row_card', 'map_lat_long', 'map_filled', 'map_azure', 'decomposition_tree', 'ribbon'].includes(w.type));
      charts.forEach((widget) => {
        const { chartData, seriesNames } = aggregatePivot(filteredAll, widget.xAxis, widget.yAxis, widget.legend, widget.aggregation);
        const chartInstance = activeCharts[widget.id];
        
        if (chartInstance) {
          if (widget.type === 'donut' || widget.type === 'pie') {
            chartInstance.updateSeries(chartData.map(d => d.value), true);
            chartInstance.updateOptions({ labels: chartData.map(d => d.name) });
          } else if (widget.type === 'waterfall') {
            // Recalculate range data for waterfall
            let runningSum = 0;
            const waterfallData = chartData.map((item, idx) => {
              const start = runningSum;
              const end = runningSum + item.value;
              runningSum = end;
              return { x: item.name, y: [start, end] };
            });
            chartInstance.updateSeries([{ data: waterfallData }], true);
          } else {
            // Standard series plotting
            const series = seriesNames.map((sName, sIdx) => ({
              name: sName,
              data: chartData.map(d => d[sName] || 0)
            }));
            chartInstance.updateSeries(series, true);
            chartInstance.updateOptions({
              xaxis: { categories: chartData.map(d => d.name) }
            });
          }
        }
      });
    }

    // Initialize Elements
    window.addEventListener('DOMContentLoaded', () => {
      // 1. Setup Filters
      const filterColumns = Object.keys(columnMetadata).filter(col => {
        return (columnMetadata[col].type === 'categorical' || columnMetadata[col].type === 'boolean') && 
               columnMetadata[col].uniqueCount <= 15;
      });

      const filtersBar = document.getElementById('filters-container');
      
      filterColumns.forEach((col) => {
        const options = Array.from(new Set(dataset.map(r => r[col]).filter(v => v !== null && v !== undefined))).sort();
        
        const filterItem = document.createElement('div');
        filterItem.className = 'flex flex-col gap-1';
        filterItem.innerHTML = \`
          <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">\${col.replace(/_/g, ' ')}</span>
          <select id="filter-\${col}" class="bg-[#0d0a1b] border border-purple-900/30 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer">
            <option value="">All</option>
            \${options.map(opt => \`<option value="\${opt}">\${opt}</option>\`).join('')}
          </select>
        \`;
        filtersBar.appendChild(filterItem);

        document.getElementById(\`filter-\${col}\`).addEventListener('change', (e) => {
          activeFilters[col] = e.target.value;
          updateDashboard();
        });
      });

      // Reset button
      const resetBtn = document.createElement('button');
      resetBtn.className = 'text-xs font-semibold text-accent border border-accent/20 bg-accent/5 hover:bg-accent/15 transition px-4 py-2 rounded-full mt-4 sm:mt-0 sm:ml-auto';
      resetBtn.innerText = 'Reset All Filters';
      resetBtn.onclick = () => {
        activeFilters = {};
        filterColumns.forEach(col => {
          document.getElementById(\`filter-\${col}\`).value = '';
        });
        updateDashboard();
      };
      filtersBar.appendChild(resetBtn);

      // 2. Setup KPIs
      const kpiRow = document.getElementById('kpi-row');
      const kpis = widgets.filter(w => w.type === 'kpi');
      
      if (kpis.length === 0) {
        const val = calculateKPI(dataset, null, 'count');
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center';
        card.innerHTML = \`
          <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Records</p>
          <p id="kpi-val-fallback" class="text-3xl font-extrabold text-white">\${val.toLocaleString()}</p>
          <div class="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-transparent opacity-40 rounded-full blur-lg"></div>
        \`;
        kpiRow.appendChild(card);
      }

      kpis.forEach((kpi) => {
        const val = calculateKPI(dataset, kpi.yAxis, kpi.aggregation);
        const card = document.createElement('div');
        card.className = 'glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center';
        card.innerHTML = \`
          <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">\${kpi.title}</p>
          <p id="kpi-val-\${kpi.id}" class="text-3xl font-extrabold text-white">\${val.toLocaleString()}</p>
          <div class="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-primary/20 to-transparent opacity-40 rounded-full blur-lg"></div>
        \`;
        kpiRow.appendChild(card);
      });

      // 3. Setup Charts Workspace
      const chartsGrid = document.getElementById('charts-grid');
      const chartWidgets = widgets.filter(w => w.type !== 'kpi');

      chartWidgets.forEach((widget) => {
        const card = document.createElement('div');
        card.className = \`glass-card rounded-2xl p-6 flex flex-col \${widget.w === 12 ? 'md:col-span-2' : ''}\`;
        
        // Split between apex chart and custom visual card template
        const isCustomVisual = ['gauge', 'funnel', 'table_matrix', 'multi_row_card', 'map_lat_long', 'map_filled', 'map_azure', 'decomposition_tree', 'ribbon'].includes(widget.type);
        
        if (isCustomVisual) {
          card.innerHTML = \`
            <h3 class="text-sm font-bold text-gray-200 tracking-tight mb-4">\${widget.title}</h3>
            <div id="custom-visual-container-\${widget.id}" class="w-full min-h-[220px]"></div>
          \`;
          chartsGrid.appendChild(card);
        } else {
          card.innerHTML = \`
            <h3 class="text-sm font-bold text-gray-200 tracking-tight mb-4">\${widget.title}</h3>
            <div id="chart-area-\${widget.id}" class="w-full h-[300px]"></div>
          \`;
          chartsGrid.appendChild(card);

          // Render ApexChart
          const { chartData, seriesNames } = aggregatePivot(dataset, widget.xAxis, widget.yAxis, widget.legend, widget.aggregation);

          let options = {
            theme: { mode: 'dark' },
            chart: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: 'transparent',
              toolbar: { show: false }
            },
            grid: { borderColor: 'rgba(255,255,255,0.05)' },
            colors: CHART_COLORS,
            stroke: { curve: 'smooth', width: 2 }
          };

          if (widget.type === 'donut' || widget.type === 'pie') {
            options = {
              ...options,
              chart: { ...options.chart, type: 'donut', height: '100%' },
              series: chartData.map(d => d.value),
              labels: chartData.map(d => d.name),
              legend: { position: 'bottom', labels: { colors: '#9c98b3' } },
              stroke: { show: false }
            };
          } else if (widget.type === 'bar_clustered' || widget.type === 'bar_stacked' || widget.type === 'bar_percent') {
            const series = seriesNames.map(s => ({
              name: s,
              data: chartData.map(d => d[s] || 0)
            }));
            options = {
              ...options,
              chart: { ...options.chart, type: 'bar', height: '100%', stacked: widget.type !== 'bar_clustered', stackType: widget.type === 'bar_percent' ? '100%' : 'normal' },
              plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
              series: series,
              xaxis: { categories: chartData.map(d => d.name), labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          } else if (widget.type === 'column_clustered' || widget.type === 'column_stacked' || widget.type === 'column_percent') {
            const series = seriesNames.map(s => ({
              name: s,
              data: chartData.map(d => d[s] || 0)
            }));
            options = {
              ...options,
              chart: { ...options.chart, type: 'bar', height: '100%', stacked: widget.type !== 'column_clustered', stackType: widget.type === 'column_percent' ? '100%' : 'normal' },
              plotOptions: { bar: { horizontal: false, borderRadius: 4 } },
              series: series,
              xaxis: { categories: chartData.map(d => d.name), labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          } else if (widget.type === 'area' || widget.type === 'area_stacked') {
            const series = seriesNames.map(s => ({
              name: s,
              data: chartData.map(d => d[s] || 0)
            }));
            options = {
              ...options,
              chart: { ...options.chart, type: 'area', height: '100%', stacked: widget.type === 'area_stacked' },
              series: series,
              xaxis: { categories: chartData.map(d => d.name), labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          } else if (widget.type === 'waterfall') {
            let runningSum = 0;
            const waterfallData = chartData.map((item, idx) => {
              const start = runningSum;
              const end = runningSum + item.value;
              runningSum = end;
              return { x: item.name, y: [start, end] };
            });

            options = {
              ...options,
              chart: { ...options.chart, type: 'bar', height: '100%' },
              plotOptions: {
                bar: {
                  colors: {
                    ranges: [
                      { from: -100000000, to: 0, color: '#ff3366' },
                      { from: 1, to: 1000000000, color: '#05f2a1' }
                    ]
                  }
                }
              },
              series: [{ data: waterfallData }],
              xaxis: { labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          } else if (widget.type === 'treemap') {
            options = {
              ...options,
              chart: { ...options.chart, type: 'treemap', height: '100%' },
              series: [{ data: chartData.map(d => ({ x: d.name, y: d.value })) }]
            };
          } else if (widget.type === 'scatter_bubble') {
            // Generate scatter series
            const scatterData = dataset.map(row => ({
              x: Number(row[widget.xAxis]) || 0,
              y: Number(row[widget.yAxis]) || 0
            }));
            options = {
              ...options,
              chart: { ...options.chart, type: 'scatter', height: '100%' },
              series: [{ name: 'Values', data: scatterData }],
              xaxis: { type: 'numeric', labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          } else {
            // Standard Line Chart fallback
            const series = seriesNames.map(s => ({
              name: s,
              data: chartData.map(d => d[s] || 0)
            }));
            options = {
              ...options,
              chart: { ...options.chart, type: 'line', height: '100%' },
              series: series,
              xaxis: { categories: chartData.map(d => d.name), labels: { style: { colors: '#9c98b3' } } },
              yaxis: { labels: { style: { colors: '#9c98b3' } } }
            };
          }

          const chart = new ApexCharts(document.querySelector(\`#chart-area-\${widget.id}\`), options);
          chart.render();
          activeCharts[widget.id] = chart;
        }
      });

      // Initial draw of custom visuals
      drawCustomVisuals();
    });
  </script>
</body>
</html>`;

    // Create file blob and trigger download
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}_interactive_report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
      <h3 className="card-title-small">Export Center</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button 
          className="btn-secondary" 
          onClick={downloadCSV}
          style={{ justifyContent: 'center', fontSize: '13px', padding: '10px 16px' }}
        >
          <FileDown size={16} />
          <span>Clean CSV</span>
        </button>

        <button 
          className="btn-secondary" 
          onClick={downloadExcel}
          style={{ justifyContent: 'center', fontSize: '13px', padding: '10px 16px' }}
        >
          <FileDown size={16} style={{ color: '#10b981' }} />
          <span>Clean Excel</span>
        </button>
      </div>

      <button 
        className="btn-primary" 
        onClick={downloadInteractiveHTML}
        style={{ justifyContent: 'center', width: '100%' }}
      >
        <FileCode size={18} />
        <span>Interactive HTML Report</span>
      </button>

      <button 
        className="btn-secondary" 
        onClick={triggerPDF}
        style={{ justifyContent: 'center', width: '100%' }}
      >
        <Printer size={16} />
        <span>Print / Save to PDF</span>
      </button>
    </div>
  );
};

export default ExportPanel;
