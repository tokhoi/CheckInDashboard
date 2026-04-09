import { AttendanceStats, DuLieuDiemDanh } from "./types";

const API_URL = import.meta.env.VITE_API_URL;
export const DuLieuDiemDanhList: DuLieuDiemDanh[] = [
  {
    id: "79000786",
    tenTruong: "THPT An Nghĩa - Cần Giờ",
    // url: MY_API_URL,
  },
  {
    id: "75000F12",
    tenTruong: "Chuyên Lương Thế Vinh",
    // url: MY_API_URL,
  },
  {
    id: "79767502",
    tenTruong: "THCS Lê Lợi - Tân Phú",
    // url: MY_API_URL,
  },
  {
    id: "77000705",
    tenTruong: "THPT Nguyễn Du - BRVT",
    // url: MY_API_URL,
  },
  {
    id: "79000763",
    tenTruong: "THPT Cần Thạnh - Cần Giờ",
    // url: MY_API_URL,
  },
  {
    id: "79000749",
    tenTruong: "THPT Hàn Thuyên - Phú Nhuận",
    // url: MY_API_URL,
  },
  {
    id: "79777513",
    tenTruong: "THCS Tân Tạo A",
    // url: MY_API_URL,
  },
  {
    id: "79778402",
    tenTruong: "Tiểu học Tân Hưng - Quận 7",
    // url: MY_API_URL,
  },
  {
    id: "79785206",
    tenTruong: "Mẫu giáo Hoa Phượng - Bình Chánh",
    // url: MY_API_URL,
  },
  {
    id: "79764422",
    tenTruong: "VASCHOOLS - Tân Bình",
    // url: MY_API_URL,
  },
  {
    id: "79785334",
    tenTruong: "Mầm non Hoa Phượng 1 - Bình Chánh",
    // url: MY_API_URL,
  },
  {
    id: "79785311",
    tenTruong: "Mầm non 30/4 - Bình Chánh",
    // url: MY_API_URL,
  },
  {
    id: "79000748",
    tenTruong: "THPT Nguyễn Trung Trực - Gò Vấp",
    // url: MY_API_URL,
  },
  {
    id: "79000762",
    tenTruong: "THPT Bình Khánh - Cần Giờ",
    // url: MY_API_URL,
  },
  {
    id: "TCD0211",
    tenTruong: "Trung Cấp Nghề Nhân Đạo - Quận 3",
    // url: MY_API_URL,
  },
  {
    id: "79777403",
    tenTruong: "Tiểu học An Lạc 3 - Bình Tân",
    // url: MY_API_URL,
  },
  {
    id: "79785515",
    tenTruong: "THCS Vĩnh Lộc A - Bình Chánh",
    // url: MY_API_URL,
  },
  {
    id: "79777308",
    tenTruong: "Mầm non Hoàng Anh",
    // url: MY_API_URL,
  },
  {
    id: "79776511",
    tenTruong: "THCS Lý Thánh Tông - Quận 8",
    // url: MY_API_URL,
  },
  {
    id: "79776408",
    tenTruong: "Tiểu học Bùi Minh Trực - Quận 8",
    // url: MY_API_URL,
  },
  {
    id: "79776301",
    tenTruong: "Trường Mầm Non Việt Nhi",
    // url: MY_API_URL,
  },
  {
    id: "79777406",
    tenTruong: "Tiểu học Bình Trị 1 - Bình Tân",
    // url: MY_API_URL,
  },
  {
    id: "7900004004",
    tenTruong: "Trung cấp nghề Bình Thạnh",
    // url: MY_API_URL,
  },
  {
    id: "IchiSkill",
    tenTruong: "ICHI SKILL - Tân Bình",
    // url: MY_API_URL,
  },
  {
    id: "79764338",
    tenTruong: "Lớp Mầm non Ngôi Nhà Trẻ Thơ",
    // url: MY_API_URL,
  },
];

export async function fetchSchoolData(
  school: DuLieuDiemDanh,
  selectedDate: string // YYYY-MM-DD
): Promise<AttendanceStats> {
  const formattedDate = formatDate(selectedDate);

  const res = await fetch(`${API_URL}/api/diemdanh/get-so-luong-by-ngay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matruongbo: school.id,
      ngay: formattedDate, // DD/MM/YYYY
    }),
  });

  const json = await res.json();

  if (!json.success || !json.stringdata) {
    return {
      schoolId: school.id,
      schoolName: school.tenTruong,
      tongSo: 0,
      daDiemDanh: 0,
      chuaDiemDanh: 0,
      raw: {
        soluonghocsinhcomat: 0,
        soluonghocsinhvangmat: 0,
        comatsang: 0,
        comatchieu: 0,
        tongsiso: 0,
        tongsisosang: 0,
        tongsisochieu: 0,
        gv_comat: 0,
        gv_vang: 0,
        gv_tong: 0,
      },
    };
  }

  const d = json.stringdata;

  return {
    schoolId: school.id,
    schoolName: school.tenTruong,
    tongSo: d.tongsiso,
    daDiemDanh: d.soluonghocsinhcomat,
    chuaDiemDanh: d.soluonghocsinhvangmat,
    raw: d,
  };
}

function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
