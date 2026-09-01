"use client";

import type { CSSProperties } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MESECI_SR, formatBroj } from "@/lib/format";

const skratiMesec = (mesec: string) => {
  const m = Number(mesec.split("-")[1]);
  return MESECI_SR[m - 1].slice(0, 3);
};

const TOOLTIP_STIL = {
  background: "#0b1120",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: "0.75rem",
  color: "#f1f5f9",
  fontSize: "12px",
  boxShadow: "0 10px 30px -8px rgba(0,0,0,0.4)",
  padding: "8px 12px",
} as const;

const AXIS_STIL: CSSProperties = {
  fontSize: 12,
  fill: "#94a3b8",
  fontFamily: "inherit",
};

export function GrafikonMeseci({
  podaci,
}: {
  podaci: Array<{ mesec: string; prihod: number; rashod: number }>;
}) {
  const data = podaci.map((p) => ({
    naziv: skratiMesec(p.mesec),
    Prihod: p.prihod / 100,
    Rashod: p.rashod / 100,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barGap={4}>
          <XAxis dataKey="naziv" tickLine={false} axisLine={false} style={AXIS_STIL} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={70}
            tick={{ fill: "#94a3b8" }}
            tickFormatter={(v: number) => formatBroj(Math.round(v * 100))}
          />
          <Tooltip
            formatter={(value) => `${formatBroj(Number(value) * 100)} RSD`}
            cursor={{ fill: "rgba(99,102,241,0.06)" }}
            contentStyle={TOOLTIP_STIL}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontWeight: 500 }} />
          <Bar dataKey="Prihod" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rashod" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrafikonKategorija({
  podaci,
}: {
  podaci: Array<{ naziv: string; boja: string; iznosPara: number }>;
}) {
  if (podaci.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Nema rashoda ovog meseca.</p>;
  }
  const data = podaci.map((p) => ({ naziv: p.naziv, vrednost: p.iznosPara / 100 }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="vrednost"
            nameKey="naziv"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            stroke="none"
          >
            {podaci.map((p) => (
              <Cell key={p.naziv} fill={p.boja} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${formatBroj(Number(value) * 100)} RSD`, name]}
            contentStyle={TOOLTIP_STIL}
            itemStyle={{ color: "#f1f5f9" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
