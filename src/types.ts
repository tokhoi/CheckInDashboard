export interface AttendanceStats {
  schoolId: string;
  schoolName: string;
  tongSo: number;
  daDiemDanh: number;
  chuaDiemDanh: number;

  raw: {
    coMatTong: number;
    vangMatTong: number;
    coMatSang: number;
    coMatChieu: number;
    tongSiSo: number;
    tongSiSoSang: number;
    tongSiSoChieu: number;

    gvCoMat: number;
    gvTong: number;
    gvVang: number;
  };

  loading: boolean;
  error: boolean;
}
export interface DuLieuDiemDanh {
  id: string;
  tenTruong: string;
  url: string;
}

export type TabType = "general" | "morning" | "afternoon" | "teachers";
export const COLORS = {
  general: { da: "#0081a7", chua: "#fed9b7" },
  morning: { da: "#0081a7", chua: "#fed9b7" },
  afternoon: { da: "#0081a7", chua: "#fed9b7" },
  teachers: { da: "#8884d8", chua: "#ff7300" },
};
