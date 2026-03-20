# تشغيل CTF Platform على VPS — دومينات منفصلة

دليل عملي خطوة بخطوة لتشغيل الباك اند والفرونت اند على دومينات/روابط مختلفة (مثلاً: `api.example.com` و `ctf.example.com`).

---

## المتطلبات

- VPS يعمل عليه Ubuntu 24.04 (مثل `209.74.79.65`)
- Docker و Docker Compose مثبتين
- دومينان (أو IP + منافذ مختلفة) للباك والفرونت

---

## الخطوة 0: الاتصال بالـ VPS وتثبيت Docker

```bash
ssh Writer@209.74.79.65
```

بعد الدخول، إن لم يكن Docker مثبتاً:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# ثم اخرج وادخل مرة ثانية: exit ثم ssh مرة أخرى
```

---

## الخطوة 1: رفع المشروع أو استنساخه على الـ VPS

```bash
# إن لم يكن المشروع موجوداً، انسخه عبر scp من جهازك المحلي أو استخدم git:
git clone <رابط_الريبو> ctf-platform
cd ctf-platform
```

---

## الخطوة 2: تشغيل الباك اند (Backend / CTFd)

### 2.1 الدخول لمجلد الباك اند

```bash
cd backend
```

### 2.2 (مهم) إنشاء ملف `.env` للأمان

```bash
cp .env.example .env
nano .env
```

أضف على الأقل:

```env
SECRET_KEY=اكتب_هنا_سلسلة_عشوائية_طويلة
```

لتوليد سلسلة عشوائية آمنة:

```bash
openssl rand -hex 32
```

انسخ الناتج وضعها مكان `SECRET_KEY` في `.env`.

**إذا كان الفرونت على دومين مختلف، أضف:**

```env
FRONTEND_ORIGIN=https://ctf.yourdomain.com
```

أو إذا تستخدم IP ومنفذ:

```env
FRONTEND_ORIGIN=http://209.74.79.65:4173
```

### 2.3 تشغيل الباك اند

```bash
docker compose up -d --build
```

### 2.4 التحقق

```bash
curl -I http://localhost:80
```

يفترض أن تحصل على استجابة HTTP (302 أو 200).

**عناوين الباك اند:**
- من داخل الـ VPS: `http://localhost:80` أو `http://localhost:8000`
- من الخارج: `http://209.74.79.65` أو `https://api.yourdomain.com` (بعد ربط الدومين)

---

## الخطوة 3: تشغيل الفرونت اند (Frontend)

### 3.1 الدخول لمجلد الفرونت اند

```bash
cd ../frontend
```

### 3.2 إنشاء ملف `.env` مع رابط الباك اند

```bash
cp .env.example .env
nano .env
```

غيّر/أضف:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

أو إذا الباك على IP:

```env
VITE_API_BASE_URL=http://209.74.79.65:8000
```

أو إذا كلاهما على نفس الـ VPS (الباك على المنفذ 8000):

```env
VITE_API_BASE_URL=http://209.74.79.65:8000
```

**مهم:** لا ضع `/` في النهاية.

### 3.3 بناء وتشغيل الفرونت بـ Docker

```bash
# انقل قيمة VITE_API_BASE_URL لـ docker compose
export VITE_API_BASE_URL=http://209.74.79.65:8000
# أو إذا عندك دومين:
# export VITE_API_BASE_URL=https://api.yourdomain.com

docker compose up -d --build
```

أو اكتب القيمة مباشرة في الأمر:

```bash
VITE_API_BASE_URL=http://209.74.79.65:8000 docker compose up -d --build
```

### 3.4 التحقق

الفرونت يعمل على المنفذ **4173** (يُعرض داخلياً كـ 80):

```bash
curl -I http://localhost:4173
```

**عناوين الفرونت اند:**
- من الخارج: `http://209.74.79.65:4173` أو `https://ctf.yourdomain.com`

---

## الخطوة 4: إعداد CTFd لأول مرة

1. افتح رابط الباك اند في المتصفح (مثلاً `http://209.74.79.65` أو دومين الـ API).
2. اتبع صفحة الإعداد: إنشاء حساب المدير، اسم المنافسة، إلخ.
3. بعد الإعداد، ادخل للوحة التحكم من رابط الباك اند: `/admin`.

---

## الخطوة 5: ربط الدومينات (إن أردت)

### 5.1 دومين للباك اند (مثلاً api.example.com)

1. أضف سجل DNS: `api.example.com` → `209.74.79.65`
2. استخدم Nginx أو Caddy على الـ host كـ reverse proxy:
   - يوجه `api.example.com` إلى `localhost:80` (خدمة nginx الخاصة بالباك اند)
3. أو غيّر `docker-compose` للباك اند ليعرض المنفذ 80 على الـ host.

### 5.2 دومين للفرونت اند (مثلاً ctf.example.com)

1. أضف سجل DNS: `ctf.example.com` → `209.74.79.65`
2. استخدم Nginx/Caddy ليوجه `ctf.example.com` إلى `localhost:4173`

### 5.3 تحديث الإعدادات بعد ربط الدومينات

**في `backend/.env`:**

```env
FRONTEND_ORIGIN=https://ctf.example.com
```

**في `frontend/.env`:**

```env
VITE_API_BASE_URL=https://api.example.com
```

ثم أعد البناء والتشغيل:

```bash
# الباك اند
cd backend
docker compose up -d --build

# الفرونت اند
cd ../frontend
VITE_API_BASE_URL=https://api.example.com docker compose up -d --build
```

---

## أوامر مرجعية

| الأمر | الوصف |
|-------|--------|
| `cd backend && docker compose up -d --build` | تشغيل الباك اند |
| `cd frontend && VITE_API_BASE_URL=... docker compose up -d --build` | تشغيل الفرونت اند |
| `cd backend && docker compose down` | إيقاف الباك اند |
| `cd backend && docker compose logs -f ctfd` | عرض سجلات الباك اند |

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| 502 Bad Gateway | انتظر بضع ثوانٍ بعد التشغيل. راجع: `docker compose logs ctfd` |
| الواجهة لا تتصل بالـ API | تأكد أن `VITE_API_BASE_URL` صحيح وأنك أعدت البناء بعد تغييره |
| CORS أو طلبات مرفوضة | تأكد أن `FRONTEND_ORIGIN` في `backend/.env` يطابق رابط الفرونت بالضبط |
| المنفذ 80 مستخدم | غيّر في `backend/docker-compose.yml` مثلاً إلى `8080:80` |

---

**Developed by [bitwreckers](https://www.bitwreckers.com/)**
