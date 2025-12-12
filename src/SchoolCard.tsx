import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AttendanceStats, COLORS, TabType } from "./types";
import "./Dashboard.css";

interface Props {
  item: AttendanceStats;
  activeTab: TabType;
}

const SchoolCard: React.FC<Props> = ({ item, activeTab }) => {
  const currentColors = COLORS[activeTab];
  const percentNum =
    item.tongSo > 0 ? (item.daDiemDanh / item.tongSo) * 100 : 0;
  const percentText = item.tongSo > 0 ? percentNum.toFixed(2) : "0.00";

  let badgeClass = "badge-low";
  if (percentNum >= 90) badgeClass = "badge-high";
  else if (percentNum >= 50) badgeClass = "badge-medium";

  return (
    <div
      className="card school-card"
      style={{ borderTopColor: currentColors.da }}
    >
      <div className="school-card-header">
        <h4 className="school-name">{item.schoolName}</h4>
        {!item.error && (
          <span className={`badge ${badgeClass}`}>{percentText}%</span>
        )}
      </div>

      {item.error ? (
        <div className="error-message">⚠️ Mất kết nối</div>
      ) : (
        <div className="stats-container">
          <div style={{ width: "80px", height: "80px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={[
                    { value: item.daDiemDanh },
                    { value: item.chuaDiemDanh },
                  ]}
                  innerRadius={20}
                  outerRadius={35}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={currentColors.da} />{" "}
                  <Cell fill={currentColors.chua} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stats-info">
            <div className="mb-4 text-gray">
              Sĩ số: <strong>{item.tongSo}</strong>
            </div>
            <div className="stat-row">
              <span style={{ color: currentColors.da }}>Có mặt:</span>{" "}
              <strong>{item.daDiemDanh}</strong>
            </div>
            <div className="stat-row">
              <span style={{ color: currentColors.chua }}>Vắng:</span>{" "}
              <strong>{item.chuaDiemDanh}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolCard;
