const { appendRow } = require("../../config/google");
const { FOLLOW_SHEET, USER_SHEET } = require("./lineOA.schema");
const lineAPI = require("./lineOA.line.service");

exports.handleFollowEvent = async (event) => {
  const profile = await lineAPI.getProfile(event.source.userId);

  await appendRow(FOLLOW_SHEET, [
    new Date().toISOString(),
    event.type,
    event.source.userId,
    profile.displayName || "",
    profile.pictureUrl || ""
  ]);
};

exports.handleChatMessage = async (event) => {
  const profile = await lineAPI.getProfile(event.source.userId);

  await appendRow(USER_SHEET, [
    new Date().toISOString(),
    event.source.userId,
    profile.displayName || "",
    event.message.text
  ]);
};
