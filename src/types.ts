export type TabType = "general" | "morning" | "afternoon" | "teachers";

export interface AttendanceRaw {
  soluonghocsinhcomat: number;
  soluonghocsinhvangmat: number;
  comatsang: number;
  comatchieu: number;
  tongsiso: number;
  tongsisosang: number;
  tongsisochieu: number;
  gv_comat: number;
  gv_vang: number;
  gv_tong: number;
}

export interface AttendanceStats {
  schoolId: string;
  schoolName: string;
  tongSo: number;
  daDiemDanh: number;
  chuaDiemDanh: number;
  raw: AttendanceRaw;
}

export interface DuLieuDiemDanh {
  id: string;
  tenTruong: string;
}

export const COLORS = {
  general: { da: "#0081a7", chua: "#fed9b7" },
  morning: { da: "#0081a7", chua: "#fed9b7" },
  afternoon: { da: "#0081a7", chua: "#fed9b7" },
  teachers: { da: "#8884d8", chua: "#ff7300" },
};
