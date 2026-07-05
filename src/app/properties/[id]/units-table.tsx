"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { LeaseStatusBadge } from "@/components/badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { Unit } from "@/db/schema";
import type { LeaseWithUnitAndTenants } from "@/db/queries";
import { EndLeaseButton } from "../end-lease-button";

// The units table hand-rolls its own MUI table (rather than DataTable) so it can
// carry per-unit lease context. Each row expands to reveal that unit's full
// lease history — the same leases the parent already loaded, grouped by unit.
export type UnitRow = {
  unit: Unit;
  // Every lease for this unit, newest first (as returned by getPropertyLeases).
  leases: LeaseWithUnitAndTenants[];
};

// The unit's "current" lease drives the collapsed row: the active one, or an
// upcoming one if the unit is between tenants.
function currentLeaseOf(leases: LeaseWithUnitAndTenants[]) {
  return (
    leases.find((l) => l.status === "active") ??
    leases.find((l) => l.status === "upcoming") ??
    null
  );
}

function leaseTerm(lease: LeaseWithUnitAndTenants) {
  return `${formatDate(new Date(lease.startDate))} – ${
    lease.endDate ? formatDate(new Date(lease.endDate)) : "present"
  }`;
}

// Total number of columns, so the expanded panel's cell can span the full row.
const COL_SPAN = 7;

export function UnitsTable({
  propertyId,
  rows,
}: {
  propertyId: string;
  rows: UnitRow[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (unitId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });

  return (
    <Stack sx={{ mt: 2, bgcolor: "var(--surface)", overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }} />
            <TableCell>Unit</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
              Term
            </TableCell>
            <TableCell align="right">Rent</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ unit, leases }) => {
            const currentLease = currentLeaseOf(leases);
            const isOpen = expanded.has(unit.id);
            const hasHistory = leases.length > 0;

            return (
              <Fragment key={unit.id}>
                <TableRow hover>
                  <TableCell>
                    {hasHistory && (
                      <IconButton
                        size="small"
                        onClick={() => toggle(unit.id)}
                        aria-label={
                          isOpen ? "Hide lease history" : "Show lease history"
                        }
                        aria-expanded={isOpen}
                      >
                        <Chevron open={isOpen} />
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold">{unit.label}</span>
                  </TableCell>
                  <TableCell>
                    {currentLease ? (
                      <LeaseStatusBadge status={currentLease.status} />
                    ) : (
                      <span className="text-sm text-ink-muted">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {currentLease ? (
                      <span className="text-sm">
                        {currentLease.tenants.map((t, i) => (
                          <span key={t.id}>
                            {i > 0 && ", "}
                            <Link
                              href={`/tenants/${t.id}`}
                              className="font-medium hover:underline"
                            >
                              {t.name}
                            </Link>
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {currentLease ? (
                      <span className="text-sm text-ink-muted">
                        {leaseTerm(currentLease)}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {currentLease ? (
                      <span className="text-sm tabular-nums">
                        {formatMoney(currentLease.rentAmount)}/mo
                      </span>
                    ) : (
                      <span className="text-sm text-ink-faint">—</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {currentLease ? (
                      currentLease.status === "active" && (
                        <EndLeaseButton
                          id={currentLease.id}
                          propertyId={propertyId}
                        />
                      )
                    ) : (
                      <Link
                        href={`/properties/${propertyId}/lease/new?unit=${unit.id}`}
                      >
                        <Button variant="contained" size="small" component="span">
                          Start lease
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ py: 0, border: 0 }} colSpan={COL_SPAN}>
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <LeaseHistory leases={leases} />
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Stack>
  );
}

function LeaseHistory({ leases }: { leases: LeaseWithUnitAndTenants[] }) {
  return (
    <div className="py-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Lease history
      </h3>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Status</TableCell>
            <TableCell>Term</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell align="right">Rent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leases.map((lease) => (
            <TableRow key={lease.id}>
              <TableCell>
                <LeaseStatusBadge status={lease.status} />
              </TableCell>
              <TableCell>
                <span className="text-sm text-ink-muted">
                  {leaseTerm(lease)}
                </span>
              </TableCell>
              <TableCell>
                {lease.tenants.length > 0 ? (
                  <span className="text-sm">
                    {lease.tenants.map((t, i) => (
                      <span key={t.id}>
                        {i > 0 && ", "}
                        <Link
                          href={`/tenants/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.name}
                        </Link>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-sm text-ink-faint">—</span>
                )}
              </TableCell>
              <TableCell align="right">
                <span className="text-sm tabular-nums">
                  {formatMoney(lease.rentAmount)}/mo
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Right-pointing chevron that rotates down when the row is expanded.
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className="size-4 text-ink-faint transition-transform"
      style={{ transform: open ? "rotate(90deg)" : "none" }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
