"use client";

import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

type PieDatum = { id: string; value: number; label: string; color: string };
type TypeDatum = { label: string; count: number };

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
          series={[
            {
              data,
              innerRadius: 40,
              paddingAngle: 2,
              cornerRadius: 3,
              arcLabel: "value",
              arcLabelMinAngle: 20,
            },
          ]}
          height={220}
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
          series={[
            {
              data,
              innerRadius: 40,
              paddingAngle: 2,
              cornerRadius: 3,
              arcLabel: "value",
              arcLabelMinAngle: 20,
            },
          ]}
          height={220}
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
          yAxis={[{ scaleType: "band", dataKey: "label", width: "auto" }]}
          xAxis={[
            {
              scaleType: "linear",
              min: 0,
              max: maxCount,
              tickInterval: ticks,
              valueFormatter: (value: number) => value.toString(),
            },
          ]}
          series={[{ dataKey: "count", label: "Properties", color: "#2a78d6" }]}
          height={220}
          hideLegend
        />
      )}
    </ChartCard>
  );
}
