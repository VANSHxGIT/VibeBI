/**
 * Intelligent Visual Recommender Engine
 * Recommends optimal charts and KPIs based on data types and heuristics, and executes aggregates.
 */

/**
 * Recommends widgets for a dataset based on its column metadata.
 * @param {Array<Object>} cleanedRows 
 * @param {Object} columnMetadata 
 * @returns {Array<Object>} Array of recommended widget configurations
 */
export const recommendWidgets = (cleanedRows, columnMetadata) => {
  if (!cleanedRows || cleanedRows.length === 0 || !columnMetadata) return [];

  const widgets = [];
  const columns = Object.keys(columnMetadata);
  
  const numericCols = columns.filter(col => columnMetadata[col].type === 'numeric');
  const dateCols = columns.filter(col => columnMetadata[col].type === 'date');
  const categoricalCols = columns.filter(col => 
    columnMetadata[col].type === 'categorical' || 
    (columnMetadata[col].type === 'boolean')
  );

  // 1. KPI Cards Recommendation
  // Recommend up to 3 KPI cards for the top numeric fields
  let kpiCount = 0;
  numericCols.slice(0, 3).forEach((col) => {
    widgets.push({
      id: `kpi-${col}-${kpiCount++}`,
      title: `Total ${col.replace(/_/g, ' ')}`,
      type: 'kpi',
      yAxis: col,
      aggregation: 'sum',
      w: 4, // takes 1/3 of row width
      h: 2
    });
  });
  
  // If no numeric columns exist, make a Row Count KPI card
  if (widgets.length === 0) {
    widgets.push({
      id: 'kpi-row-count',
      title: 'Total Records',
      type: 'kpi',
      yAxis: null,
      aggregation: 'count',
      w: 4,
      h: 2
    });
  }

  // 2. Line/Area Chart Recommendations (Time Series Trends)
  // Match Date columns with Numeric columns
  dateCols.forEach((dateCol) => {
    numericCols.slice(0, 2).forEach((numCol, idx) => {
      widgets.push({
        id: `chart-trend-${dateCol}-${numCol}-${idx}`,
        title: `${numCol.replace(/_/g, ' ')} Trend Over Time`,
        type: idx === 0 ? 'area' : 'line',
        xAxis: dateCol,
        yAxis: numCol,
        aggregation: 'sum',
        w: 6, // half width
        h: 4
      });
    });
  });

  // 3. Bar/Column Chart Recommendations (Categorical Comparisons)
  // Match Categorical columns with Numeric columns
  categoricalCols.forEach((catCol) => {
    // If category has a small/medium number of unique values, it's a great fit for comparison
    const uniqueCount = columnMetadata[catCol].uniqueCount;
    
    if (uniqueCount > 1 && uniqueCount <= 20) {
      // Bar or Column Chart
      numericCols.slice(0, 2).forEach((numCol, idx) => {
        widgets.push({
          id: `chart-compare-${catCol}-${numCol}-${idx}`,
          title: `${numCol.replace(/_/g, ' ')} by ${catCol.replace(/_/g, ' ')}`,
          type: idx === 0 ? 'column' : 'bar',
          xAxis: catCol,
          yAxis: numCol,
          aggregation: 'sum',
          w: 6,
          h: 4
        });
      });
      
      // If no numeric column, recommend a Record Count bar chart
      if (numericCols.length === 0) {
        widgets.push({
          id: `chart-compare-count-${catCol}`,
          title: `Records by ${catCol.replace(/_/g, ' ')}`,
          type: 'column',
          xAxis: catCol,
          yAxis: null,
          aggregation: 'count',
          w: 6,
          h: 4
        });
      }
    }
  });

  // 4. Pie/Donut Chart Recommendations (Composition)
  // Find very low cardinality categories (e.g. 2-7 values)
  categoricalCols.forEach((catCol) => {
    const uniqueCount = columnMetadata[catCol].uniqueCount;
    if (uniqueCount >= 2 && uniqueCount <= 7) {
      const numCol = numericCols[0] || null;
      widgets.push({
        id: `chart-composition-${catCol}`,
        title: `${(numCol || 'Records').replace(/_/g, ' ')} Distribution by ${catCol.replace(/_/g, ' ')}`,
        type: 'donut',
        xAxis: catCol,
        yAxis: numCol,
        aggregation: numCol ? 'sum' : 'count',
        w: 6,
        h: 4
      });
    }
  });

  // 5. Scatter Plot Recommendations (Correlations)
  // If we have at least 2 numeric columns, let's create a scatter plot
  if (numericCols.length >= 2) {
    widgets.push({
      id: 'chart-correlation-scatter',
      title: `${numericCols[0].replace(/_/g, ' ')} vs ${numericCols[1].replace(/_/g, ' ')}`,
      type: 'scatter',
      xAxis: numericCols[0],
      yAxis: numericCols[1],
      aggregation: 'none', // plots raw points
      w: 6,
      h: 4
    });
  }

  // Cap recommendations at 8 widgets to prevent cluttering, sorting them logically: KPIs first, then charts
  const sortedWidgets = widgets.sort((a, b) => {
    if (a.type === 'kpi' && b.type !== 'kpi') return -1;
    if (a.type !== 'kpi' && b.type === 'kpi') return 1;
    return 0;
  });

  // Return at least 4 default widgets (if list is short, pad it)
  return sortedWidgets.slice(0, 8);
};

/**
 * Aggregates a dataset based on x and y axes and type.
 * @param {Array<Object>} data Cleaned rows
 * @param {string} xAxis Name of the X-axis key (group by)
 * @param {string} yAxis Name of the Y-axis key (value to aggregate)
 * @param {string} type Aggregation type: 'sum' | 'avg' | 'count' | 'none'
 * @returns {Array<Object>} Aggregated data formatted for Recharts
 */
export const aggregateData = (data, xAxis, yAxis, type) => {
  if (!data || data.length === 0) return [];
  if (!xAxis) return [];

  // If type is 'none', just return raw values mapped for the chart
  if (type === 'none') {
    return data.map(row => ({
      name: String(row[xAxis]),
      x: row[xAxis],
      y: yAxis ? Number(row[yAxis]) : 1
    }));
  }

  const groups = {};

  data.forEach((row) => {
    // Treat null/empty X-axis values as 'Unknown'
    const xVal = row[xAxis] === null || row[xAxis] === undefined ? 'Unknown' : String(row[xAxis]);
    const yVal = yAxis ? Number(row[yAxis]) : 0;

    if (!groups[xVal]) {
      groups[xVal] = { sum: 0, count: 0, values: [] };
    }

    if (yAxis) {
      if (!isNaN(yVal) && row[yAxis] !== null && row[yAxis] !== undefined) {
        groups[xVal].sum += yVal;
        groups[xVal].count += 1;
        groups[xVal].values.push(yVal);
      }
    } else {
      // For record counts
      groups[xVal].sum += 1;
      groups[xVal].count += 1;
    }
  });

  // Convert groups map to array of objects
  const result = Object.keys(groups).map((key) => {
    const group = groups[key];
    let val = 0;
    
    if (type === 'sum') {
      val = group.sum;
    } else if (type === 'avg') {
      val = group.count > 0 ? (group.sum / group.count) : 0;
    } else if (type === 'count') {
      val = group.count;
    }

    return {
      name: key,
      value: Number(val.toFixed(2)) // Round to 2 decimal places
    };
  });

  // Sort:
  // If the X-axis is a date, sort chronologically
  const isDate = data.some(row => {
    const val = row[xAxis];
    return val && /^\d{4}-\d{2}-\d{2}$/.test(String(val));
  });

  if (isDate) {
    return result.sort((a, b) => new Date(a.name) - new Date(b.name));
  }
  
  // Otherwise, sort by value descending to make charts look neat
  return result.sort((a, b) => b.value - a.value);
};

/**
 * Computes a single scalar aggregate (for KPI Cards).
 * @param {Array<Object>} data 
 * @param {string} col Column name
 * @param {string} type 'sum' | 'avg' | 'count' | 'min' | 'max'
 * @returns {number}
 */
export const calculateKPIMetric = (data, col, type) => {
  if (!data || data.length === 0) return 0;
  
  if (type === 'count') {
    return data.length;
  }

  if (!col) return 0;

  const validVals = data
    .map(row => Number(row[col]))
    .filter(val => !isNaN(val) && val !== null && val !== undefined);

  if (validVals.length === 0) return 0;

  if (type === 'sum') {
    return validVals.reduce((sum, v) => sum + v, 0);
  }
  if (type === 'avg') {
    return validVals.reduce((sum, v) => sum + v, 0) / validVals.length;
  }
  if (type === 'max') {
    return Math.max(...validVals);
  }
  if (type === 'min') {
    return Math.min(...validVals);
  }
  return 0;
};

/**
 * Pivots and aggregates a dataset based on xAxis, yAxis, legendCol (split field), and aggregation type.
 * Useful for grouped, stacked, and layered visualizations.
 */
export const aggregateDataPivot = (data, xAxis, yAxis, legendCol, type) => {
  if (!data || data.length === 0 || !xAxis) return { chartData: [], seriesNames: [] };

  // If no legend column, use standard single aggregation
  if (!legendCol) {
    const standardData = aggregateData(data, xAxis, yAxis, type);
    return {
      chartData: standardData.map(d => ({ name: d.name, value: d.value })),
      seriesNames: ['value']
    };
  }

  // Pivot data
  const groups = {};
  const seriesSet = new Set();

  data.forEach(row => {
    const xVal = row[xAxis] === null || row[xAxis] === undefined ? 'Unknown' : String(row[xAxis]);
    const legendVal = row[legendCol] === null || row[legendCol] === undefined ? 'Unknown' : String(row[legendCol]);
    const yVal = yAxis ? Number(row[yAxis]) : 0;

    seriesSet.add(legendVal);

    if (!groups[xVal]) {
      groups[xVal] = {};
    }
    if (!groups[xVal][legendVal]) {
      groups[xVal][legendVal] = { sum: 0, count: 0 };
    }

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
    
    seriesNames.forEach(seriesName => {
      const g = groups[xVal][seriesName];
      if (g) {
        let val = 0;
        if (type === 'sum') val = g.sum;
        else if (type === 'avg') val = g.count > 0 ? (g.sum / g.count) : 0;
        else if (type === 'count') val = g.count;
        
        item[seriesName] = Number(val.toFixed(2));
        total += item[seriesName];
      } else {
        item[seriesName] = 0;
      }
    });
    
    item._total = Number(total.toFixed(2));
    return item;
  });

  // Sort
  const isDate = data.some(row => {
    const val = row[xAxis];
    return val && /^\d{4}-\d{2}-\d{2}$/.test(String(val));
  });

  if (isDate) {
    chartData.sort((a, b) => new Date(a.name) - new Date(b.name));
  } else {
    chartData.sort((a, b) => b._total - a._total);
  }

  return { chartData, seriesNames };
};
