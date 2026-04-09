const { ConnPostgres } = require('../config/postgresql_Config');

async function getZaloUserIdPH(ma_truong_bo, ma_hs_so) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `
            SELECT DISTINCT mz.user_id
            FROM l_minizaloaccount mz
            WHERE mz.ma_truong_bo = $1
                AND mz.so_dien_thoai IN (
                SELECT ph.sodienthoai
                FROM l_phuhuynh ph
                WHERE ph.ma_hocsinh_so = ANY($2)
                )
        `;
        const maHSArray = Array.isArray(ma_hs_so) ? ma_hs_so : [ma_hs_so];
        
        const result = await poolIndex.query(query, [ma_truong_bo, maHSArray]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching zalo user id GV:", error);
        return [];
    }
}

async function getThongTinPHBySDT(ma_truong_bo, listSDT) {  
    try {
        const poolIndex = await ConnPostgres("hd_index");
        const query = `
            SELECT sodienthoai, thongtin->>'hoten' as hoten, thongtin->>'quanhe' as quanhe, ma_hocsinh_so
            FROM l_phuhuynh
            WHERE ma_truong_bo = $1
                AND sodienthoai = ANY($2)
        `;
        const SDTArray = Array.isArray(listSDT) ? listSDT : [listSDT];
        console.log(SDTArray);
        
        const result = await poolIndex.query(query, [ma_truong_bo, SDTArray]);
        return result.rows.length > 0 ? result.rows : [];
    } catch (error) {
        console.error("Error fetching thong tin PH theo so dien thoai:", error);
        return [];
    }
}

module.exports = { getZaloUserIdPH, getThongTinPHBySDT };