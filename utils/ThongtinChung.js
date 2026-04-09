const { ConnPostgres } = require('../config/postgresql_Config');
const path = require("path");
const fs = require("fs");
const CauHinhTruongHoc = path.join(__dirname, "../config/CauHinhTruongHoc.json");
const { getThongTinPHBySDT } = require('./ThongtinPH');
const { getListHSTheoMaTruong } = require('./ThongtinHS');
const { getThongTinGVBySDT } = require('./ThongtinGV');

async function getThongtinTruongTheoDevice(deviceId) {
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `SELECT truong.hd_database, truong.ma_truong_bo, truong.tentruong,
                            cauhinhdd.tgbatdausang, cauhinhdd.tgvaosang,
                            cauhinhdd.tgketthucddsang, cauhinhdd.tgketthucsang,
                            cauhinhdd.tgbatdauchieu, cauhinhdd.tgvaochieu,
                            cauhinhdd.tgketthucddchieu, cauhinhdd.tgketthucchieu
                        FROM l_truong truong
                        JOIN l_cauhinhdiemdanh cauhinhdd
                        ON truong.ma_truong_bo = cauhinhdd.matruongbo
                        WHERE truong.device_name = $1`;
        
        const result = await poolIndex.query(query, [deviceId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

async function getThongtinTruongTheoMaTruong(ma_truong_bo) {
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `SELECT truong.hd_database, truong.ma_truong_bo, truong.tentruong,
                            cauhinhdd.tgbatdausang, cauhinhdd.tgvaosang,
                            cauhinhdd.tgketthucddsang, cauhinhdd.tgketthucsang,
                            cauhinhdd.tgbatdauchieu, cauhinhdd.tgvaochieu,
                            cauhinhdd.tgketthucddchieu, cauhinhdd.tgketthucchieu
                        FROM l_truong truong
                        JOIN l_cauhinhdiemdanh cauhinhdd
                        ON truong.ma_truong_bo = cauhinhdd.matruongbo
                        WHERE truong.ma_truong_bo = $1`;
        
        const result = await poolIndex.query(query, [ma_truong_bo]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

async function getRole(ma_user, ma_truong_bo) {
    try {
    const poolIndex = await ConnPostgres("hd_index");
    const query = `SELECT role FROM l_userlogin_role WHERE ma_user = $1 AND matruongbo = $2`;
    
    const result = await poolIndex.query(query, [ma_user, ma_truong_bo]);
    return result.rows.length > 0 ? result.rows[0].role : null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

async function getDeviceToken(ma_hs_so) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `SELECT device_token FROM l_userlogin_devicetoken 
                        where ma_hs_so = $1`;
        
        const result = await poolIndex.query(query, [ma_hs_so]);
        return result.rows.length > 0 ? result.rows[0].device_token : null;
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

async function getCauHinhDiemDanh(ma_truong_bo) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        //tgbatdausang, tgvaosang, tgketthucddsang
        //tgbatdauchieu as tgbatdausang, tgvaochieu as tgvaosang, tgketthucddchieu as tgketthucddsang
        const query = `SELECT tgbatdausang, tgvaosang, tgketthucddsang, tgketthucsang, 
                        tgbatdauchieu, tgvaochieu, tgketthucddchieu, tgketthucchieu 
                        FROM l_cauhinhdiemdanh WHERE matruongbo = $1`;

        const result = await poolIndex.query(query, [ma_truong_bo]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching role:", error);
        return [];
    }
}

async function getCauHinhNamHocHienTai(ma_truong_bo) {
    try {
        const ngayHienTai = new Date().toISOString().split("T")[0];
        const poolIndex = await ConnPostgres("hd_index");
        const query = `SELECT manamhoc FROM l_cauhinhnamhoc 
                    WHERE matruongbo = $1 AND $2 BETWEEN ngaybatdau AND ngayketthuc
                    LIMIT 1`;

        const result = await poolIndex.query(query, [ma_truong_bo, ngayHienTai]);
        return result.rows.length > 0 ? result.rows[0].manamhoc : null;
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

async function getCauHinhTruongHoc(ma_truong_bo) {
    try {
        const docFileConfig = JSON.parse(fs.readFileSync(CauHinhTruongHoc, "utf-8"));
        // Kiểm tra trường có tồn tại trong file config không
        const config = docFileConfig[ma_truong_bo];
        if (!config) {
        console.warn(`Không tìm thấy cấu hình cho mã trường: ${ma_truong_bo}`);
        return null;
        }
        // Trả về toàn bộ cấu hình của trường đó
        return config;
    } catch (err) {
        console.error("Lỗi đọc cấu hình trường học:", err.message);
        return null;
    }
}

async function getCauHinhMessage(role, hoten, tenlop, tentruong, trangthaidd, time, formattedDate) {
    // role giáo viên
    if (role === 'Giaovien'){
        return `Giáo viên ${hoten} ${tentruong} đã [Titkul FaceID] ${trangthaidd} vào lúc ${time} ngày ${formattedDate}`;
    }
    // role học sinh
    else if (role === 'HocSinh'){
        return `Học sinh ${hoten} lớp ${tenlop} ${tentruong} đã [Titkul FaceID] ${trangthaidd} vào lúc ${time} ngày ${formattedDate}`;
    }
    // role khác ngoài giáo viên, VD: ketoan,...
    else{
        return `Nhân viên ${hoten} ${tentruong} đã [Titkul FaceID] ${trangthaidd} vào lúc ${time} ngày ${formattedDate}`;
    }
}

async function updateTrangThaiUserId(ma_truong_bo, listUserId, trangthai) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `
            UPDATE l_minizaloaccount
            SET trangthai = $3
            WHERE ma_truong_bo = $1
                AND user_id = ANY($2)
        `;
        
        const result = await poolIndex.query(query, [ma_truong_bo, listUserId, trangthai]);
        return result.rowCount  > 0;
    } catch (error) {
        console.error("Error fetching zalo user id GV:", error);
        return false;
    }
}

async function getListUserPending(ma_truong_bo, nam_hoc) {  
    try {
        let listUser = [];

        const poolIndex = await ConnPostgres("hd_index");
        const query = `SELECT DISTINCT so_dien_thoai FROM l_minizaloaccount WHERE ma_truong_bo = $1 AND trangthai = 0`;
        
        const listMAZaloAccount = await poolIndex.query(query, [ma_truong_bo]);
        const listSDT = listMAZaloAccount.rows.map(r => r.so_dien_thoai);
        
        if (listSDT.length === 0) return [];
        const getThongtinTruong = await getThongtinTruongTheoMaTruong(ma_truong_bo);
        
        // lấy list hocsinh
        const listThongtinHS = await getListHSTheoMaTruong(getThongtinTruong.hd_database, ma_truong_bo, nam_hoc);
        // truyền vào lấy ra list phụ huynh
        const listThongtinPH = await getThongTinPHBySDT(ma_truong_bo, listSDT);
        
        const listPH = listThongtinPH.map(ph => {
            const hs = listThongtinHS.find(h => h.ma_hs_so === ph.ma_hocsinh_so);
            return {
                ten_phu_huynh: ph.hoten,
                quan_he: ph.quanhe,
                so_dien_thoai: ph.sodienthoai,
                ma_hs_so: ph.ma_hocsinh_so,
                ten_hoc_sinh: hs?.thongtin?.hoten || null
            };
        });

        // truyền vào lấy ra list giáo viên
        const listThongtinGV = await getThongTinGVBySDT(getThongtinTruong.hd_database, ma_truong_bo, nam_hoc, listSDT);
        let listGV = [];
        if (listThongtinGV.length > 0) {
            listGV = listThongtinGV.map(gv => ({
                ma_so: gv.ma_so,
                hoten: gv.ho_ten,
                sodienthoai: gv.so_dien_thoai
            }));
        }

        listUser.push({
          phuhuynh: listPH,
          giaovien: listGV
        });
        return listUser;
    } catch (error) {
        console.error("Error fetching zalo user id GV:", error);
        return [];
    }
}

//====export function===//
module.exports = { 
    getThongtinTruongTheoDevice, 
    getThongtinTruongTheoMaTruong,
    getRole, 
    getDeviceToken, 
    getCauHinhDiemDanh,
    getCauHinhTruongHoc,
    getCauHinhNamHocHienTai,
    getCauHinhMessage,
    updateTrangThaiUserId,
    getListUserPending
};