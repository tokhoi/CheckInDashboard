const { ConnPostgres } = require('../config/postgresql_Config');
const { getCauHinhDiemDanh } = require('./ThongtinChung');

async function getGiaoVien(dbname, ma_so, nam_hoc) {  
    try {
        const pool = await ConnPostgres(dbname);
        const query = `SELECT ho_ten AS hoten , ma_lop AS tenlop, so_dien_thoai as so_dien_thoai
                    FROM l_giaovien where ma_so = $1 and nam_hoc = $2`;
        
        const result = await pool.query(query, [ma_so, nam_hoc]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching role:", error);
        return [];
    }
}

async function checkGVDaDiemDanh(dbname, ma_truong_bo, ma_hs_so, date) {  
    try {
        const pool = await ConnPostgres(dbname);
        const query = `SELECT 1 FROM d_diemdanh_giaovien where ma_truong_bo = $1 and ma_so = $2 and date = $3`;
        
        const result = await pool.query(query, [ma_truong_bo, ma_hs_so, date]);
        return result.rows.length > 0 ? true : false;
    } catch (error) {
        console.error("Error fetching role:", error);
        return false;
    }
}

async function checkGVDaDiemDanh_V2(dbname, ma_truong_bo, ma_so, date, time) {
  const thongtindd = await getCauHinhDiemDanh(ma_truong_bo);
  ({ tgbatdausang, tgketthucsang, tgbatdauchieu, tgketthucchieu } = thongtindd[0]);
  try {
    const pool = await ConnPostgres(dbname);
    let query = `SELECT 1 FROM d_diemdanh_giaovien WHERE ma_truong_bo = $1 AND ma_so = $2 AND date = $3`;
    const params = [ma_truong_bo, ma_so, date];
    if (time >= tgbatdausang && time <= tgketthucsang) {
      query += ` AND thoigian >= $4 AND thoigian <= $5`;
      params.push(tgbatdausang, tgketthucsang);
    } else if (time >= tgbatdauchieu && time <= tgketthucchieu) {
      query += ` AND thoigian >= $4 AND thoigian <= $5`;
      params.push(tgbatdauchieu, tgketthucchieu);
    } else {
      return true; 
    }
    const result = await pool.query(query, params);
    return result.rows.length > 0 ? true : false;
  } catch (error) {
    console.error("Error fetching role:", error);
    return false;
  }
}

async function getZaloUserIdGV(ma_truong_bo, ma_so) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `
            SELECT DISTINCT user_id 
            FROM l_minizaloaccount 
            WHERE ma_truong_bo = $1 AND so_dien_thoai = $2
        `;
        const result = await poolIndex.query(query, [ma_truong_bo, ma_so]);
        return result.rows.length > 0 ? result.rows.map(row => row.user_id) : [];
    } catch (error) {
        console.error("Error fetching zalo user id GV:", error);
        return [];
    }
}

async function getZaloUserIdGV_V2(ma_truong_bo, so_dien_thoai) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `
            SELECT DISTINCT user_id 
            FROM l_minizaloaccount 
            WHERE ma_truong_bo = $1 AND so_dien_thoai = $2
        `;
        const result = await poolIndex.query(query, [ma_truong_bo, so_dien_thoai]);
        return result.rows.length > 0 ? result.rows.map(row => row.user_id) : [];
    } catch (error) {
        console.error("Error fetching zalo user id GV:", error);
        return [];
    }
}

async function getThongTinGVBySDT(hd_database, ma_truong_bo, nam_hoc, listSDT) {  
    try {
        const pool = await ConnPostgres(hd_database);
        const query = `
            SELECT ma_so, ho_ten, ma_lop AS tenlop, so_dien_thoai
            FROM l_giaovien
            WHERE nam_hoc = $1
                AND so_dien_thoai = ANY($2)
        `;
        const SDTArray = Array.isArray(listSDT) ? listSDT : [listSDT];
        
        const result = await pool.query(query, [nam_hoc, SDTArray]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching thong tin PH theo so dien thoai:", error);
        return [];
    }
}
module.exports = { 
    getGiaoVien, 
    checkGVDaDiemDanh, 
    checkGVDaDiemDanh_V2, 
    getZaloUserIdGV, 
    getZaloUserIdGV_V2,
    getThongTinGVBySDT
};