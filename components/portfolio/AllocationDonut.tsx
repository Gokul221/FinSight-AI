"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Holding } from "@/lib/mockData";
import { computeSectorAllocation } from "@/lib/portfolio";

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: payload[0].payload.color }}
          />
          <span className="text-slate-300">{payload[0].name}</span>
          <span className="font-bold font-num text-white ml-1">
            {payload[0].value}%
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AllocationDonut({ holdings }: { holdings: Holding[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const allocationData = computeSectorAllocation(holdings);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Sector Allocation
        </h3>
        <span className="text-[10px] text-slate-500">Click to highlight</span>
      </div>

      {allocationData.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">
          Add a holding to see your sector breakdown.
        </p>
      ) : (
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                onClick={(_, index) =>
                  setActiveIndex(activeIndex === index ? null : index)
                }
                style={{ cursor: "pointer" }}
              >
                {allocationData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.3
                    }
                    stroke={activeIndex === index ? "#fff" : "transparent"}
                    strokeWidth={activeIndex === index ? 1.5 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {allocationData.map((item, index) => (
            <button
              key={item.name}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              className={`flex items-center gap-2 text-left transition-opacity ${
                activeIndex !== null && activeIndex !== index
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-xs text-slate-300">{item.name}</span>
              <span className="text-xs font-num text-slate-400 ml-auto">
                {item.value}%
              </span>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
