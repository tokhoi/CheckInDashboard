const { ConnPostgres } = require('../config/postgresql_Config');
const { getCauHinhDiemDanh } = require('./ThongtinChung');

async function getHocSinh(dbname, ma_hs_so) {  
    try {
        const pool = await ConnPostgres(dbname);
        const query = `SELECT hs.thongtin->>'hoten' AS hoten , hs.thongtin->>'tenlop' AS tenlop, gv.so_dien_thoai
                    FROM l_hocsinh AS hs
                    LEFT JOIN l_giaovien AS gv
                    ON gv.ma_lop = hs.lopid 
                    WHERE hs.ma_hs_so = $1 and hs.nam_hoc='2025-2026'
                    LIMIT 1`;
        
        const result = await pool.query(query, [ma_hs_so]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching l_hocsinh:", error);
        return [];
    }
}

async function checkHSDaDiemDanh(dbname, ma_truong_bo, ma_so, date, time) {  
  try {
      const pool = await ConnPostgres(dbname);
      const query = `SELECT 1 FROM d_diemdanh where ma_truong_bo = $1 and ma_hs_so = $2 and date = $3`;
      
      const result = await pool.query(query, [ma_truong_bo, ma_so, date]);
      return result.rows.length > 0 ? true : false;
  } catch (error) {
      console.error("Error fetching d_diemdanh:", error);
      return false;
  }
}

async function checkHSDaDiemDanh_V2(dbname, ma_truong_bo, ma_hs_so, date, time) {
  const thongtindd = await getCauHinhDiemDanh(ma_truong_bo);
  ({ tgbatdausang, tgvaosang } = thongtindd[0]);
  try { 
    const pool = await ConnPostgres(dbname);
    let query = `SELECT 1 FROM d_diemdanh WHERE ma_truong_bo = $1 AND ma_hs_so = $2 AND date = $3 AND thoigian >= $4 AND thoigian <= $5`;
    const params = [ma_truong_bo, ma_hs_so, date];
    if (time >= tgbatdausang && time <= tgvaosang) {
      params.push(tgbatdausang, tgketthucsang);
    } else if (time >= tgbatdauchieu) {
      params.push(tgbatdauchieu, tgketthucchieu);
    }
    const result = await pool.query(query, params);
    return result.rows.length > 0 ? true : false;
  } catch (error) {
    console.error("Error fetching d_diemdanh:", error);
    return false;
  }
}

async function getListHSTheoMaTruong(dbname, ma_truong_bo, nam_hoc) {
  try {
      const pool = await ConnPostgres(dbname);
      const query = `SELECT ma_hs_so, thongtin, id_trangthaihoctap, id_hinhthuchoctap 
                    FROM l_hocsinh 
                    WHERE ma_truong_bo = $1 
                    AND nam_hoc = $2 
                    AND trangthai = 1
                    AND id_trangthaihoctap in (1,2,3,6,7,10)`;
      
      const result = await pool.query(query, [ma_truong_bo, nam_hoc]);
      return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
      console.error("Error f:", error);
      return [];
  }
}

async function getListHSTheoMaKhoi(dbname, ma_truong_bo, ma_khoi, nam_hoc) {
  try {
      const pool = await ConnPostgres(dbname);
      const query = `SELECT ma_hs_so, thongtin, id_trangthaihoctap, id_hinhthuchoctap 
                    FROM l_hocsinh 
                    WHERE ma_truong_bo = $1 
                    AND ma_khoi = $2 
                    AND nam_hoc = $3 
                    AND trangthai = 1
                    AND id_trangthaihoctap in (1,2,3,6,7,10)`;
      
      const result = await pool.query(query, [ma_truong_bo, ma_khoi, nam_hoc]);
      return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
      console.error("Error f:", error);
      return [];
  }
}

async function getListHSTheoMaLop(dbname, ma_truong_bo, ma_lop, nam_hoc) {
  try {
      const pool = await ConnPostgres(dbname);
      const query = `SELECT ma_hs_so, thongtin, id_trangthaihoctap, id_hinhthuchoctap 
                    FROM l_hocsinh 
                    WHERE ma_truong_bo = $1 
                    AND lopid = $2 
                    AND nam_hoc = $3 
                    AND trangthai = 1
                    AND id_trangthaihoctap in (1,2,3,6,7,10)`;
      
      const result = await pool.query(query, [ma_truong_bo, ma_lop, nam_hoc]);
      return result.rows.length > 0 ? result.rows : [];
  } catch (error) {
      console.error("Error f:", error);
      return [];
  }
}

module.exports = { 
  getHocSinh, 
  checkHSDaDiemDanh, 
  checkHSDaDiemDanh_V2, 
  getListHSTheoMaKhoi,
  getListHSTheoMaLop,
  getListHSTheoMaTruong
};