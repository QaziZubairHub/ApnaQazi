import { useMemo } from "react";
import { motion } from "framer-motion";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = ["12am", "3am", "6am", "9am", "12pm", "3pm", "6pm", "9pm"];

const OrderHeatmap = ({ data = {} }) => {
  const maxValue = useMemo(() => {
    return Math.max(...Object.values(data), 1);
  }, [data]);

  const getIntensity = (val) => {
    if (!val) return 0;
    return Math.min(val / maxValue, 1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1">
        <div className="w-10" />
        {hours.map((h) => (
          <div key={h} className="flex-1 text-center text-[10px] text-slate-400 font-medium">{h}</div>
        ))}
      </div>
      {days.map((day, dayIdx) => (
        <div key={day} className="flex items-center gap-1">
          <div className="w-10 text-xs text-slate-500 font-medium">{day}</div>
          {hours.map((_, hourIdx) => {
            const key = `W${dayIdx}-${hourIdx}`;
            const val = data[key] || 0;
            const intensity = getIntensity(val);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (dayIdx * hours.length + hourIdx) * 0.01 }}
                className={`flex-1 h-8 rounded-[4px] transition-colors cursor-default ${
                  intensity === 0
                    ? "bg-slate-100"
                    : intensity < 0.25
                    ? "bg-primary/20"
                    : intensity < 0.5
                    ? "bg-primary/40"
                    : intensity < 0.75
                    ? "bg-primary/60"
                    : "bg-primary"
                }`}
                title={`${day} ${hours[hourIdx]}: ${val} orders`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default OrderHeatmap;
