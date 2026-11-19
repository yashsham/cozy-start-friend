import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts";
import { useAppStore } from "@/hooks/use-store";
const COLORS = ["var(--color-primary)", "var(--color-info)", "var(--color-success)", "var(--color-warning)", "var(--color-muted-foreground)"];
export function PipelineChart() {
  const prospects = useAppStore(s => s.prospects);
  const items = [
    { name: "Qualified", value: prospects.filter(p => p.status === "qualified").length },
    { name: "Researched", value: prospects.filter(p => p.status === "researched").length },
    { name: "Unresearched", value: prospects.filter(p => p.status === "unresearched").length },
    { name: "Rejected", value: prospects.filter(p => p.status === "rejected").length },
  ].filter(x => x.value > 0);
  if (!items.length) return <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">No pipeline records yet.</div>;
  return <div className="grid grid-cols-[150px_1fr] items-center gap-3 sm:grid-cols-[180px_1fr]"><ResponsiveContainer width="100%" height={175}><PieChart><Pie data={items} dataKey="value" cx="50%" cy="50%" innerRadius={49} outerRadius={69} paddingAngle={3} strokeWidth={0}>{items.map((x, i) => <Cell key={x.name} fill={COLORS[i % COLORS.length]}/>)}</Pie><ChartTooltip formatter={(v: number, n: string) => [`${v} prospects`, n]} contentStyle={{ borderRadius: 4, border: "1px solid var(--color-border)", background: "var(--color-popover)", color: "var(--color-popover-foreground)", fontSize: 11 }}/></PieChart></ResponsiveContainer><div className="space-y-3">{items.map((x, i) => <div key={x.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}/><span className="flex-1 text-muted-foreground">{x.name}</span><span className="font-mono font-semibold tabular">{x.value}</span></div>)}</div></div>;
}
