import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DuLieuDiemDanhList, DuLieuDiemDanh } from "./DuLieuDiemDanh";
import { AttendanceStats, TabType } from "./types";
import MainChart from "./MainChart";
import SchoolCard from "./SchoolCard";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  // ==================== QUẢN LÝ TRẠNG THÁI ====================
  const [isMobile, setIsMobile] = useState(window.innerWidth < 780);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
  });
  const [data, setData] = useState<AttendanceStats[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ==================== HIỆU ỨNG ====================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 780);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ==================== LẤY DỮ LIỆU ====================
  const fetchSchoolData = async (
    school: DuLieuDiemDanh,
    dateISO: string
  ): Promise<AttendanceStats> => {
    try {
      const [year, month, day] = dateISO.split("-");
      const formattedDate = `${day}/${month}/${year}`;
      const response = await axios.post(school.url, {
        matruongbo: school.id,
        ngay: formattedDate,
      });
      const result = response.data;
      if (!result.success || !result.stringdata) throw new Error("No data");
      const inner = result.stringdata;

      const tongSiSo = inner.tongsiso || inner.TongSiSo || 0;
      const coMatTong = inner.soluonghocsinhcomat || 0;
      const coMatSang = inner.comatsang || 0;
      const coMatChieu = inner.comatchieu || 0;
      const vangMatTong = inner.soluonghocsinhvangmat || 0;
      const tongSiSoSang = inner.tongsisosang || inner.TongSiSoSang || tongSiSo;
      const tongSiSoChieu =
        inner.tongsisochieu || inner.TongSiSoChieu || tongSiSo;

      return {
        schoolId: school.id,
        schoolName: school.tenTruong,
        tongSo: tongSiSo,
        daDiemDanh: coMatTong,
        chuaDiemDanh: vangMatTong,
        raw: {
          coMatTong,
          vangMatTong,
          coMatSang,
          coMatChieu,
          tongSiSo,
          tongSiSoSang,
          tongSiSoChieu,
        },
        loading: false,
        error: false,
      };
    } catch (err) {
      return {
        schoolId: school.id,
        schoolName: school.tenTruong,
        tongSo: 0,
        daDiemDanh: 0,
        chuaDiemDanh: 0,
        raw: {
          coMatTong: 0,
          vangMatTong: 0,
          coMatSang: 0,
          coMatChieu: 0,
          tongSiSo: 0,
          tongSiSoSang: 0,
          tongSiSoChieu: 0,
        },
        loading: false,
        error: true,
      };
    }
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    const promises = DuLieuDiemDanhList.map((s) =>
      fetchSchoolData(s, selectedDate)
    );
    const results = await Promise.all(promises);
    const sorted = results.sort((a, b) => {
      const rateA = a.raw.tongSiSo > 0 ? a.raw.coMatTong / a.raw.tongSiSo : 0;
      const rateB = b.raw.tongSiSo > 0 ? b.raw.coMatTong / b.raw.tongSiSo : 0;
      return rateB - rateA;
    });
    setData(sorted);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [selectedDate]);

  // ==================== XỬ LÝ DỮ LIỆU ====================
  const displayData = data.map((item) => {
    let da = 0;
    let tong = 0;
    if (activeTab === "general") {
      da = item.raw.coMatTong;
      tong = item.raw.tongSiSo;
    } else if (activeTab === "morning") {
      da = item.raw.coMatSang;
      tong = item.raw.tongSiSoSang;
    } else {
      da = item.raw.coMatChieu;
      tong = item.raw.tongSiSoChieu;
    }
    const chua = Math.max(0, tong - da);
    return {
      ...item,
      daDiemDanh: da,
      chuaDiemDanh: chua,
      tongSo: tong,
    };
  });

  // ==================== CHỨC NĂNG XUẤT ====================
  const handleExportExcel = () => {
    const excelData = displayData.map((item, index) => ({
      STT: index + 1,
      "Mã Trường": item.schoolId,
      "Tên Trường": item.schoolName,
      "Sĩ Số (Theo buổi)": item.tongSo,
      "Đã Điểm Danh": item.daDiemDanh,
      Vắng: item.chuaDiemDanh,
      "Tỷ lệ":
        item.tongSo > 0
          ? ((item.daDiemDanh / item.tongSo) * 100).toFixed(2) + "%"
          : "0%",
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const wscols = [
      { wch: 5 },
      { wch: 15 },
      { wch: 40 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
    ];
    worksheet["!cols"] = wscols;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BaoCao");
    XLSX.writeFile(workbook, `BaoCao_${activeTab}_${selectedDate}.xlsx`);
  };

  // ==================== HIỂN THỊ ====================
  return (
    <div className="dashboard-container">
      {/* TIÊU ĐỀ VÀ ĐIỀU KHIỂN */}
      <div className="card">
        <div className="header-row">
          <h1 className="dashboard-title">DASHBOARD ĐIỂM DANH</h1>
          <div className="controls-group">
            <input
              type="date"
              className="date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={loadAllData}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Đang tải..." : "Tải lại"}
            </button>
            <button className="btn btn-success" onClick={handleExportExcel}>
              📊 Xuất Excel
            </button>
          </div>
        </div>

        {/* ĐIỀU HƯỚNG TAB */}
        <div className="tab-container">
          {[
            { id: "general", label: "Tổng quan (Ngày)" },
            { id: "morning", label: "Buổi Sáng" },
            { id: "afternoon", label: "Buổi Chiều" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* PHẦN BIỂU ĐỒ */}
      <MainChart data={displayData} isMobile={isMobile} activeTab={activeTab} />

      {/* PHẦN CHI TIẾT */}
      <h3 className="section-title">Chi Tiết ({data.length})</h3>
      <div className="grid-container">
        {displayData.map((item) => (
          <SchoolCard key={item.schoolId} item={item} activeTab={activeTab} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
