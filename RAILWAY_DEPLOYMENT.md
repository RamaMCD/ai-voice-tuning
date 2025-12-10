# 🚂 Railway Deployment Guide

Panduan lengkap untuk deploy AI Voice Tuning ke Railway.

## 📋 Prerequisites

1. **Akun Railway**: Daftar di [railway.app](https://railway.app)
2. **GitHub Repository**: Repository sudah ter-push ke GitHub
3. **Railway CLI** (opsional): `npm install -g @railway/cli`

## 🚀 Deployment Steps

### Method 1: Via Railway Dashboard (Recommended)

#### 1. Login ke Railway
- Buka [railway.app](https://railway.app)
- Login dengan GitHub account

#### 2. Create New Project
- Klik **"New Project"**
- Pilih **"Deploy from GitHub repo"**
- Pilih repository: `RamaMCD/ai-voice-tuning`
- Klik **"Deploy Now"**

#### 3. Configure Environment Variables
Railway akan otomatis detect dan setup, tapi pastikan:
- `NODE_ENV=production`
- `PORT` akan otomatis di-set oleh Railway
- Python dependencies akan otomatis ter-install

#### 4. Wait for Deployment
- Railway akan:
  - Install Node.js dependencies
  - Install Python dependencies
  - Install FFmpeg
  - Build dan start aplikasi
- Proses biasanya 3-5 menit

#### 5. Get Your URL
- Setelah deployment selesai
- Railway akan memberikan URL seperti: `https://your-app-name.up.railway.app`
- Klik URL untuk mengakses aplikasi

### Method 2: Via Railway CLI

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login
```bash
railway login
```

#### 3. Initialize Project
```bash
railway init
```

#### 4. Deploy
```bash
railway up
```

## ⚙️ Configuration Files

Project sudah include file konfigurasi Railway:

### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'python39', 'ffmpeg']

[phases.install]
cmds = [
    'npm ci --only=production',
    'pip install -r ai_engine/requirements.txt'
]

[phases.build]
cmds = [
    'mkdir -p uploads outputs logs'
]

[start]
cmd = 'npm start'
```

## 🔧 Environment Variables

Railway akan otomatis set beberapa variables, tapi Anda bisa override:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | Auto-assigned | Railway akan set otomatis |
| `PYTHON_PATH` | `python3` | Python executable |
| `MAX_FILE_SIZE` | `10485760` | Max upload size (10MB) |
| `PROCESSING_TIMEOUT` | `30000` | AI processing timeout |

## 📊 Monitoring

### Railway Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History dan rollback
- **Settings**: Environment variables, domains

### Health Check
- Endpoint: `https://your-app.up.railway.app/health`
- Response: `{"success": true, "message": "Server is running"}`

## 🌐 Custom Domain (Optional)

### Add Custom Domain
1. Go to Railway Dashboard
2. Select your project
3. Go to **Settings** → **Domains**
4. Click **"Add Domain"**
5. Enter your domain (e.g., `ai-voice-tuning.yourdomain.com`)
6. Update DNS records as instructed

### SSL Certificate
- Railway automatically provides SSL certificates
- HTTPS akan aktif dalam beberapa menit

## 🔍 Troubleshooting

### Common Issues

#### ❌ Build Failed
**Symptoms**: Deployment fails during build
**Solutions**:
- Check logs in Railway dashboard
- Ensure all dependencies in `package.json`
- Verify Python requirements in `ai_engine/requirements.txt`
- Try using Dockerfile instead of Nixpacks (Railway will auto-detect)

#### ❌ NPM Install Failed
**Symptoms**: `npm ci` or `npm install` errors
**Solutions**:
- Railway now uses `npm install --omit=dev` in nixpacks.toml
- Dockerfile alternative available for more control
- Check if package-lock.json is compatible

#### ❌ Python Dependencies Failed
**Symptoms**: `pip install` errors
**Solutions**:
- Check Python version compatibility
- Some packages might need system dependencies
- Consider using lighter alternatives

#### ❌ FFmpeg Not Found
**Symptoms**: Audio processing fails
**Solutions**:
- FFmpeg should be auto-installed via nixpacks.toml
- Check if `ffmpeg` is in PATH
- Verify nixpacks.toml configuration

#### ❌ File Upload Issues
**Symptoms**: Upload fails or files not found
**Solutions**:
- Railway has ephemeral filesystem
- Files will be deleted on restart
- Consider using external storage for production

#### ❌ Memory Issues
**Symptoms**: App crashes with memory errors
**Solutions**:
- Railway free tier has memory limits
- Optimize audio processing
- Consider upgrading Railway plan

### Debugging

#### View Logs
```bash
railway logs
```

#### Connect to Shell
```bash
railway shell
```

#### Check Environment
```bash
railway run env
```

## 💰 Pricing

### Railway Pricing Tiers:
- **Hobby Plan**: $0/month
  - 512MB RAM
  - 1GB Disk
  - Good for testing

- **Pro Plan**: $20/month
  - 8GB RAM
  - 100GB Disk
  - Better for production

### Cost Optimization:
- Use efficient audio processing
- Implement proper cleanup
- Monitor resource usage

## 🚀 Post-Deployment

### 1. Test All Features
- Upload audio files
- Record audio
- Process with AI
- Download results

### 2. Update Documentation
- Update README.md with live URL
- Update USER_MANUAL.md with production URL

### 3. Monitor Performance
- Check Railway metrics
- Monitor error logs
- Test with different audio files

## 🔄 Updates & Maintenance

### Deploy Updates
1. Push changes to GitHub
2. Railway will auto-deploy from main branch
3. Monitor deployment in dashboard

### Rollback if Needed
1. Go to Railway Dashboard
2. Select **Deployments**
3. Click **"Rollback"** on previous version

## 📝 Notes

- **Ephemeral Storage**: Files uploaded will be deleted on restart
- **Cold Starts**: App might take few seconds to wake up if idle
- **Resource Limits**: Monitor usage to avoid hitting limits
- **Auto-Deploy**: Pushes to main branch will trigger deployment

## 🎉 Success!

Once deployed, your AI Voice Tuning app will be live at:
`https://your-app-name.up.railway.app`

Share the URL and let users enjoy AI-powered pitch correction! 🎵✨