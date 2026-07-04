"use client";

import { useState, type ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";

type PieDatum = { id: string; value: number; label: string; color: string };
type OccupancyDatum = { label: string; rate: number };

// The occupancy trend line uses the lime accent so the dashboard reads branded.
const LINE_COLOR = "#cbf74f";

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

// Line chart chrome: a thicker accent line over a faint filled area, with
// small white-ringed marks at each month.
const LINE_SX = {
  ...CHART_SX,
  "& .MuiLineElement-root": { strokeWidth: 2.5 },
  "& .MuiAreaElement-root": { fillOpacity: 0.15 },
  "& .MuiMarkElement-root": { stroke: "#fff", strokeWidth: 2 },
} as const;

function ChartCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {actions}
      </div>
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

const OCCUPANCY_RANGES = [
  { months: 3, label: "3M" },
  { months: 6, label: "6M" },
  { months: 12, label: "12M" },
] as const;
type OccupancyRangeMonths = (typeof OCCUPANCY_RANGES)[number]["months"];

export function OccupancyTrendChart({ data }: { data: OccupancyDatum[] }) {
  const [rangeMonths, setRangeMonths] = useState<OccupancyRangeMonths>(12);
  const visibleData = data.slice(-rangeMonths);

  return (
    <ChartCard
      title={`Occupancy rate · last ${rangeMonths} months`}
      actions={
        <ToggleButtonGroup
          value={rangeMonths}
          exclusive
          size="small"
          onChange={(_, next) => {
            if (next !== null) setRangeMonths(next);
          }}
        >
          {OCCUPANCY_RANGES.map(({ months, label }) => (
            <ToggleButton key={months} value={months} sx={{ px: 1.5, py: 0.25, fontSize: "0.75rem" }}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      }
    >
      {visibleData.length === 0 ? (
        <EmptyChart message="No occupancy data yet." />
      ) : (
        <LineChart
          dataset={visibleData}
          xAxis={[
            {
              scaleType: "point",
              dataKey: "label",
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: TICK_LABEL_STYLE,
            },
          ]}
          yAxis={[
            {
              min: 0,
              max: 100,
              disableLine: true,
              disableTicks: true,
              tickLabelStyle: TICK_LABEL_STYLE,
              valueFormatter: (value: number) => `${value}%`,
            },
          ]}
          series={[
            {
              dataKey: "rate",
              label: "Occupancy",
              color: LINE_COLOR,
              area: true,
              curve: "monotoneX",
              valueFormatter: (value) => (value == null ? "" : `${value}%`),
            },
          ]}
          grid={{ horizontal: true }}
          height={220}
          hideLegend
          sx={LINE_SX}
        />
      )}
    </ChartCard>
  );
}
