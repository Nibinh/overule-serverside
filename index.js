const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieparser = require("cookie-parser");

const server = express();
dotenv.config();

server.use(express.json());
server.use(cookieparser());
server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
const PORT = process.env.PORT | 8000;
server.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});

const authRoute = require("./routes/authRoutes");

server.use("/user", authRoute);
