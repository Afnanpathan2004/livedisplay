# LiveBoard Production Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0
- PostgreSQL (optional, for database persistence)
- Redis (optional, for caching and sessions)

### 1. Environment Setup

Copy and configure the production environment file:

```bash
cp .env.production .env
```

Update the following critical settings in `.env`:

```env
# Security (MUST CHANGE)
JWT_SECRET=your-super-secure-jwt-secret-here
SESSION_SECRET=your-super-secure-session-secret-here

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/liveboard

# Server
PORT=4000
NODE_ENV=production

# Client Origin
CLIENT_ORIGIN=https://yourdomain.com
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Build for Production

#### Option A: Automated Build (Recommended)
```bash
node build.js
```

#### Option B: Manual Build
```bash
# Build client
cd client
npm run build
cd ..

# Prepare server
cd server
npx prisma generate  # If using Prisma
cd ..
```

### 4. Start Production Server

#### Windows
```bash
start-production.bat
```

#### Linux/Mac
```bash
chmod +x start-production.sh
./start-production.sh
```

#### Direct Node
```bash
NODE_ENV=production node server/src/bulletproof-server.js
```

## 📦 Deployment Options

### Option 1: Traditional VPS (Ubuntu/Debian)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 for process management
sudo npm install -g pm2

# 3. Clone and setup
git clone https://github.com/yourusername/liveboard.git
cd liveboard
npm install

# 4. Configure environment
cp .env.production .env
nano .env  # Edit configuration

# 5. Build and start with PM2
node build.js
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy application files
COPY . .

# Build client
RUN cd client && npm run build

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server/src/bulletproof-server.js"]
```

Build and run:

```bash
docker build -t liveboard .
docker run -d -p 4000:4000 --env-file .env liveboard
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### AWS EC2
1. Launch EC2 instance (Ubuntu 20.04 LTS recommended)
2. Configure security groups (open ports 80, 443, 4000)
3. SSH into instance and follow VPS deployment steps
4. Setup Nginx as reverse proxy

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build command: `node build.js`
3. Configure run command: `node server/src/bulletproof-server.js`
4. Set environment variables in dashboard

## 🔒 Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Change default SESSION_SECRET
- [ ] Configure HTTPS/SSL certificates
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Remove debug endpoints
- [ ] Setup monitoring and logging
- [ ] Regular security updates
- [ ] Backup strategy

## 🔧 Production Configuration

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'liveboard',
    script: './server/src/bulletproof-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

### SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring

### Health Check Endpoint
```
GET /api/health
```

### Metrics Endpoint (if enabled)
```
GET /metrics (Port 9090)
```

### Recommended Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Loggly, Papertrail, ELK Stack
- **APM**: New Relic, DataDog, AppDynamics
- **Errors**: Sentry, Rollbar

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Failed
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules
- Verify credentials

#### Client Not Loading
- Check if client was built: `ls client/dist`
- Verify CORS settings
- Check browser console for errors

#### High Memory Usage
- Implement pagination for large datasets
- Use streaming for file uploads
- Configure Node.js memory limit:
  ```bash
  node --max-old-space-size=2048 server/src/bulletproof-server.js
  ```

### Logs Location
- Application logs: `server/logs/`
- PM2 logs: `~/.pm2/logs/`
- System logs: `/var/log/`

## 📈 Performance Optimization

### 1. Enable Compression
Already configured in the application

### 2. Enable Caching
Set `ENABLE_CACHING=true` in environment

### 3. Database Optimization
- Add indexes for frequently queried fields
- Use connection pooling
- Regular VACUUM (PostgreSQL)

### 4. CDN for Static Assets
- Use CloudFlare, AWS CloudFront, or similar
- Configure cache headers properly

### 5. Load Balancing
Use PM2 cluster mode or Nginx load balancing for multiple instances

## 🔄 Updates and Maintenance

### Update Process
```bash
# 1. Backup current deployment
cp -r /path/to/liveboard /path/to/backup

# 2. Pull latest changes
git pull origin main

# 3. Install new dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 4. Build new version
node build.js

# 5. Restart application
pm2 restart liveboard
```

### Database Migrations
```bash
cd server
npx prisma migrate deploy
```

### Rollback Process
```bash
# 1. Stop current version
pm2 stop liveboard

# 2. Restore backup
cp -r /path/to/backup /path/to/liveboard

# 3. Restart previous version
pm2 start liveboard
```

## 📞 Support

For issues or questions:
- GitHub Issues: [your-repo-url]/issues
- Email: support@liveboard.com
- Documentation: [your-docs-url]

## 📝 License

[Your License Here]

---

Last Updated: 2024
Version: 1.0.0
