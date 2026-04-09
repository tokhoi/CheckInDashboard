// utils/dateHelper.js
function formatCameraDate(dateString) {
  // Parse ISO date
  const date = new Date(dateString);

  // Helper: pad số có 2 chữ số
  const pad = (n) => String(n).padStart(2, "0");

  // Lấy các thành phần
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Trả về dạng YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = { formatCameraDate };
