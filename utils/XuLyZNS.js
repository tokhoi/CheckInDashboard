const { getChannel } = require('../config/rabbitmq_Config');
const { getThongtinTruongTheoMaTruong, getRole, updateTrangThaiUserId } = require('./ThongtinChung');
const { getListHSTheoMaKhoi, getListHSTheoMaLop, getListHSTheoMaTruong } = require('./ThongtinHS');
const { getZaloUserIdPH } = require('./ThongtinPH');
const { getGiaoVien, getZaloUserIdGV_V2 } = require('./ThongtinGV');

async function znsBatch(routingKey, buffer) {
  const batch = buffer[routingKey];
  if (!batch || batch.length === 0) return;

  const channel = getChannel();
  if (!channel) {
    console.error("Channel chưa sẵn sàng, không thể publish backup message!");
    return;
  }
  const truongCache = {};
  try {
    for (const msg of batch) {
      const { ma_truong_bo, ma_khoi, ma_lop, ma_user, message, nam_hoc, mode } = msg;
      let dsUserId = [];
      // --- lấy thông tin trường, có cache ---
      if (!truongCache[ma_truong_bo]) {
        const info = await getThongtinTruongTheoMaTruong(ma_truong_bo);
        // console.log("info", info);
        
        if (!info) {
          console.warn(`Không tìm thấy thông tin trường ${ma_truong_bo}`);
          continue;
        }
        truongCache[ma_truong_bo] = {
          ...info,
          dbname: info.hd_database, // đặt dbname riêng cho dễ lấy
        };
      }
      // Lấy ds người dùng cần gửi ZNS
      if (ma_khoi) 
      {
        const dsKhoiHocSinh = await getListHSTheoMaKhoi(truongCache[ma_truong_bo].dbname, ma_truong_bo, ma_khoi, nam_hoc);
        if (dsKhoiHocSinh && dsKhoiHocSinh.length > 0) {
          // lấy ra mã học sinh
          const dsHocSinhTrongKhoi = dsKhoiHocSinh.map(hs => hs.ma_hs_so);
          // lấy ra danh sách zalo user id trong zalo
          // console.log("dsHocSinhTrongKhoi", dsHocSinhTrongKhoi.length);
          dsUserId = await getZaloUserIdPH(ma_truong_bo, dsHocSinhTrongKhoi);
        }
        else {
          console.log("Không tìm thấy danh sách học sinh trong khối");
          continue;
        }
      }
      else if (ma_lop) {
        const dsLopHocSinh = await getListHSTheoMaLop(truongCache[ma_truong_bo].dbname, ma_truong_bo, ma_lop, nam_hoc);
        if (dsLopHocSinh && dsLopHocSinh.length > 0) {
          // lấy ra mã học sinh
          const dsHocSinhTrongLop = dsLopHocSinh.map(hs => hs.ma_hs_so);
          // lấy ra danh sách zalo user id trong zalo
          // console.log("dsHocSinhTrongLop", dsHocSinhTrongLop.length);
          dsUserId = await getZaloUserIdPH(ma_truong_bo, dsHocSinhTrongLop);
        }
        else {
          console.log("Không tìm thấy danh sách học sinh trong lớp");
          continue;
        }
      }
      else if (ma_user) {
        const role = await getRole(ma_user, ma_truong_bo);
        // console.log("role", role);
        
        if (role === 'GiaoVien' || role === 'Ketoan') {
          const thongtinGV = await getGiaoVien(truongCache[ma_truong_bo].dbname, ma_user, nam_hoc);       
          let so_dien_thoai = "";

          if (thongtinGV.length > 0) {
            so_dien_thoai = thongtinGV[0].so_dien_thoai;
          }
          
          if (so_dien_thoai !== "") {
            dsUserId = await getZaloUserIdGV_V2(ma_truong_bo, so_dien_thoai);
          }
        }
        else if (role === 'HocSinh') {
          // lấy ra danh sách zalo user id trong zalo
          dsUserId = await getZaloUserIdPH(ma_truong_bo, ma_user);
        }
        else {
          console.log("Role lạ: ", role);
        }
      }
      else {
        const dsToanBoHocSinh = await getListHSTheoMaTruong(truongCache[ma_truong_bo].dbname, ma_truong_bo, nam_hoc);
        if (dsToanBoHocSinh && dsToanBoHocSinh.length > 0) {
          // lấy ra mã học sinh
          const dsHocSinhToanTruong = dsToanBoHocSinh.map(hs => hs.ma_hs_so);
          // lấy ra danh sách zalo user id trong zalo
          // console.log("dsHocSinhToanTruong", dsHocSinhToanTruong.length);
          dsUserId = await getZaloUserIdPH(ma_truong_bo, dsHocSinhToanTruong);
        }
        else {
          console.log("Không tìm thấy danh sách học sinh trong trường");
          continue;
        }
      }
      // --- xử lý gửi ZNS ---
      if (dsUserId && dsUserId.length > 0) {
        const { listUserSendSuccessed, listUserSendFailed } = await GoiZNS(ma_truong_bo, message, mode, dsUserId);
       
        // --- xử lý cập nhật trạng thái gửi cho PH --- 
        if (listUserSendSuccessed.length > 0) {
          await updateTrangThaiUserId(ma_truong_bo, listUserSendSuccessed, 1);
        }
        if (listUserSendFailed.length > 0) {
          await updateTrangThaiUserId(ma_truong_bo, listUserSendFailed, 0);
        }
      }    
    }
    // Xoá batch sau khi xử lý xong
    delete buffer[routingKey];
    console.log(`Hoàn tất xử lý batch ${routingKey} (${batch.length} tin)`);
  } catch (err) {
    console.error(`Lỗi xử lý batch ${routingKey}:`, err.message);
  }
}

async function GoiZNS(ma_truong_bo, message, mode, dsUserId) {
  let listUserSendSuccessed = [];
  let listUserSendFailed = [];
  for (const userId of dsUserId) 
  {
    if (mode === 'ZNS') {
      const urlZNS = 'https://notify-services.titkul.edu.vn/api/sendmessageV2';
      const body = {
        matruongbo: ma_truong_bo,
        zalouserid: userId.user_id,
        message: message
      };
      
      try {
        const res = await fetch(urlZNS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.error === -216) {
          console.warn(`Token hết hạn cho user ${userId}, gửi lại...`);
          const retryRes = await fetch(urlZNS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const retryData = await retryRes.json();
          // gửi lại vẫn lỗi
          if (retryData.error !== 0) {
            listUserSendFailed.push(userId.user_id);
          } 
          // gửi lại nếu được
          else listUserSendSuccessed.push(userId.user_id);
        }
        // gửi được 
        else if (data.error === 0) 
          listUserSendSuccessed.push(userId.user_id);
        // trường hợp không gửi được cho PH
        else {
          listUserSendFailed.push(userId.user_id);
        }   
      } catch (err) {
        console.error(`Lỗi gửi ZNS cho ${userId}:`, err.message);
      }
    // chưa bổ sung cho FCM
    } else if (mode === 'FCM') {
      console.log(`FCM chưa triển khai cho ${userId}`);
    } else {
      console.warn(`Mode không hợp lệ: ${mode}`);
    }  
  }
  return { listUserSendSuccessed, listUserSendFailed };
}
module.exports = { znsBatch };