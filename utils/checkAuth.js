function checkAuth(expectedToken) {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({
        status: 401,
        message: "Thiếu Authorization Token",
        data: null,
      });
    }
    if (authHeader !== expectedToken) {
      return res.status(403).json({
        status: 403,
        message: "Token không hợp lệ",
        data: null,
      });
    }
    next();
  };
}

module.exports = { checkAuth };