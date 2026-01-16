require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

app.use("/api/patients", require("./routes/patients.routes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
