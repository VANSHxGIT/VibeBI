/**
 * Automatic Data Cleaning Pipeline
 * Processes raw rows and returns cleaned rows along with statistical summaries of what was cleaned.
 */

/**
 * Inferred types: 'numeric', 'date', 'categorical', 'text', 'boolean'
 */
export const inferColumnTypes = (rawRows) => {
  if (!rawRows || rawRows.length === 0) return {};
  
  const columns = Object.keys(rawRows[0]);
  const columnTypes = {};
  
  columns.forEach((col) => {
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let totalValidCount = 0;
    const uniqueValues = new Set();
    
    rawRows.forEach((row) => {
      const val = row[col];
      if (val === null || val === undefined || val === '') return;
      
      totalValidCount++;
      const valStr = String(val).trim();
      uniqueValues.add(valStr);
      
      // Check boolean
      const lower = valStr.toLowerCase();
      if (lower === 'true' || lower === 'false' || val === true || val === false) {
        booleanCount++;
      }
      
      // Check numeric
      if (!isNaN(Number(valStr)) && valStr !== '') {
        numericCount++;
      }
      
      // Check date
      // Simple regex for date-like structures or standard Date parsing success
      // Avoid parsing small integers as dates (e.g. '2026' or '45')
      const isDateString = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(valStr) || 
                           /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(valStr);
      const timestamp = Date.parse(valStr);
      if (isDateString && !isNaN(timestamp)) {
        dateCount++;
      }
    });
    
    // Default fallback
    if (totalValidCount === 0) {
      columnTypes[col] = { type: 'text', uniqueCount: 0, totalValidCount };
      return;
    }
    
    const uCount = uniqueValues.size;
    
    let type = 'text';
    if (booleanCount / totalValidCount > 0.8) {
      type = 'boolean';
    } else if (numericCount / totalValidCount > 0.8) {
      type = 'numeric';
    } else if (dateCount / totalValidCount > 0.8) {
      type = 'date';
    } else if (uCount < 25 && uCount / rawRows.length < 0.3) {
      // High repetition, low absolute value set -> Categorical
      type = 'categorical';
    }
    
    columnTypes[col] = {
      type,
      uniqueCount: uCount,
      totalValidCount,
      uniqueValues: Array.from(uniqueValues).slice(0, 100) // cache up to 100 unique values
    };
  });
  
  return columnTypes;
};

/**
 * Main cleaning function
 * @param {Array<Object>} rawRows 
 * @param {Object} options Options to toggle specific cleaning tasks
 * @returns {Object} { cleanedRows, stats }
 */
export const cleanData = (rawRows, options = {}) => {
  const defaults = {
    removeDuplicates: true,
    fillMissingValues: true,
    normalizeText: true,
    standardizeCategories: true,
    parseDates: true,
    ...options
  };

  if (!rawRows || rawRows.length === 0) {
    return { cleanedRows: [], stats: { originalRows: 0, cleanedRows: 0, duplicatesRemoved: 0, nullValuesFilled: 0, qualityScore: 100 } };
  }

  const stats = {
    originalRows: rawRows.length,
    duplicatesRemoved: 0,
    nullValuesFilled: 0,
    typeCorrections: 0,
    qualityScore: 100
  };

  // 1. Infer Column Types
  const columnMetadata = inferColumnTypes(rawRows);
  
  // Compute column averages/medians for numeric imputation
  const numericImputationValues = {};
  Object.keys(columnMetadata).forEach((col) => {
    if (columnMetadata[col].type === 'numeric') {
      const vals = rawRows
        .map(r => Number(r[col]))
        .filter(v => !isNaN(v) && v !== null && v !== undefined);
      
      if (vals.length > 0) {
        // Compute median
        vals.sort((a, b) => a - b);
        const mid = Math.floor(vals.length / 2);
        const median = vals.length % 2 !== 0 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
        numericImputationValues[col] = median;
      } else {
        numericImputationValues[col] = 0;
      }
    }
  });

  // 2. Row Deduplication
  let processedRows = rawRows;
  if (defaults.removeDuplicates) {
    const seenHashes = new Set();
    const uniqueRows = [];
    
    processedRows.forEach((row) => {
      // Create a deterministic hash string for the row
      const hash = Object.keys(row)
        .sort()
        .map(key => `${key}:${row[key]}`)
        .join('|');
        
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueRows.push(row);
      } else {
        stats.duplicatesRemoved++;
      }
    });
    
    processedRows = uniqueRows;
  }

  // 3. Row-by-Row Cell Cleaning
  const cleanedRows = processedRows.map((row) => {
    const newRow = { ...row };
    
    Object.keys(newRow).forEach((col) => {
      const val = newRow[col];
      const meta = columnMetadata[col];
      
      // A. Handle Nulls / Empty values
      if (val === null || val === undefined || String(val).trim() === '') {
        if (defaults.fillMissingValues) {
          stats.nullValuesFilled++;
          if (meta.type === 'numeric') {
            newRow[col] = numericImputationValues[col] ?? 0;
          } else if (meta.type === 'date') {
            // Fill with a sentinel or leave empty. Better to leave empty but mark,
            // or fill with a standard placeholder. For visualization, let's keep it null
            // or use standard text. Let's use null so chart engines ignore it.
            newRow[col] = null;
          } else if (meta.type === 'boolean') {
            newRow[col] = false;
          } else {
            newRow[col] = 'Unknown';
          }
        } else {
          newRow[col] = null;
        }
        return;
      }

      // B. Cleaning & Type Casting
      const rawStr = String(val).trim();
      
      if (meta.type === 'numeric') {
        const num = Number(rawStr);
        if (isNaN(num)) {
          // If numeric type was inferred but this cell is not numeric (dirty data)
          stats.typeCorrections++;
          newRow[col] = defaults.fillMissingValues ? (numericImputationValues[col] ?? 0) : null;
        } else {
          newRow[col] = num;
        }
      } 
      
      else if (meta.type === 'date') {
        if (defaults.parseDates) {
          const timestamp = Date.parse(rawStr);
          if (!isNaN(timestamp)) {
            const dateObj = new Date(timestamp);
            // Format to standard ISO Date String for simple display
            newRow[col] = dateObj.toISOString().split('T')[0];
          } else {
            // Check Excel numeric date representation (e.g. 44561)
            const excelNum = Number(rawStr);
            if (!isNaN(excelNum) && excelNum > 10000 && excelNum < 60000) {
              const dateObj = XLSX.SSF.parse_date_code(excelNum);
              if (dateObj) {
                const jsDate = new Date(dateObj.y, dateObj.m - 1, dateObj.d);
                newRow[col] = jsDate.toISOString().split('T')[0];
                stats.typeCorrections++;
              } else {
                newRow[col] = null;
                stats.typeCorrections++;
              }
            } else {
              newRow[col] = null;
              stats.typeCorrections++;
            }
          }
        }
      } 
      
      else if (meta.type === 'boolean') {
        const lower = rawStr.toLowerCase();
        newRow[col] = (lower === 'true' || lower === '1' || lower === 'yes');
      } 
      
      else if (meta.type === 'categorical') {
        let cleanedCat = rawStr;
        if (defaults.normalizeText) {
          cleanedCat = rawStr.replace(/\s+/g, ' '); // collapse whitespace
        }
        if (defaults.standardizeCategories) {
          // Title Case: e.g. "active user" -> "Active User"
          cleanedCat = cleanedCat
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        newRow[col] = cleanedCat;
      } 
      
      else {
        // general text
        newRow[col] = defaults.normalizeText ? rawStr.replace(/\s+/g, ' ') : rawStr;
      }
    });
    
    return newRow;
  });

  // 4. Calculate Data Quality Score
  const totalCells = rawRows.length * Object.keys(rawRows[0]).length;
  const totalErrors = stats.duplicatesRemoved * Object.keys(rawRows[0]).length + stats.nullValuesFilled + stats.typeCorrections;
  
  const score = Math.max(0, Math.round(100 * (1 - totalErrors / (totalCells || 1))));
  stats.qualityScore = score;
  stats.cleanedRows = cleanedRows.length;
  stats.columnMetadata = inferColumnTypes(cleanedRows); // recalculate on clean data

  return {
    cleanedRows,
    stats
  };
};
