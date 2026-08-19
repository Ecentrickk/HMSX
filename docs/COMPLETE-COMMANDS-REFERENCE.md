# H1MS - Complete Command Reference Guide

**Status:** Server Running ✅  
**URL:** http://localhost:3000  
**Framework:** Next.js 14.2.35  
**Database:** MongoDB Atlas Connected ✅

---

## 🎯 Quick Start - Run These Commands in Order

### 1️⃣ First Time Setup

```powershell
# Navigate to project
cd c:\Users\KIIT\HMS\H1MS

# Install dependencies (if needed)
npm install

# Generate Prisma client
npm run db:generate

# Push database schema to MongoDB
npm run db:push

# Seed demo data (creates demo users)
npm run db:seed
```

### 2️⃣ Start Development Server

```powershell
npm run dev
```

**Output:**
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  - Environments: .env.local, .env

 ✓ Ready in 4.9s
```

### 3️⃣ Access the Application

Open browser: **http://localhost:3000**

### 4️⃣ Login with Demo Account

| Field | Value |
|-------|-------|
| Email | doctor@h1ms.com |
| Password | demo123 |

---

## 📋 Complete Commands List

### Core Development Commands

| Command | What it Does | When to Use |
|---------|------------|-----------|
| `npm run dev` | Start development server with hot-reload | Daily development |
| `npm run build` | Create production build (minified, optimized) | Before deployment |
| `npm start` | Start production server (must run `build` first) | Production mode |
| `npm run lint` | Check TypeScript/JavaScript syntax errors | Before committing |

### Database Commands

| Command | What it Does | When to Use |
|---------|------------|-----------|
| `npm run db:generate` | Generate Prisma Client | After schema changes |
| `npm run db:push` | Push schema changes to MongoDB | After schema changes |
| `npm run db:seed` | Populate demo data (demo users, sample patients) | First setup or reset data |
| `npm run db:studio` | Open visual database explorer | Debugging/exploring data |

### Release/Deployment Commands

| Command | What it Does | When to Use |
|---------|------------|-----------|
| `npm run release` | Build release package (hospital installs Node.js) | Release to hospitals |
| `npm run release:full` | Build with bundled Node.js (no install needed) | Release to hospitals |

---

## 🔧 Full Command Breakdown

### Development Server

#### Start Dev Server
```powershell
npm run dev
```

**What happens:**
- Compiles TypeScript → JavaScript
- Starts Next.js dev server on port 3000
- Watches for file changes (hot reload)
- Compiles changes on save
- Outputs logs to console

**To stop:** Press `Ctrl+C`

**To restart:** Press `Ctrl+C`, then run `npm run dev` again

#### Customize Port (if 3000 is in use)
```powershell
# Option 1: Windows PowerShell
$env:PORT=3001
npm run dev

# Option 2: Command Prompt
set PORT=3001 && npm run dev

# Then visit: http://localhost:3001
```

---

### Production Build

#### Create Production Build
```powershell
npm run build
```

**What happens:**
- Compiles all TypeScript to optimized JavaScript
- Minifies code (reduces file size)
- Strips source maps (hides source code)
- Creates standalone bundle in `.next/` folder
- Performs optimizations and checks

**Output:**
```
  ▲ Next.js 14.2.35
  Compiled successfully

Route (Kind)                  Size
- [_app]                      100 kB
- [_document]                 2.5 kB
- api/auth/[...nextauth]      50 kB
- dashboard/page              120 kB

Generated with 0 warnings

✓ Build complete. Ready for production.
```

#### Start Production Server
```powershell
# First build
npm run build

# Then start
npm start

# Server runs on port 3000 (or configured PORT)
# Visit: http://localhost:3000
```

---

### Database Management

#### Generate Prisma Client
```powershell
npm run db:generate
```

**When needed:**
- After installing new Prisma version
- After editing schema.prisma
- If TypeScript can't find `@prisma/client`

**What it does:**
- Generates type-safe database client
- Creates queries and mutations helpers
- Validates schema syntax

---

#### Push Schema to Database
```powershell
npm run db:push
```

**When needed:**
- First setup (creates all tables)
- After schema changes (adds new fields)

**What it does:**
- Reads `prisma/schema.prisma`
- Compares with existing MongoDB schema
- Applies changes (adds tables, fields, indexes)
- Does NOT delete data

**Important:** This is safe and can be run multiple times

---

#### Seed Demo Data
```powershell
npm run db:seed
```

**When needed:**
- First setup (creates demo users)
- After clearing database
- To reset to known state

**What gets created:**
```
Demo Users:
├── doctor@h1ms.com (password: demo123)
├── nurse@h1ms.com (password: demo123)
├── receptionist@h1ms.com (password: demo123)
├── pharmacist@h1ms.com (password: demo123)
└── admin@h1ms.com (password: demo123)

Sample Data:
├── 5 sample patients
├── 10 sample appointments
├── 20 sample vital signs
└── 5 sample prescriptions
```

**To create custom admin:**
Edit `prisma/seed.ts` and run `npm run db:seed` again

---

#### Open Database Explorer
```powershell
npm run db:studio
```

**What it does:**
- Opens web interface to MongoDB data
- View all collections
- Add/edit/delete records
- Build queries visually
- No code knowledge needed

**URL:** http://localhost:5555 (opens automatically)

---

### Code Quality

#### Lint Code
```powershell
npm run lint
```

**What it does:**
- Checks TypeScript syntax
- Checks JavaScript code style
- Reports errors and warnings
- Helps maintain code quality

**Example output:**
```
✓ No ESLint warnings or errors

Next.js and related packages should only be imported into files where they're intended to be used. For example, don't import `next/router` in a file that's outside the `pages` or `app` directories, and don't import `next/image` outside of a Next.js application.
```

---

### Release & Deployment

#### Build Release Package
```powershell
npm run release
```

**What it does:**
- Creates production build
- Packages into ZIP file: `H1MS-1.0.0-win64.zip`
- Creates Windows installer: `H1MS-Setup-1.0.0.exe`
- Outputs to `dist/` folder

**Requirements:**
- Hospital must have Node.js 18+ installed
- Hospital provides MongoDB connection
- Hospital creates initial admin

**Output:**
```
dist/
├── H1MS-1.0.0/               (Compiled app)
├── H1MS-1.0.0-win64.zip      (To send to hospital)
└── H1MS-Setup-1.0.0.exe      (Installer, requires Inno Setup 6)
```

---

#### Build with Bundled Node.js
```powershell
npm run release:full
```

**What it does:**
- Same as `npm run release`
- Plus: Bundles Node.js v20 runtime
- Result: Completely portable (no installation needed)

**Hospital gets:**
- Fully standalone application
- No dependencies to install
- Just extract and run

**Advantages:**
- Zero setup for hospitals
- No version conflicts
- Works on any Windows machine

**Disadvantage:**
- Larger file size (~200 MB)

---

## 🏃 Running Specific Features

### Run Only Database Operations

```powershell
# Only push schema (no seed)
npx prisma db push

# Only seed (no schema push)
npx tsx prisma/seed.ts

# View migration history
npx prisma migrate status
```

---

### Run Code Checks

```powershell
# Check for errors
npm run lint

# Format code
npx prettier --write .

# Check types (TypeScript)
npx tsc --noEmit
```

---

### Advanced: Run with Custom Configuration

#### Change Database
```powershell
# Set custom MongoDB URL
$env:DATABASE_URL="mongodb://localhost:27017/h1ms"
npm run db:push
npm run dev
```

#### Run Multiple Instances
```powershell
# Terminal 1
$env:PORT=3000
npm run dev

# Terminal 2 (new PowerShell window)
$env:PORT=3001
npm run dev

# Now have servers on both ports
```

#### Debug Mode
```powershell
# Show detailed logs
$env:DEBUG="*"
npm run dev
```

---

## 📊 Verification Commands

### Check Installation

```powershell
# 1. Check Node.js
node --version
# Should show: v22.20.0 or higher

# 2. Check npm
npm --version
# Should show: 11.14.1 or higher

# 3. Check MongoDB connection
npx tsx -e "const p = require('@prisma/client'); console.log('✓ Prisma OK')"

# 4. Check project structure
ls src/
# Should show: app, components, lib, styles, types, middleware.ts
```

---

### Health Check Commands

```powershell
# Test if server is running
curl http://localhost:3000

# Test authentication API
curl http://localhost:3000/api/auth/

# Test database connection
npm run db:studio
# (Opens at http://localhost:5555)
```

---

## 🚀 Common Workflows

### Workflow 1: First Time Setup
```powershell
cd c:\Users\KIIT\HMS\H1MS
npm install              # Install dependencies
npm run db:generate      # Setup Prisma
npm run db:push         # Create database
npm run db:seed         # Add demo data
npm run dev             # Start server
# → Open http://localhost:3000
# → Login: doctor@h1ms.com / demo123
```

### Workflow 2: Daily Development
```powershell
cd c:\Users\KIIT\HMS\H1MS
npm run dev             # Start server (it auto-reloads)
# Make code changes - server recompiles automatically
# Ctrl+C to stop when done
```

### Workflow 3: Before Production Deployment
```powershell
npm run lint            # Check for errors
npm run build           # Create optimized build
npm run start           # Test production build locally
npm run release:full    # Create hospital-ready package
# → Send dist/H1MS-Setup-1.0.0.exe to hospital
```

### Workflow 4: Reset Everything
```powershell
npm run db:push         # Reset schema
npm run db:seed         # Recreate demo data
npm run dev             # Restart server
# Database is now back to initial state
```

---

## 🛠️ Troubleshooting Commands

### Issue: "Port 3000 already in use"
```powershell
# Find what's using port 3000
Get-Process | Where-Object {$_.Handles -like "*3000*"}

# Kill process
Stop-Process -Id <ProcessID> -Force

# Or use different port
$env:PORT=3001
npm run dev
```

### Issue: "Cannot find module '@prisma/client'"
```powershell
# Regenerate Prisma client
npm run db:generate

# Or reinstall all dependencies
rm -r node_modules
npm install
npm run db:generate
```

### Issue: "Database connection failed"
```powershell
# Check .env.local file has correct DATABASE_URL
cat .env.local

# Test MongoDB connection directly
mongosh "mongodb://localhost:27017/h1ms"

# Try schema push
npm run db:push
```

### Issue: "Demo users not working"
```powershell
# Clear and reseed database
npm run db:seed

# Then login with demo@h1ms.com / demo123
```

### Issue: "TypeScript errors after file change"
```powershell
# Regenerate types
npm run db:generate

# Restart development server
# Ctrl+C
npm run dev
```

---

## 📈 Performance Monitoring

### Check Build Size
```powershell
npm run build
# Look at output for:
# - Route sizes
# - Build warnings
# - Performance tips
```

### Database Query Performance
```powershell
npm run db:studio
# Then in Studio:
# 1. Click "Raw database access"
# 2. Write query with .explain()
# 3. See query plan and indexes used
```

---

## 🔒 Security Checks

### Verify Production Build Security

```powershell
# 1. Build for production
npm run build

# 2. Check for source maps
ls -r dist/ | find "*.map"
# Should find NONE (source maps stripped)

# 3. Check for sensitive data
grep -r "NEXTAUTH_SECRET\|DATABASE_URL" dist/
# Should find NONE in output code

# 4. Verify minification
cat dist/.next/static/chunks/main-*.js | head -c 200
# Should show minified code (very hard to read)
```

---

## 📝 Environment Variables Reference

### Development (.env.local)
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/h1ms

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret

# Optional: External Services
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
FIREBASE_API_KEY=...
```

### Production
```env
# Server
NODE_ENV=production
PORT=3000

# Database (MUST be production MongoDB)
DATABASE_URL=mongodb://localhost:27017/h1ms_prod

# NextAuth
NEXTAUTH_URL=https://yourhospital.com
NEXTAUTH_SECRET=generate-random-secret-using-openssl

# SSL (if behind reverse proxy)
NODE_HTTPS=true
```

---

## 🎓 Learning Commands

### Understand TypeScript
```powershell
# Check TypeScript compilation
npx tsc --noEmit

# See what types are inferred
npx tsc --noEmit --pretty false
```

### Understand Database Schema
```powershell
# View schema in code
cat prisma/schema.prisma

# Explore database visually
npm run db:studio
```

### Understand API Routes
```powershell
# Routes are in: src/app/api/
# List all routes
ls -r src/app/api/ | find "route.ts"

# Test specific endpoint
curl http://localhost:3000/api/admin/audit
```

---

## ✅ Pre-Deployment Checklist

```
□ npm run lint          # No errors/warnings
□ npm run build         # Build succeeds
□ npm run db:push       # Schema current
□ npm run db:seed       # Demo data present
□ npm run dev           # Server starts
□ Login works           # Can access app
□ All modules load      # No console errors
□ npm run release:full  # Release builds
□ installer runs        # .exe works on test machine
```

---

## 📞 When Commands Fail

### Getting Help
```powershell
# See npm script list
npm run
# Shows: dev, build, start, lint, release, etc.

# See Prisma help
npx prisma --help
# Shows all Prisma commands

# See Next.js help
npx next --help
# Shows build options
```

### Debug Output
```powershell
# Maximum verbosity
$env:DEBUG="*"
npm run dev

# TypeScript diagnostics
npx tsc --diagnostics

# Prisma diagnostics
npx prisma debug
```

---

**Commands Quick Reference Card for Copy-Paste:**

```powershell
# FIRST TIME SETUP
npm install && npm run db:generate && npm run db:push && npm run db:seed && npm run dev

# DAILY USE
npm run dev

# BEFORE DEPLOYMENT
npm run lint && npm run build && npm run release:full

# RESET DATABASE
npm run db:push && npm run db:seed

# TROUBLESHOOT
npm run db:generate && npm run lint
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Server Status:** ✅ Running on http://localhost:3000
