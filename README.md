# Solana Trading Bot Dashboard

A professional, full-stack Solana trading bot dashboard with dark theme default, authentication, and real-time monitoring.

## ✨ Features

- 🌙 **Dark Theme Default** - Always starts in dark mode
- 🔐 **Authentication System** - Login/logout with any credentials (demo mode)
- 📊 **Real-time Trading Dashboard** - Monitor SOL balances, wallets, and trading activity
- 📱 **Mobile Responsive** - Optimized for all devices
- 🚀 **Production Ready** - Built for deployment on Vercel

## 🚀 Quick Start (Single Command)

```bash
npm run start-all
```

This command will:
1. Build the project
2. Start the backend server
3. Start the frontend preview server
4. Open the app at http://localhost:3000

## 📦 Installation & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd solbot-core-V3

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production build
npm run start-all
```

## 🌐 Vercel Deployment

### Option 1: Automatic Deployment
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will automatically build and deploy

### Option 2: Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 📋 Available Scripts

- `npm run dev` - Start development server (port 12000)
- `npm run build` - Build for production
- `npm run start` - Start backend server only
- `npm run start-all` - Build and start both frontend + backend
- `npm run preview` - Preview production build

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=production
```

### Theme Configuration
The app **always defaults to dark theme**. Users can switch to light/system themes, but it will always start in dark mode.

## 🏗️ Project Structure

```
solbot-core-V3/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── store/         # Redux store & slices
│   ├── services/      # API services
│   └── styles/        # CSS styles
├── dist/              # Built frontend files
├── server-production.cjs  # Backend server
├── vercel.json        # Vercel configuration
└── package.json       # Dependencies & scripts
```

## 🔐 Authentication

- **Demo Mode**: Any username/password combination works
- **Default Credentials**: admin / password (or any other combination)
- **Session Management**: Automatic login persistence with localStorage

## 🎨 Theme System

- **Default**: Dark theme (forced on app start)
- **Options**: Light, Dark, System
- **Persistence**: Theme choice saved in localStorage
- **Mobile**: Responsive theme toggle in header

## 🚀 Production Deployment

The app is configured for seamless deployment on Vercel:

1. **Frontend**: Static files served from `/dist`
2. **Backend**: Node.js serverless functions
3. **API Routes**: All `/api/*` routes handled by backend
4. **Build Process**: Automatic TypeScript compilation and Vite bundling

## 🔧 Troubleshooting

### Theme Not Dark by Default
The theme system is now hardcoded to start in dark mode. If you see light theme, clear your browser cache and localStorage.

### Backend Connection Issues
The app gracefully handles backend disconnections with subtle retry buttons instead of error messages.

### Build Issues
Run `npm run build` to check for TypeScript or build errors before deployment.

## 📱 Mobile Optimization

- Responsive header with hamburger menu
- Mobile-friendly navigation
- Touch-optimized buttons and controls
- Adaptive text sizing and spacing

## 🎯 Key Features

1. **Professional UI**: Clean, modern interface with smooth animations
2. **Real-time Data**: Live connection status and trading metrics
3. **Secure Authentication**: Protected routes with automatic redirects
4. **Error Handling**: Graceful error states without scary messages
5. **Performance**: Optimized builds with code splitting

---

**Ready for production deployment!** 🚀