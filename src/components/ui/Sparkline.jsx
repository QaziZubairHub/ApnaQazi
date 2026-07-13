import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

const Sparkline = ({ data = [], color = "#5B3DF5", height = 40 }) => {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={["dataMin", "dataMax"]} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${color.replace("#", "")})`}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default Sparkline;
