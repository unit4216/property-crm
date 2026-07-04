"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

type PieDatum = { id: string; value: number; label: string; color: string };
type TypeDatum = { label: string; count: number };

// Single-metric bars use the lime accent so the dashboard reads as branded.
const BAR_COLOR = "#cbf74f";

// Muted tick labels in the app's font scale.
const TICK_LABEL_STYLE = { fontSize: 12, fill: "var(--ink-muted)" } as const;

// Shared chart chrome: hairline axes/grid and muted legend text, mapped to the
// design tokens in globals.css so charts sit inside the rest of the UI.
const CHART_SX = {
  "& .MuiChartsAxis-line": { stroke: "var(--border-strong)" },
  "& .MuiChartsAxis-tick": { stroke: "var(--border-strong)" },
  "& .MuiChartsGrid-line": { stroke: "var(--border)" },
  "& .MuiChartsLegend-label": {
    fontSize: "0.75rem",
    color: "var(--ink-muted)",
  },
} as const;

// Bright slices carry dark ink arc labels (white would vanish on the lime).
const PIE_SX = {
  ...CHART_SX,
  "& .MuiPieArcLabel-root": {
    fill: "var(--ink)",
    fontWeight: 600,
    fontSize: 12,
  },
} as const;

// Donut with rounded slice corners and a gap between slices.
const PIE_SERIES = {
  innerRadius: 40,
  paddingAngle: 5,
  cornerRadius: 3,
  arcLabel: "value" as const,
  arcLabelMinAngle: 20,
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center">
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}

export function PropertyStatusChart({ data }: { data: PieDatum[] }) {
  return (
    <ChartCard title="Properties by status">
      {data.length === 0 ? (
        <EmptyChart message="No properties yet." />
      ) : (
        <PieChart
          series={[{ ...PIE_SERIES, data }]}
          height={220}
          sx={PIE_SX}
        />
      )}
    </ChartCard>
  );
}

export function LeaseStatusChart({ data }: { data: PieDatum[] }) {
  return (
    <ChartCard title="Leases by status">
      {data.length === 0 ? (
        <EmptyChart message="No leases yet." />
      ) : (
        <PieChart
          series={[{ ...PIE_SERIES, data }]}
          height={220}
          sx={PIE_SX}
        />
      )}
    </ChartCard>
  );
}

export function PropertyTypeChart({ dataset }: { dataset: TypeDatum[] }) {
  const maxCount = Math.max(1, ...dataset.map((d) => d.count));
  // Integer-only ticks — counts are whole numbers, so a linear scale's
  // default decimal ticks (0.05, 0.10, ...) would be misleading here.
  const ticks = Array.from({ length: maxCount + 1 }, (_, i) => i);

  return (
    <ChartCard title="Properties by type">
      {dataset.length === 0 ? (
        <EmptyChart message="No properties yet." />
      ) : (
        <BarChart
          layout="horizontal"
          dataset={dataset}
          yAxis={[
            {
              scaleType: "band",
              dataKey: "label",
              width: "auto",
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: TICK_LABEL_STYLE,
            },
          ]}
          xAxis={[
            {
              scaleType: "linear",
              min: 0,
              max: maxCount,
              tickInterval: ticks,
              valueFormatter: (value: number) => value.toString(),
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: TICK_LABEL_STYLE,
            },
          ]}
          series={[{ dataKey: "count", label: "Properties", color: BAR_COLOR }]}
          grid={{ vertical: true }}
          borderRadius={2}
          height={220}
          hideLegend
          sx={CHART_SX}
        />
      )}
    </ChartCard>
  );
}
