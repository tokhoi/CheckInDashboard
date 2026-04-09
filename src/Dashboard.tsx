import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { AttendanceStats, TabType } from "./types";
import { DuLieuDiemDanhList, fetchSchoolData } from "./DuLieuDiemDanh";
import MainChart from "./MainChart";
import SchoolCard from "./SchoolCard";

const Dashboard: React.FC = () => {
  const [data, setData] = useState<AttendanceStats[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });

  useEffect(() => {
    async function load() {
      const res = await Promise.all(
        DuLieuDiemDanhList.map((s) =>
          fetchSchoolData(s, formatDate(selectedDate))
        )
      );
      setData(res);
    }
    load();
  }, [selectedDate]);

  const displayData = data.map((d) => mapByTab(d, activeTab));

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="card header-row">
        <h2 className="dashboard-title">Dashboard Điểm Danh</h2>

        <div className="controls-group">
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* TABS */}
        <div className="tab-container mb-4">
          {["general", "morning", "afternoon", "teachers"].map((t) => (
            <button
              key={t}
              className={`tab-btn ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t as TabType)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div className="card">
        <div className="chart-scroll-container">
          <MainChart
            data={displayData}
            isMobile={false}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* GRID */}
      <h3 className="section-title">Chi tiết theo trường</h3>
      <div className="grid-container">
        {displayData.map((item) => (
          <SchoolCard key={item.schoolId} item={item} activeTab={activeTab} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

/* ================== HELPERS ================== */

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function mapByTab(item: AttendanceStats, tab: TabType): AttendanceStats {
  if (tab === "general") return item;

  if (tab === "morning") {
    return {
      ...item,
      tongSo: item.raw.tongSiSoSang,
      daDiemDanh: item.raw.coMatSang,
      chuaDiemDanh: Math.max(item.raw.tongSiSoSang - item.raw.coMatSang, 0),
    };
  }

  if (tab === "afternoon") {
    return {
      ...item,
      tongSo: item.raw.tongSiSoChieu,
      daDiemDanh: item.raw.coMatChieu,
      chuaDiemDanh: Math.max(item.raw.tongSiSoChieu - item.raw.coMatChieu, 0),
    };
  }

  return {
    ...item,
    tongSo: item.raw.gvTong,
    daDiemDanh: item.raw.gvCoMat,
    chuaDiemDanh: item.raw.gvVang,
  };
}
