/*****************************************************************
 * LINE OA SERVICE (FINAL FIX)
 *****************************************************************/

const line = require("@line/bot-sdk");
const { appendRow } = require("../../config/google");
const { FOLLOW_SHEET, USER_SHEET } = require("./lineOA.schema");

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

/* =========================================================
   SAFE GET PROFILE
========================================================= */

async function getProfileSafe(userId) {

  if (!userId) return null;

  try {
    const profile = await client.getProfile(userId);
    return profile;
  } catch (err) {
    console.log("⚠️ getProfile failed:", err.message);
    return null;
  }

}

/* =========================================================
   FOLLOW
========================================================= */

exports.handleFollowEvent = async (event) => {

  const userId = event.source?.userId;

  try {

    console.log("👉 handleFollowEvent:", userId);

    const profile = await getProfileSafe(userId);

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "follow",
      userId,
      profile?.displayName || "",
      profile?.pictureUrl || ""
    ]);

  } catch (err) {
    console.error("❌ handleFollowEvent:", err.message);
  }

};

/* =========================================================
   UNFOLLOW
========================================================= */

exports.handleUnfollowEvent = async (event) => {

  const userId = event.source?.userId;

  try {

    console.log("👉 handleUnfollowEvent:", userId);

    await appendRow(FOLLOW_SHEET, [
      new Date().toISOString(),
      "unfollow",
      userId,
      "",
      ""
    ]);

  } catch (err) {
    console.error("❌ handleUnfollowEvent:", err.message);
  }

};

/* =========================================================
   CHAT LOG
========================================================= */

exports.handleChatMessage = async (event) => {

  const userId = event.source?.userId;

  let message = "";

  if (event.type === "message") {
    message = event.message?.text || "";
  }

  if (event.type === "postback") {
    message = event.postback?.data || "";
  }

  try {

    console.log("👉 log chat:", userId, message);

    await appendRow(USER_SHEET, [
      new Date().toISOString(),
      userId,
      message
    ]);

  } catch (err) {
    console.error("❌ handleChatMessage:", err.message);
  }

};

/* ========================================================= */

exports.lineClient = client;