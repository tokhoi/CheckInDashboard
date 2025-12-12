import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AttendanceStats, COLORS, TabType } from "./types";
import "./Dashboard.css";

interface Props {
  data: AttendanceStats[];
  isMobile: boolean;
  activeTab: TabType;
}

const MainChart: React.FC<Props> = ({ data, isMobile, activeTab }) => {
  const chartData = data
    .filter((d) => !d.error)
    .map((d) => ({
      name:
        d.schoolName.length > 20
          ? d.schoolName.substring(0, 20) + "..."
          : d.schoolName,
      fullName: d.schoolName,
      "Đã điểm danh": d.daDiemDanh,
      "Chưa điểm danh": d.chuaDiemDanh,
    }));

  const dynamicHeight = isMobile ? Math.max(chartData.length * 60, 400) : 450;
  const currentColors = COLORS[activeTab];

  return (
    <div className="card">
      <h3 className="chart-header">
        Biểu đồ thống kê:{" "}
        {activeTab === "general"
          ? "Toàn ngày"
          : activeTab === "morning"
          ? "Sáng"
          : "Chiều"}
      </h3>
      <div
        className="chart-scroll-container"
        style={{
          height: `${dynamicHeight}px`,
          overflowY: isMobile ? "auto" : "hidden",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout={isMobile ? "vertical" : "horizontal"}
            margin={{
              top: 20,
              right: 30,
              left: isMobile ? 0 : 20,
              bottom: isMobile ? 0 : 60,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={!isMobile}
              vertical={isMobile}
            />
            {isMobile ? (
              <>
                {" "}
                <XAxis type="number" hide />{" "}
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />{" "}
              </>
            ) : (
              <>
                {" "}
                <XAxis
                  dataKey="name"
                  type="category"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  height={80}
                />{" "}
                <YAxis type="number" />{" "}
              </>
            )}
            <Tooltip
              cursor={{ fill: "#f0f0f0" }}
              labelFormatter={(val, p) =>
                p && p.length ? p[0].payload.fullName : val
              }
            />
            <Legend
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: "10px" }}
            />
            <Bar
              dataKey="Đã điểm danh"
              fill={currentColors.da}
              stackId="a"
              radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
            <Bar
              dataKey="Chưa điểm danh"
              fill={currentColors.chua}
              stackId="a"
              radius={isMobile ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MainChart;
