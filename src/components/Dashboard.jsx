import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Treemap
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Maximize2, Trash2, FilterX, LayoutGrid } from 'lucide-react';
import { aggregateData, calculateKPIMetric, aggregateDataPivot } from '../utils/visualRecommender';
import { 
  GaugeChartVisual, FunnelChartVisual, TableMatrixVisual, 
  MultiRowCardVisual, MapVisual, DecompositionTreeVisual, RibbonChartVisual 
} from './AdvancedVisuals';

// Vibrant neon color theme
const CHART_COLORS = ['#8b5cf6', '#00f2fe', '#ff007f', '#10b981', '#f59e0b', '#3b82f6'];

const Dashboard = ({ 
  cleanedRows, 
  columnMetadata, 
  widgets, 
  onUpdateWidget, 
  onDeleteWidget, 
  onAddWidget,
  editingWidget,
  setEditingWidget
}) => {
  const [activeFilters, setActiveFilters] = useState({});

  // Get list of columns by type for config choices
  const columns = useMemo(() => Object.keys(columnMetadata), [columnMetadata]);
  const numericCols = useMemo(() => columns.filter(c => columnMetadata[c].type === 'numeric'), [columns, columnMetadata]);
  const categoricalCols = useMemo(() => columns.filter(c => 
    columnMetadata[c].type === 'categorical' || columnMetadata[c].type === 'boolean'
  ), [columns, columnMetadata]);

  // Extract slicer filter choices (all categories with <= 15 values)
  const filterColumns = useMemo(() => {
    return categoricalCols.filter(col => columnMetadata[col].uniqueCount <= 15);
  }, [categoricalCols, columnMetadata]);

  // Calculate unique options for each filter column
  const filterOptions = useMemo(() => {
    const opts = {};
    filterColumns.forEach((col) => {
      const values = new Set(cleanedRows.map(r => r[col]).filter(v => v !== null && v !== undefined));
      opts[col] = Array.from(values).sort();
    });
    return opts;
  }, [filterColumns, cleanedRows]);

  // Global filtered data (applied to KPIs and filters)
  const globalFilteredData = useMemo(() => {
    let result = cleanedRows;
    Object.keys(activeFilters).forEach((col) => {
      const val = activeFilters[col];
      if (val !== null && val !== '') {
        result = result.filter(row => String(row[col]) === String(val));
      }
    });
    return result;
  }, [cleanedRows, activeFilters]);

  // Set filter value
  const handleFilterChange = (col, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [col]: value === '' ? null : value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setActiveFilters({});
  };

  // Cross-filtering click handler (click on a chart bar/pie segment to filter)
  const handleChartElementClick = (xAxisCol, value) => {
    if (!xAxisCol) return;
    setActiveFilters(prev => {
      const current = prev[xAxisCol];
      return {
        ...prev,
        // If clicked same element, clear filter. Else, apply filter.
        [xAxisCol]: current === value ? null : value
      };
    });
  };

  // Returns data for a specific widget, filtered by all filters EXCEPT its own x-axis (cross-filtering style)
  const getWidgetFilteredData = (widget) => {
    let result = cleanedRows;
    Object.keys(activeFilters).forEach((col) => {
      // Exclude widget's own X-axis so the chart doesn't collapse to one group
      if (col !== widget.xAxis) {
        const val = activeFilters[col];
        if (val !== null && val !== '') {
          result = result.filter(row => String(row[col]) === String(val));
        }
      }
    });
    return result;
  };

  // Render a specific chart
  const renderChart = (widget) => {
    const widgetData = getWidgetFilteredData(widget);
    
    // Aggregation Pivot (handles standard grouping and Legend breakdown split)
    const { chartData, seriesNames } = aggregateDataPivot(
      widgetData,
      widget.xAxis,
      widget.yAxis,
      widget.legend,
      widget.aggregation
    );

    const isFilteredOnThisCol = activeFilters[widget.xAxis];

    // Styled Tooltip component for Recharts
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div style={{ 
            background: 'rgba(13, 10, 27, 0.9)', 
            border: '1px solid var(--border-glass)', 
            padding: '10px 14px', 
            borderRadius: '8px', 
            boxShadow: 'var(--card-shadow)',
            zIndex: 1000
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
              {payload[0].payload.name}
            </p>
            {payload.map((p, idx) => (
              <p key={idx} style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 'bold', color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                {p.name !== 'value' ? `${p.name}: ` : ''}{p.value.toLocaleString()}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    // Calculate percentage column data (for 100% Stacked Charts)
    const percentData = chartData.map(item => {
      const normalizedItem = { ...item };
      seriesNames.forEach(series => {
        normalizedItem[series] = item._total > 0 
          ? Number(((item[series] / item._total) * 100).toFixed(2)) 
          : 0;
      });
      return normalizedItem;
    });

    switch (widget.type) {
      
      // ==========================================
      // BAR & COLUMN CHARTS
      // ==========================================
      case 'column_clustered':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    const fill = seriesNames.length === 1 
                      ? CHART_COLORS[index % CHART_COLORS.length] 
                      : CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={fill}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bar_clustered':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    const fill = seriesNames.length === 1 
                      ? CHART_COLORS[index % CHART_COLORS.length] 
                      : CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={fill}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'column_stacked':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} stackId="stack" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bar_stacked':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} stackId="stack">
                  {chartData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'column_percent':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={percentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} stackId="percent">
                  {percentData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'bar_percent':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={percentData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Bar key={series} dataKey={series} stackId="percent">
                  {percentData.map((entry, index) => {
                    const isSelected = isFilteredOnThisCol === entry.name;
                    const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.25) : 0.85;
                    return (
                      <Cell 
                        key={`cell-${index}`}
                        onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        opacity={opacity}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    );
                  })}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      // ==========================================
      // LINE & AREA CHARTS
      // ==========================================
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Line 
                  key={series}
                  type="monotone" 
                  dataKey={series} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={3}
                  dot={{ r: 2, fill: 'var(--bg-dark)', stroke: CHART_COLORS[i % CHART_COLORS.length], strokeWidth: 1.5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Area 
                  key={series}
                  type="monotone" 
                  dataKey={series} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'area_stacked':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {widget.legend && <Legend verticalAlign="top" height={36} iconSize={8} iconType="circle" style={{ fontSize: '9px' }} />}
              {seriesNames.map((series, i) => (
                <Area 
                  key={series}
                  type="monotone" 
                  dataKey={series} 
                  stackId="area-stack"
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      // ==========================================
      // PIE & DONUT CHARTS
      // ==========================================
      case 'pie':
      case 'donut':
        const isDonut = widget.type === 'donut';
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isDonut ? 50 : 0}
                outerRadius={75}
                paddingAngle={isDonut ? 3 : 0}
                dataKey="value"
              >
                {chartData.map((entry, index) => {
                  const isSelected = isFilteredOnThisCol === entry.name;
                  const opacity = isFilteredOnThisCol ? (isSelected ? 1.0 : 0.3) : 0.85;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                      onClick={() => handleChartElementClick(widget.xAxis, entry.name)}
                      style={{ cursor: 'pointer', outline: 'none', transition: 'all 0.3s' }}
                      opacity={opacity}
                    />
                  );
                })}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" style={{ fontSize: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      // ==========================================
      // SCATTER & BUBBLE CHARTS
      // ==========================================
      case 'scatter_bubble':
        const scatterData = widgetData.map(row => ({
          x: Number(row[widget.xAxis]) || 0,
          y: Number(row[widget.yAxis]) || 0,
          z: widget.sizeField ? (Number(row[widget.sizeField]) || 0) : 10,
          name: widget.legend ? String(row[widget.legend]) : 'Record'
        }));

        // Find max bubble size to normalize radius scaling
        const maxZ = scatterData.reduce((max, d) => Math.max(max, d.z), 1);
        
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="x" name={widget.xAxis} stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis type="number" dataKey="y" name={widget.yAxis} stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Data Point" data={scatterData}>
                {scatterData.map((entry, index) => {
                  const seriesIndex = widget.legend ? Array.from(new Set(scatterData.map(d => d.name))).indexOf(entry.name) : 0;
                  const radius = widget.sizeField ? Math.max((entry.z / maxZ) * 24, 4) : 6;
                  return (
                    <Cell 
                      key={`point-${index}`} 
                      fill={CHART_COLORS[seriesIndex % CHART_COLORS.length]} 
                      r={radius}
                      opacity={0.75}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      // ==========================================
      // ADVANCED BUSINESS VISUALS
      // ==========================================
      case 'waterfall':
        // Generate floating Waterfall bridge aggregates
        let runningSum = 0;
        const waterfallData = chartData.map((item, idx) => {
          const start = runningSum;
          const end = runningSum + item.value;
          runningSum = end;
          
          return {
            name: item.name,
            range: [start, end],
            value: item.value,
            // First and last columns are totals, intermediate values are increments
            type: idx === 0 || idx === chartData.length - 1 ? 'total' : (item.value >= 0 ? 'increase' : 'decrease')
          };
        });

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
              <Tooltip />
              <Bar dataKey="range" radius={[2, 2, 0, 0]}>
                {waterfallData.map((entry, index) => {
                  const fill = entry.type === 'total' 
                    ? 'var(--color-primary)' 
                    : (entry.value >= 0 ? 'var(--color-success)' : 'var(--color-error)');
                  return (
                    <Cell 
                      key={`wf-${index}`}
                      fill={fill}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="value"
              stroke="#0d0a1b"
              fill="var(--color-primary)"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} opacity={0.8} />
              ))}
            </Treemap>
          </ResponsiveContainer>
        );

      case 'gauge':
        const sumVal = chartData.reduce((acc, d) => acc + d.value, 0);
        const gaugeValue = widget.aggregation === 'avg' ? sumVal / (chartData.length || 1) : sumVal;
        return (
          <GaugeChartVisual 
            title={widget.title} 
            value={gaugeValue} 
            aggregation={widget.aggregation} 
            xAxis={widget.xAxis} 
            yAxis={widget.yAxis} 
          />
        );

      case 'funnel':
        return <FunnelChartVisual chartData={chartData} yAxis={widget.yAxis} />;

      case 'table_matrix':
        return <TableMatrixVisual chartData={chartData} seriesNames={seriesNames} xAxis={widget.xAxis} yAxis={widget.yAxis} />;

      case 'multi_row_card':
        return <MultiRowCardVisual chartData={chartData} yAxis={widget.yAxis} />;

      case 'map_lat_long':
      case 'map_filled':
      case 'map_azure':
        return (
          <MapVisual 
            chartData={chartData} 
            type={widget.type} 
            cleanedRows={cleanedRows} 
            columnMetadata={columnMetadata} 
            yAxis={widget.yAxis} 
          />
        );

      case 'decomposition_tree':
        return (
          <DecompositionTreeVisual 
            cleanedRows={cleanedRows} 
            columnMetadata={columnMetadata} 
            yAxis={widget.yAxis} 
            aggregation={widget.aggregation} 
          />
        );

      case 'ribbon':
        return <RibbonChartVisual chartData={chartData} seriesNames={seriesNames} />;

      default:
        return <div className="empty-state">No chart type found</div>;
    }
  };

  // Filter list of widget configs
  const kpiWidgets = widgets.filter(w => w.type === 'kpi');
  const chartWidgets = widgets.filter(w => w.type !== 'kpi');

  return (
    <div className="dashboard-workspace">
      
      {/* 1. Global Slicers (Filters) */}
      {filterColumns.length > 0 && (
        <div className="slicers-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-muted)' }}>
            <LayoutGrid size={16} />
            <span>Interactive Filters:</span>
          </div>

          {filterColumns.map((col) => (
            <div key={col} className="slicer-item">
              <span className="slicer-label">{col.replace(/_/g, ' ')}</span>
              <select 
                className="slicer-select"
                value={activeFilters[col] || ''}
                onChange={(e) => handleFilterChange(col, e.target.value)}
              >
                <option value="">All</option>
                {filterOptions[col]?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          {Object.values(activeFilters).some(v => v !== null && v !== undefined) && (
            <button className="slicer-reset-btn" onClick={resetFilters}>
              <FilterX size={14} />
              <span>Clear Filter ({Object.values(activeFilters).filter(Boolean).length})</span>
            </button>
          )}
        </div>
      )}

      {/* 2. KPI Metrics Cards */}
      {kpiWidgets.length > 0 && (
        <div className="kpi-row">
          {kpiWidgets.map((kpi) => {
            const value = calculateKPIMetric(
              globalFilteredData, 
              kpi.yAxis, 
              kpi.aggregation
            );
            return (
              <motion.div 
                key={kpi.id} 
                className="kpi-tile"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="kpi-title">{kpi.title}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="widget-btn-icon" onClick={() => setEditingWidget(kpi)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="widget-btn-icon" onClick={() => onDeleteWidget(kpi.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <span className="kpi-value">
                  {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3. Charts Workspace Grid */}
      <div className="visuals-grid">
        {chartWidgets.map((widget) => (
          <div 
            key={widget.id} 
            className={`widget-card w-${widget.w || 6}`}
          >
            <div className="widget-header">
              <span className="widget-title">{widget.title}</span>
              <div className="widget-controls">
                <button className="widget-btn-icon" onClick={() => setEditingWidget(widget)}>
                  <Edit2 size={14} />
                </button>
                <button 
                  className="widget-btn-icon" 
                  onClick={() => onUpdateWidget({
                    ...widget,
                    w: widget.w === 6 ? 12 : widget.w === 12 ? 4 : 6
                  })}
                  title="Resize Widget"
                >
                  <Maximize2 size={14} />
                </button>
                <button className="widget-btn-icon" onClick={() => onDeleteWidget(widget.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="widget-chart-container">
              {renderChart(widget)}
            </div>
            
            {activeFilters[widget.xAxis] && (
              <div style={{ fontSize: '11px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                Filtered on {widget.xAxis.replace(/_/g, ' ')}: {activeFilters[widget.xAxis]} (Click element again to clear)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Widget Configuration Modal */}
      <AnimatePresence>
        {editingWidget && (
          <div className="modal-backdrop" onClick={() => setEditingWidget(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h3 className="modal-title">Configure Visual</h3>
                <button className="modal-close-btn" onClick={() => setEditingWidget(null)}>&times;</button>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>Visual Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editingWidget.title}
                  onChange={(e) => setEditingWidget({ ...editingWidget, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>Visual Type</label>
                <select 
                  className="form-select"
                  value={editingWidget.type}
                  onChange={(e) => setEditingWidget({ ...editingWidget, type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="kpi">KPI Card</option>
                  <option value="multi_row_card">Multi-row Card</option>
                  <option value="table_matrix">Table Matrix Heat-view</option>
                  <option value="column_clustered">Clustered Column Chart</option>
                  <option value="bar_clustered">Clustered Bar Chart</option>
                  <option value="column_stacked">Stacked Column Chart</option>
                  <option value="bar_stacked">Stacked Bar Chart</option>
                  <option value="column_percent">100% Stacked Column Chart</option>
                  <option value="bar_percent">100% Stacked Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="area_stacked">Stacked Area Chart</option>
                  <option value="ribbon">Ribbon Chart</option>
                  <option value="donut">Donut Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter_bubble">Scatter & Bubble Chart</option>
                  <option value="waterfall">Waterfall Chart</option>
                  <option value="treemap">Treemap Chart</option>
                  <option value="funnel">Funnel Chart</option>
                  <option value="gauge">Gauge Chart</option>
                  <option value="decomposition_tree">Decomposition Tree</option>
                  <option value="map_lat_long">Coordinates Bubble Map</option>
                  <option value="map_filled">Filled Map / Heatmap</option>
                  <option value="map_azure">Azure Maps HUD</option>
                </select>
              </div>

              {editingWidget.type !== 'kpi' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>X-Axis Field (Group By)</label>
                  <select 
                    className="form-select"
                    value={editingWidget.xAxis || ''}
                    onChange={(e) => setEditingWidget({ ...editingWidget, xAxis: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="">Select axis...</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Legend split dimension for grouped/stacked/line/area charts */}
              {['column_clustered', 'bar_clustered', 'column_stacked', 'bar_stacked', 'column_percent', 'bar_percent', 'line', 'area', 'area_stacked', 'ribbon', 'scatter_bubble', 'table_matrix'].includes(editingWidget.type) && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>Legend / Split Dimension (Optional)</label>
                  <select 
                    className="form-select"
                    value={editingWidget.legend || ''}
                    onChange={(e) => setEditingWidget({ ...editingWidget, legend: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="">No splitting dimension</option>
                    {categoricalCols.map(col => (
                      <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Bubble Size Dimension specifically for Scatter/Bubble */}
              {editingWidget.type === 'scatter_bubble' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>Bubble Size Field (Optional)</label>
                  <select 
                    className="form-select"
                    value={editingWidget.sizeField || ''}
                    onChange={(e) => setEditingWidget({ ...editingWidget, sizeField: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="">Constant radius</option>
                    {numericCols.map(col => (
                      <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>
                  {editingWidget.type === 'kpi' ? 'Target Metric Field' : 'Y-Axis Field (Value)'}
                </label>
                <select 
                  className="form-select"
                  value={editingWidget.yAxis || ''}
                  onChange={(e) => setEditingWidget({ ...editingWidget, yAxis: e.target.value })}
                  disabled={editingWidget.aggregation === 'count'}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="">Row Count (No column)</option>
                  {numericCols.map(col => (
                    <option key={col} value={col}>{col.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600' }}>Aggregation Function</label>
                <select 
                  className="form-select"
                  value={editingWidget.aggregation}
                  onChange={(e) => setEditingWidget({ 
                    ...editingWidget, 
                    aggregation: e.target.value,
                    // If aggregate is count, disable yAxis column
                    yAxis: e.target.value === 'count' ? '' : editingWidget.yAxis
                  })}
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count (Rows)</option>
                  {(editingWidget.type === 'kpi' || editingWidget.type === 'gauge') && (
                    <>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                    </>
                  )}
                  {editingWidget.type === 'scatter_bubble' && (
                    <option value="none">Raw Values</option>
                  )}
                </select>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setEditingWidget(null)}
                  style={{ padding: '10px 24px', borderRadius: '30px' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    onUpdateWidget(editingWidget);
                    setEditingWidget(null);
                  }}
                  style={{ padding: '10px 24px', borderRadius: '30px' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default Dashboard;
