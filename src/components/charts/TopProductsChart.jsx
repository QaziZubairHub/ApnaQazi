import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#5B3DF5", "#7C4DFF", "#06B6D4", "#10B981", "#F59E0B"];

const TopProductsChart = ({ data = [], height = 280 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fill: "#475569", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            padding: "10px 14px",
          }}
          formatter={(value) => [value, "Sales"]}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopProductsChart;
