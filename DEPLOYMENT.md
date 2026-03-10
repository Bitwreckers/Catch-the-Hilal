# دليل النشر على VPS — CTF Platform

دليل خطوة بخطوة لتشغيل منصة الـ CTF على خادم VPS (Ubuntu 22.04 أو أحدث).

---

## المتطلبات

| الأداة | الإصدار الموصى به |
|--------|---------------------|
| نظام التشغيل | Ubuntu 22.04 LTS (أو أحدث) |
| Docker | 24.x أو أحدث |
| Docker Compose | v2.x (مدمج مع Docker) |
| Node.js (لبناء الواجهة فقط) | 20 LTS |
| Git | أحدث إصدار |

تثبيت Docker و Docker Compose على Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
# تسجيل الخروج والدخول مرة واحدة لتفعيل مجموعة docker
```

تثبيت Node.js 20 (للبناء المحلي للواجهة):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## استنساخ المشروع

```bash
git clone <REPO_URL> ctf-platform
cd ctf-platform
```

هيكل المشروع:

```
ctf-platform/
├── frontend/          # واجهة React (Vite)
├── backend/           # CTFd (API + قاعدة البيانات + Redis)
├── DEPLOYMENT.md      # هذا الملف
└── README.md
```

---

## 1. تشغيل الـ Backend (CTFd)

### 1.1 الدخول إلى مجلد الـ backend

```bash
cd backend
```

### 1.2 (اختياري) إعداد متغيرات البيئة للإنتاج

للمزيد من الأمان، انسخ `.env.example` إلى `.env` وعدّل القيم:

```bash
cp .env.example .env
nano .env   # أو استخدم محرر آخر
```

غيّر على الأقل:

- `SECRET_KEY`: سلسلة عشوائية طويلة (مثلاً من: `openssl rand -hex 32`)
- كلمات مرور قاعدة البيانات و Redis في `docker-compose.yml` إن لم تستخدم `.env`

**مهم:** لا ترفع ملف `.env` إلى Git أبداً.

### 1.3 بناء وتشغيل الحاويات

```bash
docker compose up -d --build
```

هذا يشغّل:

- **ctfd** (التطبيق) على المنفذ 8000 داخلياً
- **nginx** على المنفذ 80 (يوجّه الطلبات إلى ctfd)
- **MariaDB** (قاعدة البيانات)
- **Redis** (الكاش)

### 1.4 التحقق من عمل الـ API

```bash
curl -I http://localhost:80
```

يجب أن تحصل على استجابة HTTP (مثلاً 302 أو 200). إذا كان الـ backend على نفس الجهاز والمنفذ 80 مفتوح، يمكنك فتح المتصفح على `http://YOUR_SERVER_IP`.

---

## 2. بناء وتشغيل الواجهة (Frontend)

لديك خياران: نشر موحد (نفس الدومين) أو نشر منفصل (دومين/منفذ مختلف للواجهة).

### الخيار أ: نشر موحد (نفس الدومين — منفذ 80 فقط)

الواجهة والـ API على نفس الدومين. تحتاج إلى:

1. بناء الواجهة بدون `VITE_API_BASE_URL` (أو تركه فارغاً) لاستخدام المسارات النسبية.
2. استخدام إعداد nginx يخدم ملفات الـ SPA ويوجّه مسارات الـ API إلى CTFd.

استخدم ملف الإعداد الجاهز `backend/conf/nginx/http_with_frontend.conf`: يخدم ملفات الـ SPA من `/usr/share/nginx/html` ويوجّه مسارات الـ API و`/ctfd-auth` و`/events` إلى CTFd. لتفعيله:

1. في `backend/docker-compose.yml` غيّر سطر volumes لخدمة nginx من `./conf/nginx/http.conf` إلى `./conf/nginx/http_with_frontend.conf`.
2. أضف volume لربط مجلد الواجهة المبنية مع nginx، مثلاً بعد البناء: انسخ محتويات `frontend/dist` إلى مجلد على الـ host (مثلاً `./frontend-dist`) واربطه: `- ./frontend-dist:/usr/share/nginx/html:ro` لخدمة nginx.
3. أعد تشغيل الـ stack: `docker compose up -d`.

### الخيار ب: نشر منفصل (الواجهة على منفذ أو دومين مختلف)

1. **إنشاء ملف البيئة للواجهة:**

```bash
cd frontend
cp .env.example .env
```

2. **تعيين عنوان الـ API في `.env`:**

```env
VITE_API_BASE_URL=http://YOUR_SERVER_IP:8000
```

أو إذا كان الـ backend خلف دومين:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

استبدل `YOUR_SERVER_IP` أو الدومين بالقيم الفعلية.

3. **تثبيت الاعتماديات والبناء:**

```bash
npm ci
npm run build
```

4. **نشر مجلد `dist`:**

- ارفع محتويات `frontend/dist` إلى خادم ويب (Nginx أو Apache) على الـ VPS، أو
- استخدم حاوية الـ frontend الجاهزة:

```bash
docker compose -f docker-compose.yml up -d --build
```

حاوية الـ frontend تخدم الملفات على المنفذ 4173 افتراضياً. غيّر `VITE_API_BASE_URL` في `frontend/docker-compose.yml` أو عبر متغير بيئة ليطابق عنوان الـ backend الفعلي.

5. **تفعيل CORS على الـ backend:**  
إذا كان الـ frontend على دومين أو منفذ مختلف، تأكد أن إعدادات CTFd/الخادم تسمح بـ CORS من مصدر الواجهة (عادةً يُعدّل في إعدادات التطبيق أو الـ reverse proxy).

---

## 3. الإعداد الأولي لـ CTFd

1. افتح في المتصفح عنوان الموقع (مثلاً `http://YOUR_SERVER_IP` أو الدومين الذي يخدم الـ backend).
2. اتبع صفحة الإعداد الأولى: إنشاء حساب المدير، اسم المنافسة، إلخ.
3. بعد الإعداد، يمكنك إدارة التحديات والمستخدمين من لوحة التحكم.

---

## 4. استكشاف الأخطاء

| المشكلة | الحل المقترح |
|---------|----------------|
| **502 Bad Gateway** | انتظر بضع ثوانٍ بعد `docker compose up` حتى تبدأ MariaDB و CTFd. تحقق: `docker compose logs ctfd`. |
| **قاعدة البيانات غير متاحة** | تأكد أن خدمة `db` تعمل: `docker compose ps`. راجع `docker compose logs db`. |
| **SECRET_KEY غير معرّف (مع أكثر من worker)** | عيّن `SECRET_KEY` في `.env` أو في `environment` لخدمة `ctfd` في `docker-compose.yml`. |
| **الواجهة لا تتصل بالـ API** | تأكد أن `VITE_API_BASE_URL` في `.env` (وقيمته عند البناء) تطابق عنوان الـ backend الذي يصل إليه المتصفح. أعد البناء بعد تغيير `.env`. |
| **CORS أو طلبات مرفوضة** | إذا الواجهة على دومين مختلف، فعّل CORS من مصدر الواجهة في الـ backend أو الـ reverse proxy. |
| **المنفذ 80 مستخدم** | غيّر `ports` في `docker-compose.yml` لخدمة nginx (مثلاً `8080:80`). |

عرض السجلات:

```bash
cd backend
docker compose logs -f ctfd
docker compose logs -f nginx
```

---

## 5. أمان أساسي للإنتاج

1. **غيّر كلمات المرور الافتراضية** في `backend/docker-compose.yml` (MariaDB و Redis) وقيم `.env` (مثل `SECRET_KEY`).
2. **لا تعرّض المنفذ 8000 مباشرة للإنترنت** إن أمكن؛ اترك nginx على 80/443 فقط.
3. **استخدم HTTPS** عبر reverse proxy على الـ host (Nginx أو Caddy) مع شهادة (مثلاً Let's Encrypt).
4. **لا ترفع أبداً** ملفات `.env` أو `.ctfd_secret_key` أو مجلد `.data` إلى Git.
5. **حدّث النظام والحاويات** دورياً: `sudo apt update && sudo apt upgrade`, و`docker compose pull` ثم إعادة البناء عند الحاجة.

---

## 6. إعداد Nginx الموحد (اختياري — خيار أ)

لخدمة الواجهة والـ API من نفس الدومين (منفذ 80):

1. ابنِ الواجهة بدون `VITE_API_BASE_URL` (اتركه فارغاً أو احذفه من `.env`):

```bash
cd frontend
npm ci
npm run build
```

2. انسخ محتويات `frontend/dist` إلى مجلد داخل المشروع (مثلاً `backend/frontend-dist`) أو إلى مسار على الـ host.

3. في `backend/docker-compose.yml` عدّل خدمة `nginx`:
   - استبدل `./conf/nginx/http.conf` بـ `./conf/nginx/http_with_frontend.conf` في الـ volume.
   - أضف volume لملفات الواجهة، مثلاً: `- ./frontend-dist:/usr/share/nginx/html:ro` (بعد إنشاء `frontend-dist` ونسخ محتويات `dist` إليه).

4. أعد التشغيل: `docker compose up -d --build`.

بهذا يعمل الموقع كاملاً على منفذ 80 دون الحاجة لتعيين `VITE_API_BASE_URL`.

---

## 7. أوامر مرجعية سريعة

```bash
# تشغيل الـ backend
cd backend && docker compose up -d --build

# إيقاف الـ backend
cd backend && docker compose down

# بناء الواجهة (نشر منفصل)
cd frontend && cp .env.example .env && npm ci && npm run build

# عرض سجلات الـ backend
cd backend && docker compose logs -f ctfd
```

---

**Developed by [bitwreckers](https://www.bitwreckers.com/)**
