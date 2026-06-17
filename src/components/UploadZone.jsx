import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { parseCSV, parseExcel, parseSQL } from '../utils/dataParser';

const UploadZone = ({ onDataLoaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e) => {
    setError(null);
    const files = e.target.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    const fileName = file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    setIsParsing(true);
    
    try {
      let parsedResult = null;
      let type = '';

      if (extension === '.csv') {
        type = 'csv';
        const rows = await parseCSV(file);
        parsedResult = {
          tableName: fileName.replace('.csv', ''),
          tableNames: [fileName.replace('.csv', '')],
          data: {
            [fileName.replace('.csv', '')]: rows
          }
        };
      } else if (extension === '.xlsx' || extension === '.xls') {
        type = 'excel';
        const excelData = await parseExcel(file);
        parsedResult = {
          tableName: excelData.sheetNames[0],
          tableNames: excelData.sheetNames,
          data: excelData.data
        };
      } else if (extension === '.sql') {
        type = 'sql';
        const sqlData = await parseSQL(file);
        
        if (sqlData.tableNames.length === 0) {
          throw new Error("No INSERT INTO statements or CREATE TABLE statements found in this SQL file.");
        }
        
        parsedResult = {
          tableName: sqlData.tableNames[0],
          tableNames: sqlData.tableNames,
          data: sqlData.data
        };
      } else {
        throw new Error("Unsupported file format! Please upload an Excel (.xlsx/.xls), SQL (.sql), or CSV (.csv) file.");
      }

      onDataLoaded(parsedResult, type, fileName);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while parsing the file.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="upload-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.sql"
            style={{ display: 'none' }}
          />

          <div className="upload-icon-container">
            <UploadCloud size={40} />
          </div>

          <p className="upload-text-primary">
            {isParsing ? 'Processing dataset...' : 'Drag & drop your files here'}
          </p>
          
          <p className="upload-text-secondary">
            {isParsing 
              ? 'Inferring column structures and cleaning types...' 
              : 'or click to browse from your computer'}
          </p>

          <div className="file-formats-pill-list">
            <span className="file-format-pill excel">Microsoft Excel (.xlsx)</span>
            <span className="file-format-pill csv">CSV Spreadsheet (.csv)</span>
            <span className="file-format-pill sql">SQL Database Script (.sql)</span>
          </div>

          {isParsing && (
            <motion.div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '4px',
                background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))',
              }}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              color: 'var(--color-error)',
              marginTop: '20px',
              fontSize: '14px'
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadZone;
