import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, HelpCircle, Table, Plus } from 'lucide-react';

import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import CleaningReport from './components/CleaningReport';
import Dashboard from './components/Dashboard';
import ExportPanel from './components/ExportPanel';

import { cleanData } from './utils/dataCleaner';
import { recommendWidgets } from './utils/visualRecommender';

import './App.css';

function App() {
  const [parsedData, setParsedData] = useState(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('');

  const [cleaningOptions, setCleaningOptions] = useState({
    removeDuplicates: true,
    fillMissingValues: true,
    normalizeText: true,
    standardizeCategories: true
  });

  const [widgets, setWidgets] = useState([]);
  const [editingWidget, setEditingWidget] = useState(null);

  // Clear data and reset drop-zone
  const handleReset = () => {
    setParsedData(null);
    setSelectedTable('');
    setFileType('');
    setFileName('');
    setWidgets([]);
    setEditingWidget(null);
  };

  // Called when file parsing completes
  const handleDataLoaded = (data, type, name) => {
    setFileType(type);
    setFileName(name);
    setParsedData(data);
    setSelectedTable(data.tableNames[0]);
  };

  // Toggle cleaning config checkbox options
  const handleCleaningOptionToggle = (optionKey) => {
    setCleaningOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  };

  // Run cleaning pipeline dynamically based on active sheet/table and options
  const cleanedResult = useMemo(() => {
    if (!parsedData || !selectedTable || !parsedData.data[selectedTable]) {
      return { cleanedRows: [], stats: { originalRows: 0, cleanedRows: 0, duplicatesRemoved: 0, nullValuesFilled: 0, qualityScore: 100 } };
    }
    const rawRows = parsedData.data[selectedTable];
    return cleanData(rawRows, cleaningOptions);
  }, [parsedData, selectedTable, cleaningOptions]);

  const { cleanedRows, stats } = cleanedResult;

  // Auto-recommend widgets when dataset loads or active sheet changes
  useEffect(() => {
    if (cleanedRows.length > 0 && stats.columnMetadata) {
      const recommendations = recommendWidgets(cleanedRows, stats.columnMetadata);
      setWidgets(recommendations);
    }
  }, [selectedTable, parsedData]); // Triggers when sheet/file is loaded/changed

  // Handle manual widget alterations from Config panel
  const handleUpdateWidget = (updatedWidget) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
  };

  const handleDeleteWidget = (widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  // Let user add a new visual chart to the dashboard
  const handleAddWidget = () => {
    if (!stats.columnMetadata) return;
    
    const columns = Object.keys(stats.columnMetadata);
    const numericCols = columns.filter(c => stats.columnMetadata[c].type === 'numeric');
    const categoricalCols = columns.filter(c => stats.columnMetadata[c].type === 'categorical');
    
    const newWidget = {
      id: `widget-custom-${Date.now()}`,
      title: 'New Custom Visual',
      type: 'column_clustered',
      xAxis: categoricalCols[0] || columns[0],
      yAxis: numericCols[0] || null,
      legend: '',
      aggregation: numericCols[0] ? 'sum' : 'count',
      w: 6,
      h: 4
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setEditingWidget(newWidget);
  };

  return (
    <div className="app-container">
      <Navbar onReset={handleReset} hasData={!!parsedData} />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {!parsedData ? (
            // Upload & Hero Workspace Screen
            <motion.div
              key="upload-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <div className="hero-section">
                <h2 className="hero-title">
                  Instantly transform spreadsheet data into <span>interactive dashboards</span>
                </h2>
                <p className="hero-subtitle">
                  Upload Excel, CSV, or SQL dump scripts. Our client-side engine automatically cleans data inconsistencies and crafts visuals in seconds.
                </p>
              </div>

              <UploadZone onDataLoaded={handleDataLoaded} />
            </motion.div>
          ) : (
            // Interactive Report Workspace Screen
            <motion.div
              key="report-screen"
              className="report-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Sheet selector row (displayed if multiple tables exist) */}
              {parsedData.tableNames.length > 1 && (
                <div className="dashboard-tabs">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)', marginRight: '12px' }}>
                    <Layers size={16} />
                    <span>Select Dataset Sheet/Table:</span>
                  </div>
                  {parsedData.tableNames.map((tblName) => (
                    <button
                      key={tblName}
                      className={`dashboard-tab ${selectedTable === tblName ? 'active' : ''}`}
                      onClick={() => setSelectedTable(tblName)}
                    >
                      {tblName}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid split pane layout */}
              <div className="report-grid">
                
                {/* Left Side: Audit Engine and Export Control */}
                <div className="sidebar-panel">
                  <CleaningReport
                    stats={stats}
                    cleaningOptions={cleaningOptions}
                    onOptionToggle={handleCleaningOptionToggle}
                  />

                  <ExportPanel
                    cleanedRows={cleanedRows}
                    widgets={widgets}
                    tableName={selectedTable}
                    columnMetadata={stats.columnMetadata}
                  />
                </div>

                {/* Right Side: Visual canvas workspace */}
                <div className="dashboard-workspace">
                  
                  {/* Dashboard Visual Controls Banner */}
                  <div className="dashboard-header">
                    <div className="dashboard-title-group">
                      <h2>{selectedTable.replace(/_/g, ' ')} Dashboard</h2>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Analyze data from {fileName}
                      </p>
                    </div>

                    <button className="btn-primary" onClick={handleAddWidget}>
                      <Plus size={18} />
                      <span>Add Visual Chart</span>
                    </button>
                  </div>

                  {/* Render Visual Grid & Interactive Slicers */}
                  <Dashboard
                    cleanedRows={cleanedRows}
                    columnMetadata={stats.columnMetadata}
                    widgets={widgets}
                    onUpdateWidget={handleUpdateWidget}
                    onDeleteWidget={handleDeleteWidget}
                    onAddWidget={handleAddWidget}
                    editingWidget={editingWidget}
                    setEditingWidget={setEditingWidget}
                  />

                  {/* Clean Data Preview Section (Scrollable Table) */}
                  <div className="glass-card data-preview-table-card">
                    <h3 className="card-title-small" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Table size={16} />
                      <span>Cleaned Tabular Dataset Preview (Top 10 rows)</span>
                    </h3>

                    {cleanedRows.length > 0 ? (
                      <div className="preview-table-container">
                        <table className="preview-table">
                          <thead>
                            <tr>
                              {Object.keys(cleanedRows[0]).map((header) => (
                                <th key={header}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cleanedRows.slice(0, 10).map((row, idx) => (
                              <tr key={idx}>
                                {Object.keys(row).map((header, colIdx) => (
                                  <td key={colIdx} title={String(row[header])}>
                                    {row[header] === null || row[header] === undefined 
                                      ? <span style={{ color: 'var(--color-error)', fontStyle: 'italic' }}>null</span>
                                      : String(row[header])
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="empty-state">No tabular preview data to show.</div>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
