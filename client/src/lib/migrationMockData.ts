import { ChartConfig } from "@/components/ui/chart";

// Project Workspace Data
export const migrationProjects = [
  { id: "MP-2025-001", name: "Global Private Credit Migration", status: "In Progress", progress: 65, source: "Legacy Mainframe (Db2)", target: "Snowflake Cloud Data Platform", owner: "Data Ops Team A", lastUpdated: "2h ago" },
  { id: "MP-2025-002", name: "Equities Trade History Archival", status: "Completed", progress: 100, source: "On-Prem Oracle", target: "Cloud Object Archive", owner: "Compliance IT", lastUpdated: "1d ago" },
  { id: "MP-2025-003", name: "Real Estate Fund Valuation Sync", status: "Planning", progress: 15, source: "Excel / Sharepoint", target: "Anaplan", owner: "Finance Systems", lastUpdated: "4h ago" },
];

// Designer Data (Mappings)
export const sourceSchema = [
  { field: "TRD_ID", type: "CHAR(10)", sample: "T-9921" },
  { field: "ASSET_CDE", type: "VARCHAR(5)", sample: "EQ" },
  { field: "NOTIONAL_AMT", type: "DECIMAL(18,2)", sample: "150000.00" },
  { field: "TRADE_DT", type: "DATE", sample: "2024-01-15" },
  { field: "COUNTERPARTY", type: "VARCHAR(50)", sample: "JPM_NY" },
];

export const targetSchema = [
  { field: "trade_uuid", type: "UUID", required: true },
  { field: "asset_class", type: "ENUM", required: true },
  { field: "notional_value", type: "FLOAT", required: true },
  { field: "trade_timestamp", type: "TIMESTAMP_NTZ", required: true },
  { field: "counterparty_id", type: "STRING", required: false },
];

export const mappingRules = [
  { id: 1, source: "TRD_ID", target: "trade_uuid", rule: "HASH_GENERATION", status: "Valid" },
  { id: 2, source: "ASSET_CDE", target: "asset_class", rule: "LOOKUP_MAP(Reference_Assets)", status: "Valid" },
  { id: 3, source: "NOTIONAL_AMT", target: "notional_value", rule: "DIRECT_CAST", status: "Valid" },
  { id: 4, source: "TRADE_DT", target: "trade_timestamp", rule: "TO_TIMESTAMP_NTZ", status: "Valid" },
];

// Execution Data
export const executionLogs = [
  { time: "10:00:01", level: "INFO", message: "Job started: MP-2025-001_Batch_42" },
  { time: "10:00:05", level: "INFO", message: "Connection established to Source: Db2_Mainframe" },
  { time: "10:00:08", level: "INFO", message: "Extracting 1.5M records..." },
  { time: "10:00:45", level: "INFO", message: "Extraction complete. buffer_size=2GB" },
  { time: "10:00:48", level: "INFO", message: "Transformation pipeline initiated (Spark Cluster)" },
  { time: "10:01:15", level: "WARN", message: "Data Type Mismatch in col 'COUNTERPARTY' - performing auto-correction" },
  { time: "10:02:00", level: "INFO", message: "Loading to Target: Snowflake_Prod" },
  { time: "10:02:30", level: "SUCCESS", message: "Batch completed successfully. 1,499,982 records loaded." },
];

// Validation Data
export const validationStats = {
  totalRows: 1500000,
  successRows: 1499982,
  failedRows: 18,
  nullCount: 450,
  outlierCount: 12,
  confidenceScore: 99.8,
  dqRules: [
    { name: "Unique ID Check", status: "Pass", score: 100 },
    { name: "Asset Class Enum", status: "Pass", score: 100 },
    { name: "Notional > 0", status: "Warn", score: 99.9 },
    { name: "Date Format ISO", status: "Pass", score: 100 },
  ]
};

// Lineage Nodes
export const lineageNodes = [
  { id: '1', type: 'source', label: 'Legacy Mainframe', position: { x: 0, y: 100 } },
  { id: '2', type: 'process', label: 'Spark Transformation', position: { x: 250, y: 100 } },
  { id: '3', type: 'process', label: 'Data Quality Firewall', position: { x: 500, y: 100 } },
  { id: '4', type: 'target', label: 'Snowflake (Gold)', position: { x: 750, y: 100 } },
  { id: '5', type: 'consumer', label: 'Portfolio Dashboard', position: { x: 1000, y: 50 } },
  { id: '6', type: 'consumer', label: 'Regulatory Reporting', position: { x: 1000, y: 150 } },
];

// Summary KPI
export const migrationKPIs = {
  latencyImprovement: "92%",
  dataQualityUplift: "+14%",
  costReduction: "35%",
  legacyRetired: "4 Systems"
};
