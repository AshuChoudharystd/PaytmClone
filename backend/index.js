const express = require("express");
const cors = require("cors");
const mainRouter = require("./routes/index.js");

const app = express();
app.use(cors());
app.use(express.json())

app.use('/api/v1',mainRouter)

app.listen(5000, () => {
  console.log("Server is running on port http://localhost:5000/api/v1/user/signin");
});