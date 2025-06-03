// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = 8080;

app.use(cors());
app.use(bodyParser.json());

// เก็บรหัสยืนยันชั่วคราว (ในหน่วยความจำ)
const verificationCodes = {};

// ตั้งค่า Gmail SMTP (ให้ใช้ Gmail ของคุณ)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "angpaoprim2@g,ail.com",
        pass: "cpxd ckhp qulx frmy" // ต้องใช้รหัสแอปจาก Google (ไม่ใช่รหัสผ่านบัญชี!)
    }
});

// สร้างรหัส 6 หลัก
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ส่งรหัสไปทางอีเมล
app.post("/send-code", (req, res) => {
    const email = req.body.email;
    const code = generateCode();
    verificationCodes[email] = code;

    const mailOptions = {
        from: '"ระบบยืนยันอีเมล" <YOUR_EMAIL@gmail.com>',
        to: email,
        subject: "รหัสยืนยันของคุณ",
        text: `รหัสยืนยันของคุณคือ: ${code}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "ส่งอีเมลล้มเหลว" });
        }
        res.json({ message: "ส่งรหัสยืนยันแล้ว" });
    });
});

// ตรวจสอบรหัสยืนยัน
app.post("/verify-code", (req, res) => {
    const { email, code } = req.body;
    if (verificationCodes[email] === code) {
        delete verificationCodes[email];
        return res.json({ message: "ยืนยันอีเมลสำเร็จ" });
    }
    res.status(400).json({ message: "รหัสไม่ถูกต้อง" });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
