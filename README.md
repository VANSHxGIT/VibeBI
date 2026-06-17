# 🌌 VibeBI

VibeBI is a premium, client-side, zero-server-dependency business intelligence dashboard application. It allows users to instantly transform raw spreadsheet and database dump files into stunning, interactive, and offline-capable analytics dashboards. Built with React and Vite, all processing, data cleaning, schema parsing, and chart rendering happen 100% locally in the user's browser, ensuring absolute data security and privacy.

![VibeBI Demo Mockup](https://raw.githubusercontent.com/VANSHxGIT/VibeBI/main/src/assets/hero.png)

---

## 🚀 Key Features

### 1. Multi-Format Dataset Parsing
Ingest files instantly with zero backend storage required:
*   📊 **Microsoft Excel (.xlsx, .xls)**: Automatically extracts multiple worksheets, retaining tabular grids and cell structures.
*   📑 **CSV Spreadsheets (.csv)**: Extremely fast streaming parsing of comma-separated sheets using PapaParse.
*   🗄️ **SQL Database Dumps (.sql)**: Features a custom SQL script parser that parses `CREATE TABLE` structures and handles multiline `INSERT INTO` statements with nested values, mapping them to data sheets dynamically.

### 2. Live Data Audit & Auto-Cleaning Engine
An intelligent data-preprocessing pipeline cleans dataset anomalies on the fly:
*   🎯 **Circular Quality Audit Score**: A live gauge that rates the overall quality of the dataset based on null density, duplicates, and type mismatches.
*   🔄 **Exact Row Deduplication**: Finds and purges duplicate rows.
*   🩹 **Smart Imputation (Nulls & Missing values)**: Automatically fills missing numbers with column medians, resolves empty text cells to placeholders, and marks missing dates.
*   🔤 **Text Normalization**: Strips excessive whitespace and standardizes category fields into clean Title Case formatting.
*   📅 **Excel Serial Date Parsing**: Detects and transforms both standard ISO date formats and Excel serialized numerical dates.

### 3. Schema & Column Type Inference
Analyzes column variables and categorizes them into specialized types:
*   `numeric` (Numbers, Metrics, Currency)
*   `date` (Time-series chronological data)
*   `categorical` (Cardinal grouping fields)
*   `boolean` (True/False triggers)
*   `text` (General descriptive strings)

### 4. Intelligent Visual Recommender
Upon parsing, VibeBI reads column metadata and recommends a tailored set of starting KPIs and visual charts based on heuristics:
*   **KPI Metrics Cards**: Automatically detects prime numeric columns and plots dynamic totals (Sum, Avg, Min, Max, Count).
*   **Time Series Trends**: Suggests Line and Area charts when Date fields match numerical targets.
*   **Categorical Comparisons**: Generates Column, Bar, and Stacked/Percent Stacked charts for categories.
*   **Correlation & Distributions**: Plots Donut/Pie charts for low-cardinality splits, and Scatter/Bubble charts to explore correlations.

### 5. Advanced Business Visuals (Custom SVG Renderers)
VibeBI goes beyond standard charting with a suite of custom-engineered visuals:
*   🌳 **Decomposition Tree**: An interactive drill-down tool. Select category splits in sequence, automatically calculating totals and segment percentages on the path.
*   🎗️ **Ribbon Chart**: A ranked stacked area chart displaying flow connectors between categories using smooth Bezier curves.
*   🎨 **Heatmap Table Matrix**: Shaded grid values representing metric densities across multiple pivot splits.
*   🌀 **Funnel Chart**: Tracks conversion segments using customized proportional SVG blocks with gradient transitions.
*   🛰️ **Azure Maps HUD**: A holographic geospatial tracker. Feeds coordinate columns into an SVG projection map overlaying global landmass outlines, complete with target crosshairs and telemetry metrics logs.
*   📉 **Waterfall Chart**: Displays cumulative financial or inventory increments/decrements in floating bridge steps.
*   🕰️ **Glow Gauge**: An SVG needle dial highlighting percentage values and target bounds.

### 6. Interactive Slicer Filtering & Cross-Filtering
*   **Category Slicers**: Dynamically filter the dashboard via automatically configured drop-down selectors.
*   **Cross-Chart Filtering**: Click on any bar segment, pie slice, or map node to automatically filter the rest of the dashboard on that specific coordinate.

### 7. Rich Export & Portability Suite
*   💾 **Cleaned Data Exports**: Save your processed data back to a clean `.csv` or formatted `.xlsx` spreadsheet.
*   🖨️ **Print & PDF Layouts**: A print-optimized CSS layout for producing clean PDF paper reports.
*   🌐 **Standalone Interactive HTML**: **The ultimate portability feature.** Generates and downloads a self-contained single `.html` dashboard file. It embeds the cleaned dataset, Tailwind CSS, and ApexCharts scripting, allowing users to send interactive dashboards offline or view them on any device without servers or builders.

---

## 🛠️ Technology Stack

| Layer | Technologies & Libraries Used |
| :--- | :--- |
| **Core Framework** | React 19, JavaScript (ES6+), Vite (Build Tool & Dev Server) |
| **Animation Engine** | Framer Motion (page transitions, canvas modals, and micro-interactions) |
| **Standard Charts** | Recharts (Responsive Line, Area, Column, Bar, Stacked, Scatter, and Treemap charts) |
| **Utility Parsers** | SheetJS / `xlsx` (Excel parsing/exporting), PapaParse (CSV parsing) |
| **Icons Library** | Lucide React |
| **Styling Paradigm** | Premium Vanilla CSS (custom glassmorphic designs, CSS variables, dark layout, custom scrollbars) |
| **HTML Export** | Injected ApexCharts (via CDN), Tailwind CSS framework (via CDN), custom vanilla JS event listener controllers |

---

## 📁 Project Structure

```
├── public/
│   ├── favicon.svg             # Page icon
│   └── icons.svg               # SVG asset icons
├── src/
│   ├── assets/                 # Image assets (hero illustrations, logos)
│   ├── components/
│   │   ├── Navbar.jsx          # Header controls (reset & branding)
│   │   ├── UploadZone.jsx      # Drag-and-drop workspace uploader
│   │   ├── CleaningReport.jsx  # Interactive quality score dial & data-clean settings
│   │   ├── Dashboard.jsx       # Standard charting canvas, interactive slicers, and modal config
│   │   ├── ExportPanel.jsx     # Export panel (CSV, Excel, PDF, and Standalone HTML generation)
│   │   └── AdvancedVisuals.jsx # Custom SVG visuals (Gauge, Funnel, Matrix, Maps, Decomposition Tree, Ribbon)
│   ├── utils/
│   │   ├── dataCleaner.js      # Column type inference, row deduplication, and cell-level clean scripts
│   │   ├── dataParser.js       # File parsers (CSV, SheetJS Excel parser, custom SQL script lexer)
│   │   └── visualRecommender.js# Automatic KPI metrics and chart config generator heuristics
│   ├── App.jsx                 # Application layout coordinator and central state
│   ├── App.css                 # Sidebar layouts, grids, modals, and responsive layout styling
│   ├── index.css               # Core styling tokens, dark palette variables, typography, and glass cards
│   └── main.jsx                # React client entry point
├── package.json                # Project dependencies and script runner configurations
└── vite.config.js              # Vite compiler plugins and configurations
```

---

## 🏃 Local Setup & Installation

Follow these steps to run VibeBI locally on your machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16.0.0 or higher) installed.

### 1. Clone & Navigate
```bash
git clone https://github.com/VANSHxGIT/VibeBI.git
cd VibeBI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to the local link displayed in your terminal (usually `http://localhost:5173`).

### 4. Build for Production
To generate a minimized, optimized bundle in the `/dist` directory for production deployment:
```bash
npm run build
```

---

## 🗺️ How to Use

1.  **Launch the App**: Open VibeBI in your browser.
2.  **Upload a Dataset**: Drag and drop any Excel, CSV, or SQL script file. You can also select the default sample coordinate mapping file included in the root directory (`mock_sales_coordinates.csv`).
3.  **Inspect Audit & Configure Cleaning**: Look at the **Data Quality Audit** score. Toggle options (like removing duplicates or imputing missing numbers) and watch the dashboard update in real-time.
4.  **Explore the Dashboard**: Hover over standard charts, drill down into category branches with the **Decomposition Tree**, toggle styles inside the **Azure Maps HUD**, or rank segments with the **Ribbon Chart**.
5.  **Edit/Add Visuals**: Click the **Add Visual Chart** button to select custom axes, fields, and aggregates, or click the **Edit** pencil icon on any existing card.
6.  **Export Your Insights**: Go to the **Export Workspace** panel on the left sidebar to download the cleaned spreadsheet or save a standalone offline interactive report.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
