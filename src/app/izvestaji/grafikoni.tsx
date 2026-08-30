"use client";

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
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="naziv" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={70}
            tickFormatter={(v: number) => formatBroj(Math.round(v * 100))}
          />
          <Tooltip
            formatter={(value) => `${formatBroj(Number(value) * 100)} RSD`}
            cursor={{ fill: "rgba(15,23,42,0.04)" }}
          />
          <Legend />
          <Bar dataKey="Prihod" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rashod" fill="#ef4444" radius={[4, 4, 0, 0]} />
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
    return <p className="py-10 text-center text-sm text-slate-400">Nema rashoda ovog meseca.</p>;
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
            innerRadius="50%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {podaci.map((p) => (
              <Cell key={p.naziv} fill={p.boja} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => `${formatBroj(Number(value) * 100)} RSD — ${name}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
