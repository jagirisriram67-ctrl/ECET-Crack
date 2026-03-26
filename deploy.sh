#!/bin/bash
# ECET Crack Global Setup & Deployment Script for GCP Ubuntu

echo "🚀 Starting ECET Crack GCP Deployment..."

# 1. Update and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw

# 2. Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clone repo (make sure the repo is public, or use token)
cd ~
git clone https://github.com/jagirisriram67-ctrl/ECET-Crack.git
cd ECET-Crack

# 5. Setup Backend
cd backend
npm install
# Create .env file for production
cat <<EOT >> .env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ecet_crack
JWT_SECRET=super_secret_ecet_key_2026
ADMIN_EMAIL=admin@ecetcrack.com
ADMIN_PASSWORD=admin123
EOT
pm2 start server.js --name "ecet-api"
pm2 save
pm2 startup | tail -n 1 | sudo bash

# 6. Build Admin Panel
cd ../admin
npm install
npm run build
sudo cp -r dist/* /var/www/html/

# 7. Setup Nginx (Reverse Proxy for API + Serve Admin Panel)
sudo cat <<EOF | sudo tee /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    server_name _;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo systemctl restart nginx

# 8. Firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow 22
echo "y" | sudo ufw enable

echo "✅ Deployment Complete! The app and API are now live on your server IP."
