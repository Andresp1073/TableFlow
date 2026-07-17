# Enterprise Business Intelligence Platform — Phase 14.7

## Overview

The Enterprise Business Intelligence Platform is an independent bounded context within TableFlow, following Domain-Driven Design and Clean Architecture. It provides metrics calculation, KPI management, dataset building, trend analysis, and report generation without external analytics provider dependencies.

## Architecture

```
modules/analytics/
├── domain/
│   ├── models/                           # Aggregate roots & value objects
│   │   ├── BusinessMetric.ts             (# metric definition with category, unit, period)
│   │   ├── BusinessDimension.ts          (# dimension types for data slicing)
│   │   ├── KpiDefinition.ts             (# KPI formula, targets, thresholds, direction)
│   │   ├── KpiRecord.ts                 (# KPI snapshot with variance & status)
│   │   ├── MetricRecord.ts              (# persisted metric snapshot)
│   │   ├── AnalyticsDataset.ts          (# typed datasets: aggregated, historical, operational, analytical)
│   │   ├── AnalyticsReport.ts           (# report with JSON/CSV export)
│   │   ├── ReportDefinition.ts          (# scheduled/on-demand report config)
│   │   └── AnalyticsQuery.ts            (# query model with filters, groups, comparisons)
│   ├── events/                           # 5 domain events
│   ├── repositories/                     # Interfaces: Metric, Kpi, Dataset, Report, Query
│   └── services/                         # MetricsEngine, KpiEngine, TrendAnalyzer, DatasetBuilder, ReportGenerator, AnalyticsManager
├── application/
│   ├── services/                         # BusinessIntelligenceService
│   └── dtos/                             # MetricDto, KpiDto, DatasetDto, ReportDto, AnalyticsQueryDto
├── infrastructure/
│   └── repositories/                     # In-memory implementations
├── errors/                               # MetricCalculationError, KpiCalculationError, ReportGenerationError, DatasetBuildError
├── presentation/                         # (to be wired by composition root)
└── tests/                                # 7 test files, 90+ tests
```

## Metrics Model

The `MetricsEngine` uses the **Strategy Pattern** to support multiple metric types:

| Metric Strategy        | Category     | Unit       | Period  |
|------------------------|--------------|------------|---------|
| RevenueMetricStrategy  | financial    | usd        | daily   |
| AverageTicketStrategy  | financial    | usd        | daily   |
| OccupancyRateStrategy  | operational  | percentage | daily   |
| ReservationConversion  | reservation  | percentage | daily   |
| NoShowRateStrategy     | reservation  | percentage | daily   |
| CustomerRetention      | customer     | percentage | monthly |
| InventoryTurnover      | inventory    | ratio      | monthly |
| KitchenPrepTime        | kitchen      | minutes    | hourly  |

### Custom Providers

Custom metric providers can be registered at runtime:
```typescript
service.registerMetricProvider("custom_metric", async (params) => ({
  name: "custom_metric",
  category: "operational",
  value: 42,
  unit: "count",
  period: "daily",
}));
```

## KPI Lifecycle

```
1. Define KPI → KpiDefinition (formula, target, thresholds)
2. Calculate metrics → MetricRecords
3. Run KPI Engine → calculateValue(formula, records)
4. Evaluate status → evaluateStatus(actual) → on_track | warning | critical | exceeded
5. Persist → KpiRecord with variance & status
6. Publish → KpiUpdated event
```

### Supported Formulas

| Formula          | Description                          |
|------------------|--------------------------------------|
| direct           | Latest value                         |
| average          | Mean of period values                |
| sum              | Total of period values               |
| ratio            | Current / previous period            |
| percentage       | (Current - Previous) / Previous      |
| year_over_year   | YoY comparison                       |
| week_over_week   | WoW comparison                       |
| month_over_month | MoM comparison                       |
| custom           | User-defined (returns target)        |

### KPI Directions

- **higher_is_better** — values above target are "exceeded"
- **lower_is_better** — values below target are "exceeded"
- **target_is_best** — exact target match is optimal

## Analytics Workflow

```
Raw Data
  → MetricsEngine.calculate() → BusinessMetric + MetricRecord
    → KpiEngine.calculate() → KpiRecord with status
    → DatasetBuilder.build() → AnalyticsDataset (aggregated/historical/operational/analytical)
      → ReportGenerator.generate() → AnalyticsReport (JSON/CSV)
      → TrendAnalyzer.analyze() → TrendAnalysis
        → Period Comparison → ComparisonResult
```

## Dataset Types

| Type         | Description                                      |
|--------------|--------------------------------------------------|
| aggregated   | Grouped by dimensions with avg/sum/count per metric |
| historical   | Raw time-series records with metadata            |
| operational  | Latest snapshot per metric for real-time view    |
| analytical   | Pivoted dataset — metrics as columns, dimensions as rows |
| comparative  | Period-over-period comparison data               |
| trend        | Trend direction and velocity analysis            |

## Report Generator

The `ReportGenerator` supports multiple report types:

| Report Type       | Description                                    |
|-------------------|------------------------------------------------|
| generateFromData  | Creates report from raw data array             |
| generateFromDataset | Creates report with summary statistics       |
| generateTrendReport | Trend analysis report                        |
| generateComparisonReport | Period comparison report               |
| generateGrowthReport | Growth analysis over time                  |
| generatePerformanceReport | Multi-dataset performance report        |
| generateEfficiencyReport | Operational vs financial efficiency      |
| generateScheduledReport | Auto-generated period summary            |

### Export

- **JSON**: `report.toJSON()` — structured data with metadata
- **CSV**: `report.toCSV()` — comma-separated with proper quoting

## Events

| Event                  | Payload                                                     |
|------------------------|-------------------------------------------------------------|
| MetricCalculated       | metricId, restaurantId, name, category, value, unit, period |
| KpiUpdated             | kpiRecordId, kpiDefinitionId, value, target, variance, status |
| ReportGenerated        | reportId, definitionId, name, type, format, recordCount     |
| AnalyticsDatasetBuilt  | datasetId, name, type, dimensions, metrics, recordCount     |
| TrendDetected          | restaurantId, metricName, trend, currentValue, previousValue |

## Dimensions

The platform supports the following dimension types for data slicing:

- restaurant
- dining_area
- table
- reservation
- customer
- payment
- order
- inventory
- time
- employee
- menu_item
- promotion
- channel

## Tests

```bash
npx vitest run src/modules/analytics/tests
```

7 test files, 90+ tests covering metrics engine, KPI engine, dataset builder, report generator, trend analyzer, analytics manager, and full integration.

## Future AI Integration

- Anomaly detection on metric streams
- Predictive KPI forecasting
- Automated trend analysis and alerts
- Natural language query interface
- Intelligent report scheduling optimization
- Automated insight generation from dataset analysis
