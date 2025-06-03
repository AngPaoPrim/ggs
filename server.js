const express = require("express");
const fs = require("fs");
const cors = require("cors");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const port = 3000;
const DB_FILE = "./data.json";
const EMAIL_DB_FILE = "./allowedEmails.json";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ฟังก์ชันอ่าน/เขียน data.json
function readData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  } catch (error) {
    console.error("อ่านไฟล์ data.json ผิดพลาด:", error);
  }
  return [];
}

function writeData(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("เขียนไฟล์ data.json ผิดพลาด:", error);
  }
}

// อ่าน/เขียน allowedEmails.json
function readAllowedEmails() {
  try {
    if (fs.existsSync(EMAIL_DB_FILE)) {
      return JSON.parse(fs.readFileSync(EMAIL_DB_FILE, "utf8"));
    }
  } catch (error) {
    console.error("อ่านไฟล์ allowedEmails ผิดพลาด:", error);
  }
  return [];
}

function writeAllowedEmails(emails) {
  try {
    fs.writeFileSync(EMAIL_DB_FILE, JSON.stringify(emails, null, 2), "utf8");
  } catch (error) {
    console.error("เขียนไฟล์ allowedEmails ผิดพลาด:", error);
  }
}

// สร้างโค้ดยืนยัน
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gamepaocare@gmail.com",
    pass: "vgbk fnna rvgy cbwy",
  },
});

// ส่งโค้ดยืนยัน
app.post("/api/send-code", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // เปรียบเทียบแบบไม่สนใจตัวพิมพ์ใหญ่-เล็ก
  const allowedEmails = readAllowedEmails().map(e => e.trim().toLowerCase());
  if (!allowedEmails.includes(email.trim().toLowerCase())) {
    return res.status(400).json({ error: "ไม่พบอีเมลนี้ในระบบ กรุณาติดต่อผู้ดูแล" });
  }

  const code = generateCode();
  let data = readData();
  const existingIndex = data.findIndex((item) => item.email === email);

  if (existingIndex !== -1) {
    data[existingIndex].code = code;
  } else {
    data.push({ email, code });
  }

  writeData(data);

  const mailOptions = {
    from: "gamepaocare@gmail.com",
    to: email,
    subject: "รหัสยืนยันอีเมลของคุณ",
    text: `รหัสยืนยันของคุณคือ: ${code}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }
    console.log(`Email sent to ${email}: ${info.response}`);
    res.json({ message: "Verification code sent" });
  });
});

// ตรวจสอบโค้ดยืนยัน
app.post("/api/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  let data = readData();
  const index = data.findIndex((item) => item.email === email && item.code === code);

  if (index !== -1) {
    data.splice(index, 1);
    writeData(data);
    return res.json({ message: "Email verified successfully" });
  }

  return res.status(400).json({ error: "Invalid verification code" });
});

// API สำหรับแอดมิน: ดูและเพิ่มอีเมล
app.get("/admin/allowed-emails", (req, res) => {
  res.json(readAllowedEmails());
});

app.post("/admin/add-email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const allowedEmails = readAllowedEmails();
  // ตรวจสอบซ้ำแบบไม่สนใจตัวพิมพ์ใหญ่-เล็ก
  if (allowedEmails.map(e => e.trim().toLowerCase()).includes(email.trim().toLowerCase())) {
    return res.status(400).json({ error: "Email นี้มีอยู่แล้ว" });
  }

  allowedEmails.push(email.trim());
  writeAllowedEmails(allowedEmails);

  res.json({ message: "เพิ่มอีเมลเรียบร้อยแล้ว" });
});

// API สำหรับแอดมิน: ลบอีเมล
app.post("/admin/remove-email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  let allowedEmails = readAllowedEmails();
  const index = allowedEmails.findIndex(e => e.trim().toLowerCase() === email.trim().toLowerCase());
  if (index === -1) return res.status(400).json({ error: "ไม่พบอีเมลนี้" });

  allowedEmails.splice(index, 1);
  writeAllowedEmails(allowedEmails);
  res.json({ message: "ลบอีเมลเรียบร้อยแล้ว" });
});

// เส้นทางหน้าเว็บ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.get("/verify.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "verify.html"));
});
app.get("/home.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
app.get("/AdminParinwit.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// data.json viewer
app.get("/data", (req, res) => {
  const data = readData();
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});