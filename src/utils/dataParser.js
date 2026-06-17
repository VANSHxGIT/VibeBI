import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parses a CSV file using PapaParse.
 * @param {File} file 
 * @returns {Promise<Array<Object>>} Resolves to array of row objects
 */
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.warn('PapaParse warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * Parses an Excel file (.xlsx, .xls) using SheetJS.
 * @param {File} file 
 * @returns {Promise<Object>} Resolves to { sheetNames: [...], data: { sheetName: [rows] } }
 */
export const parseExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetsData = {};
        
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // defval: null ensures empty cells are represented as null rather than omitted
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null, header: 1 });
          
          if (rows.length > 0) {
            // Find the header row (first non-empty row)
            const headers = rows[0].map(h => h !== null ? String(h).trim() : '');
            const parsedRows = [];
            
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              const rowObj = {};
              let hasData = false;
              
              headers.forEach((header, idx) => {
                if (header) {
                  const val = row[idx] !== undefined ? row[idx] : null;
                  rowObj[header] = val;
                  if (val !== null && val !== '') hasData = true;
                }
              });
              
              if (hasData) {
                parsedRows.push(rowObj);
              }
            }
            sheetsData[sheetName] = parsedRows;
          } else {
            sheetsData[sheetName] = [];
          }
        });
        
        resolve({
          sheetNames: workbook.SheetNames,
          data: sheetsData
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses a SQL dump file. Extracts tables and rows.
 * Supports basic CREATE TABLE and INSERT INTO syntax.
 * @param {File} file 
 * @returns {Promise<Object>} Resolves to { tableNames: [...], data: { tableName: [rows] } }
 */
export const parseSQL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const sqlText = e.target.result;
        const result = parseSQLText(sqlText);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};

/**
 * Helper to parse SQL script text and extract tables.
 * @param {string} text 
 * @returns {Object} { tableNames: [...], data: { tableName: [rows] } }
 */
export function parseSQLText(text) {
  const cleanSql = text
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/--.*$/gm, '')           // Remove single-line comments
    .replace(/^\s*[\r\n]/gm, '');      // Remove empty lines

  // Statements separated by semicolons
  const statements = cleanSql.split(';').map(s => s.trim()).filter(Boolean);
  
  const tables = {};
  const schema = {}; // tableName -> array of column names

  statements.forEach((statement) => {
    const lowerStmt = statement.toLowerCase();

    // 1. Parse CREATE TABLE
    if (lowerStmt.startsWith('create table')) {
      // Extract table name
      const createMatch = statement.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:[`"'])?([a-zA-Z0-9_]+)(?:[`"'])?\s*\(([\s\S]+)\)/i);
      if (createMatch) {
        const tableName = createMatch[1];
        const columnsText = createMatch[2];
        
        // Extract column names (ignoring constraints like PRIMARY KEY, FOREIGN KEY, etc.)
        const columns = [];
        const lines = columnsText.split(',');
        
        lines.forEach((line) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;
          
          const lowerLine = trimmedLine.toLowerCase();
          // Skip constraint definitions at the end of create tables
          if (
            lowerLine.startsWith('primary key') ||
            lowerLine.startsWith('foreign key') ||
            lowerLine.startsWith('key ') ||
            lowerLine.startsWith('constraint') ||
            lowerLine.startsWith('unique') ||
            lowerLine.startsWith('check')
          ) {
            return;
          }
          
          // The first word is usually the column name, unless it is quoted
          const colMatch = trimmedLine.match(/^(?:[`"'])?([a-zA-Z0-9_]+)(?:[`"'])?\s+/);
          if (colMatch) {
            columns.push(colMatch[1]);
          }
        });
        
        schema[tableName] = columns;
        if (!tables[tableName]) {
          tables[tableName] = [];
        }
      }
    }

    // 2. Parse INSERT INTO
    else if (lowerStmt.startsWith('insert into')) {
      // Extract table name, columns (optional), and VALUES block
      const insertMatch = statement.match(/insert\s+into\s+(?:[`"'])?([a-zA-Z0-9_]+)(?:[`"'])?\s*(?:\(([^)]+)\))?\s*values\s*([\s\S]+)/i);
      
      if (insertMatch) {
        const tableName = insertMatch[1];
        const colsRaw = insertMatch[2];
        const valuesBlock = insertMatch[3];
        
        if (!tables[tableName]) {
          tables[tableName] = [];
        }

        // Determine column list
        let colNames = [];
        if (colsRaw) {
          colNames = colsRaw.split(',').map(c => c.trim().replace(/[`"']/g, ''));
        } else if (schema[tableName]) {
          colNames = schema[tableName];
        }

        // Parse individual value rows: (1, 'Vansh', 25.5), (2, 'John', NULL)
        // Need to be careful with parentheses inside strings
        const rows = parseSQLValuesList(valuesBlock);
        
        rows.forEach((rowValues) => {
          const rowObj = {};
          
          // Generate default column names if we don't have them
          const numCols = Math.max(colNames.length, rowValues.length);
          for (let i = 0; i < numCols; i++) {
            const colName = colNames[i] || `column_${i + 1}`;
            const val = rowValues[i] !== undefined ? rowValues[i] : null;
            rowObj[colName] = val;
          }
          
          tables[tableName].push(rowObj);
        });
      }
    }
  });

  // If we found inserts but no create table, they will still be in tables.
  const tableNames = Object.keys(tables);

  return {
    tableNames,
    data: tables
  };
}

/**
 * Extracts individual row value arrays from a SQL VALUES block.
 * Handles strings, numbers, nulls and commas correctly.
 * Example input: "(1, 'Vansh', '2026-06-16'), (2, 'John', NULL)"
 * @param {string} valuesBlock 
 * @returns {Array<Array>} Array of rows, where each row is an array of typed values
 */
function parseSQLValuesList(valuesBlock) {
  const parsedRows = [];
  let currentWord = '';
  let inString = false;
  let stringChar = ''; // ' or "
  let inRow = false;
  let currentRowValues = [];
  
  for (let i = 0; i < valuesBlock.length; i++) {
    const char = valuesBlock[i];
    
    if (inString) {
      if (char === stringChar && valuesBlock[i - 1] !== '\\') {
        inString = false;
      } else {
        currentWord += char;
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        stringChar = char;
      } else if (char === '(') {
        inRow = true;
        currentRowValues = [];
        currentWord = '';
      } else if (char === ')') {
        if (inRow) {
          if (currentWord.trim()) {
            currentRowValues.push(parseSQLVal(currentWord.trim()));
          }
          parsedRows.push(currentRowValues);
          inRow = false;
          currentWord = '';
        }
      } else if (char === ',') {
        if (inRow) {
          currentRowValues.push(parseSQLVal(currentWord.trim()));
          currentWord = '';
        }
      } else {
        currentWord += char;
      }
    }
  }
  
  return parsedRows;
}

/**
 * Converts a raw SQL string value into its Javascript type.
 * @param {string} rawVal 
 * @returns {any}
 */
function parseSQLVal(rawVal) {
  const v = rawVal.trim();
  if (!v || v.toLowerCase() === 'null') {
    return null;
  }
  // If it's a quoted string
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.substring(1, v.length - 1);
  }
  // If numeric
  if (!isNaN(v)) {
    return Number(v);
  }
  // Boolean
  if (v.toLowerCase() === 'true') return true;
  if (v.toLowerCase() === 'false') return false;
  
  return v;
}
