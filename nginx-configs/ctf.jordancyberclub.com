# الفرونت اند — واجهة اللاعبين
server {
    listen 443 ssl;
    server_name ctf.jordancyberclub.com;

    ssl_certificate /etc/letsencrypt/live/ctf.jordancyberclub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ctf.jordancyberclub.com/privkey.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:4173;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;

        proxy_redirect off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
    }
}
