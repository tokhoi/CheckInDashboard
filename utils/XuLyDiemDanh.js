const { ConnPostgres } = require('../config/postgresql_Config');
const { getChannel, BACKUP_EXCHANGE, PublishDataNotify } = require('../config/rabbitmq_Config');
const { getThongtinTruongTheoDevice, getCauHinhTruongHoc, getCauHinhNamHocHienTai, getCauHinhMessage } = require('./ThongtinChung');

// Lưu thông tin cấu hình của trường học vào cache tránh dùng lại
const truongCache = new Map();

async function diemdanhBatch(routingKey, buffer) {
  const batch = buffer[routingKey];
  if (!batch || batch.length === 0) return;

  const dataToInsert = [...batch];
  buffer[routingKey] = [];

  //console.log(`Bulk insert ${dataToInsert.length} record(s) for ${routingKey}`);

  const channel = getChannel();
  if (!channel) {
    console.error("Channel chưa sẵn sàng, không thể publish backup message!");
    return;
  }
  try {
    const { isSuccess, invalidRecords } = await xulyDiemDanh(dataToInsert, routingKey);    
    if (invalidRecords?.length) {
      channel.publish(
        BACKUP_EXCHANGE,
        "error.invalid",
        Buffer.from(JSON.stringify({ routingKey, data: invalidRecords })),
        { persistent: true }
      );
      console.log(`Backup ${invalidRecords.length} record(s) lỗi từ ${routingKey}`);
    }
    
    //console.log(`Insert hoàn tất ${routingKey}`);
    delete buffer[routingKey];
  } 
  catch (err) {
    console.error(`Insert thất bại ${routingKey}:`, err.message);

    channel.publish(
      BACKUP_EXCHANGE,
      "error.insert",
      Buffer.from(
        JSON.stringify({
          routingKey,
          data: dataToInsert,
        })
      ),
      { persistent: true }
    );
    //console.log(`Đẩy vào backup queue: ${dataToInsert.length} record(s)`);
  }
}

async function xulyDiemDanh(records, routingKey) {
  const invalidRecords = [];
  let notifyQueue = [];
  try {
    const groupedByDevice = records.reduce((acc, r) => {
      if (!acc[r.deviceId]) acc[r.deviceId] = [];
      acc[r.deviceId].push(r);
      return acc;
    }, {});

    const poolIndex = await ConnPostgres("hd_index");

    for (const [deviceId, groupRecords] of Object.entries(groupedByDevice)) {
    
      const dbInfo = await getThongtinTruongTheoDevice(deviceId);
      
      // không tìm thấy thông tin trường
      if (!dbInfo) {
        console.warn(`Không tìm thấy thông tin trường cho deviceId: ${deviceId}`);
        invalidRecords.push(...groupRecords);
        continue;
      }

      // lấy info cấu hình trường nếu như trong cache chưa có và lưu vào cache
      if (!truongCache.has(dbInfo.ma_truong_bo)) {
        const [cauhinhTruong, cauhinhNamHoc] = await Promise.all([
          getCauHinhTruongHoc(dbInfo.ma_truong_bo),
          getCauHinhNamHocHienTai(dbInfo.ma_truong_bo)
        ]);

        if (!cauhinhTruong) {
          console.warn(`Không tìm thấy cấu hình trường: ${dbInfo.ma_truong_bo}`);
          invalidRecords.push(...groupRecords);
          continue;
        }

        truongCache.set(dbInfo.ma_truong_bo, {
          dbInfo,
          cauhinhTruong,
          cauhinhNamHoc,
          lastFetch: Date.now()
        });
      }

      // lấy thông tin cấu hình trường trong cache
      const { cauhinhTruong, cauhinhNamHoc } = truongCache.get(dbInfo.ma_truong_bo);

      const poolTruong = await ConnPostgres(dbInfo.hd_database);

      // Lấy roles
      const allUserIds = groupRecords.map((r) => r.userId);
      const rolesRes = await poolIndex.query(
        `SELECT ma_user, role FROM l_userlogin_role WHERE ma_user = ANY($1)`,
        [allUserIds]
      );
      
      // map role
      const roleMap = rolesRes.rows.reduce((acc, row) => {
        acc[row.ma_user] = row.role;
        return acc;
      }, {});

      // phân loại hợp lệ / lỗi
      const { listGV, listHS, listHSBanTru } = groupRecords.reduce(
        (acc, r) => {
          const role = roleMap[r.userId];
          const mode = r.mode || "diemdanh";

          if (!role) {
            invalidRecords.push(r);
            return acc;
          }

          if (role === "GiaoVien" || role === "Ketoan" && mode !== "bantru") acc.listGV.push(r);
          else if (role === "HocSinh" && mode === "bantru") acc.listHSBanTru.push(r);
          else if (role === "HocSinh") acc.listHS.push(r);
          else invalidRecords.push(r);

          return acc;
        },
        { listGV: [], listHS: [], listHSBanTru: [] }
      );

      const checkDiemDanhTheoBuoi = cauhinhTruong && cauhinhTruong?.QuyTacDiemDanh?.isDiemDanhTheoBuoi === 1; 
      // Insert
      await insertDiemDanh(poolTruong, dbInfo, { listGV, listHS, listHSBanTru }, checkDiemDanhTheoBuoi);
      //console.log("deviceId", deviceId);
      
      // check mã trường gửi thông báo hay không
      const checkGuiThongBao = cauhinhTruong && cauhinhTruong?.QuyTacGuiThongBao?.isGuiThongBaoDiemDanh === 1;

      const notifyRecords = checkGuiThongBao
          ? await guiThongBaoDiemDanh(cauhinhTruong, cauhinhNamHoc, groupRecords, dbInfo)
          : [];

      if (notifyRecords.length > 0) {
        notifyQueue.push(...notifyRecords);
        console.log("notifyQueue", notifyQueue);
        // Gửi tất cả notify song song
        await Promise.all(notifyQueue.map(rec => PublishDataNotify(rec)));
      }   
      // const notifyRecords = await guiThongBaoDiemDanh(cauhinhTruong, cauhinhNamHoc, groupRecords, dbInfo);
      // notifyQueue.push(...notifyRecords);
    }

    // Xóa cache cũ sau 10 phút
    for (const [key, val] of truongCache.entries()) {
      if (Date.now() - val.lastFetch > 30 * 60 * 1000) {
        truongCache.delete(key);
      }
    }
    //Nếu có record lỗi thì trả về kèm theo
    return { success: true, invalidRecords };
  } catch (error) {
    console.error("Lỗi insert DB:", error.message);
    invalidRecords.push(...records);
    return { success: false, invalidRecords };
  }
}

async function insertDiemDanh(poolTruong, dbInfo, { listGV, listHS, listHSBanTru }, checkDiemDanhTheoBuoi) {
  const {
    ma_truong_bo,
    tgbatdausang,
    tgketthucsang,
    tgbatdauchieu,
    tgketthucchieu,
  } = dbInfo;

  // Hàm insert nội bộ
  const bulkInsert = async (table, columns, rows) => {
    if (!rows.length) return;

    const values = rows
      .map(
        (_, i) =>
          `(${columns
            .map((_, j) => `$${i * columns.length + j + 1}`)
            .join(", ")})`
      )
      .join(", ");

    const params = rows.flatMap((r) => {
      const [date, time] = r.time.split(" ");
      let sang = 0;
      let chieu = 0;

      if (checkDiemDanhTheoBuoi) {
        //ĐIỂM DANH THEO BUỔI
        sang = time > tgbatdausang && time < tgketthucsang ? 1 : 0;
        chieu = time > tgbatdauchieu && time < tgketthucchieu ? 1 : 0;
      } else {
        //KHÔNG THEO BUỔI — CHỈ CẦN ĐIỂM DANH LÀ ĐƯỢC
        const trongKhoangHoatDong = time >= tgbatdausang && time <= tgketthucchieu;
        if (trongKhoangHoatDong) {
          sang = 1;
          chieu = 1;
        } else {
          sang = 0;
          chieu = 0;
        }
      }
      
      if (table === "d_diemdanh_giaovien") {
        return [date, time, ma_truong_bo, r.userId, sang, chieu, 1];
      } else {
        return [date, time, ma_truong_bo, r.userId, sang, chieu];
      }
    });

    await poolTruong.query(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values}`,
      params
    );
  };

  // Insert giáo viên (nếu có)
  await bulkInsert(
    "d_diemdanh_giaovien",
    [
      "date",
      "thoigian",
      "ma_truong_bo",
      "ma_so",
      "trangthai_sang",
      "trangthai_chieu",
      "trangthai",
    ],
    listGV
  );

  // Insert học sinh thường
  await bulkInsert(
    "d_diemdanh",
    [
      "date",
      "thoigian",
      "ma_truong_bo",
      "ma_hs_so",
      "trangthai_sang",
      "trangthai_chieu",
    ],
    listHS
  );

  // Insert học sinh bán trú
  await bulkInsert(
    "d_diemdanh_bantru",
    [
      "date",
      "thoigian",
      "ma_truong_bo",
      "ma_hs_so",
      "trangthai_sang",
      "trangthai_chieu",
    ],
    listHSBanTru
  );

  console.log(`[${dbInfo.hd_database}] GV: ${listGV.length}, HS: ${listHS.length}, HS bán trú: ${listHSBanTru.length}`);
}

async function guiThongBaoDiemDanh(cauhinhTruong, cauhinhNamHoc, groupRecords, dbInfo) {
  const rule = cauhinhTruong?.QuyTacGuiThongBao;
  // console.log("rule", rule);
  
  if (rule?.isGuiThongBaoDiemDanh !== 1) return [];
  
  const modeNotify = rule.isGuiZNS ? "ZNS" : rule.isGuiFCM ? "FCM" : null;
  if (!modeNotify) return [];

  // Xử lý từng bản ghi
  const notifyRecords = await Promise.all(
    groupRecords.map(async (item) => {
      const { role, hoten, tenlop, time, formattedDate } = item;
      let message = "";
      let trangthai = "";

      if ((time >= dbInfo.tgbatdausang && time <= dbInfo.tgvaosang) || (time >= dbInfo.tgbatdauchieu && time <= dbInfo.tgvaochieu)) {
        trangthai = "";
      } 
      else if ((time > dbInfo.tgvaosang && time <= dbInfo.tgketthucddsang) || (time > dbInfo.tgvaochieu && time <= dbInfo.tgketthucddchieu)) {
        trangthai = "trễ";
      } 
      else {
        return null; // Không cần gửi
      }
      // console.log("trangthai", trangthai);
      
      message = await getCauHinhMessage(
        role,
        hoten,
        tenlop,
        dbInfo.tentruong,
        trangthai,
        time,
        formattedDate
      );
      console.log("message", message);
      
      return {
        matruongbo: dbInfo.ma_truong_bo,
        userId: r.userId,
        namhoc: cauhinhNamHoc?.manamhoc || null,
        mode: modeNotify,
        message
      };
    })
  );

  return notifyRecords.filter(Boolean); // loại bỏ null
}

module.exports = { diemdanhBatch };