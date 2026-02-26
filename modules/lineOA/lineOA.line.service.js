const axios = require("axios");

const LINE_API = "https://api.line.me/v2/bot";
const headers = {
  Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
};

exports.getProfile = async (userId) => {
  try {
    const res = await axios.get(`${LINE_API}/profile/${userId}`, { headers });
    return res.data;
  } catch (err) {
    return {};
  }
};