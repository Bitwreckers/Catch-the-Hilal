# CTF Platform

منصة مسابقات Capture The Flag (CTF) — واجهة حديثة مبنية على React مع خلفية CTFd.

## هيكل المشروع

| المجلد | الوصف |
|--------|--------|
| `frontend/` | واجهة المستخدم (Vite + React + TypeScript) |
| `backend/`  | الخادم والـ API (CTFd — Flask، MariaDB، Redis) |

## البناء والتشغيل

### الواجهة (Frontend)

```bash
cd frontend
cp .env.example .env   # عدّل .env حسب بيئة النشر
npm ci
npm run build
```

المخرجات في `frontend/dist`. للتطوير: `npm run dev`.

### الخلفية (Backend)

```bash
cd backend
docker compose up -d --build
```

يشغّل CTFd مع Nginx و MariaDB و Redis. الوصول عبر المنفذ 80.

## النشر على VPS

للتعليمات الكاملة (متطلبات، إعداد، استكشاف أخطاء، أمان) راجع **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## التقنيات

- **Frontend:** Vite 7, React 19, TypeScript, React Router
- **Backend:** CTFd (Flask), Docker, MariaDB, Redis, Nginx

---

**Developed by [bitwreckers](https://www.bitwreckers.com/)**
