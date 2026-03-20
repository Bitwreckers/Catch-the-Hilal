# إعداد Nginx على الـ VPS

## 1) تأكد أن الباك اند يشتغل على المنفذ 8080

```bash
cd ~/ctf-platform
git pull origin 16-3
cd backend
chmod +x docker-entrypoint.sh
docker compose down
docker compose up -d
```

## 2) شهادة SSL لـ ctf-admin (إذا ما عندك)

```bash
sudo certbot certonly --nginx -d ctf-admin.jordancyberclub.com
```

## 3) نسخ وتفعيل إعدادات Nginx

```bash
# نسخ إعداد ctf (تصحيح المنفذ 4173 بدل 8000)
sudo cp ~/ctf-platform/nginx-configs/ctf.jordancyberclub.com /etc/nginx/sites-available/

# نسخ إعداد ctf-admin
sudo cp ~/ctf-platform/nginx-configs/ctf-admin.jordancyberclub.com /etc/nginx/sites-available/

# تفعيل ctf-admin
sudo ln -sf /etc/nginx/sites-available/ctf-admin.jordancyberclub.com /etc/nginx/sites-enabled/

# استبدال إعداد ctf القديم
sudo rm /etc/nginx/sites-enabled/ctf.jordancyberclub.com
sudo ln -sf /etc/nginx/sites-available/ctf.jordancyberclub.com /etc/nginx/sites-enabled/

# التحقق وإعادة التحميل
sudo nginx -t
sudo systemctl reload nginx
```

## الملخص

| الدومين | المنفذ | الخدمة |
|---------|--------|--------|
| ctf.jordancyberclub.com | 4173 | الفرونت اند |
| ctf-admin.jordancyberclub.com | 8080 | الباك اند (nginx داخل docker) |
