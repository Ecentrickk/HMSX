# H1MS Hospital Management System - Enterprise Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2024  
**For:** Hospital IT Administrators

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [What's Included](#whats-included)
3. [System Requirements](#system-requirements)
4. [Installation](#installation)
5. [Initial Setup](#initial-setup)
6. [MongoDB Database Setup](#mongodb-database-setup)
7. [Accessing H1MS](#accessing-h1ms)
8. [Post-Installation Configuration](#post-installation-configuration)
9. [Operational Guide](#operational-guide)
10. [Troubleshooting](#troubleshooting)
11. [Support](#support)

---

## Overview

**H1MS** is a modern, web-based Hospital Management System designed for small to medium-sized hospitals. This package contains a compiled, production-ready application for deployment to your hospital's network.

### Key Features
- **Patient Management:** Appointments, medical records, and billing
- **Staff Management:** Doctor, nurse, pharmacy, receptionist dashboards
- **Prescription Management:** Electronic prescriptions with tracking
- **Integrated Notifications:** WhatsApp alerts and in-app notifications
- **Role-Based Access:** Secure access control by staff role
- **Audit Logging:** Complete hospital audit trails

### What You Get
✓ Compiled application (NO source code exposed)  
✓ Complete setup wizard  
✓ Database configuration tools  
✓ Administrator creation utility  
✓ Full documentation  

### What You Don't Get
✗ Source code (.ts/.tsx files)  
✗ Development tools  
✗ Uncompiled project files  

---

## What's Included

After installation, you'll have:

```
H1MS Installation Folder/
├── app/                              # Compiled application
│   ├── server.js                     # Main entry point
│   ├── .next/                        # Compiled assets (minified)
│   ├── public/                       # Images, CSS, static files
│   ├── node_modules/                 # Application dependencies
│   └── prisma/schema.prisma          # Database schema
│
├── tools/                            # Setup utilities
│   ├── create-admin.mjs              # Administrator account setup
│   ├── node_modules/                 # Prisma & setup tools
│   └── ...
│
├── runtime/ (optional)               # Portable Node.js
│   └── node/
│       └── node.exe
│
├── .env                              # Configuration (created during setup)
├── start-h1ms.bat                    # Start the application
├── setup-h1ms.ps1                    # Initial configuration wizard
├── check-requirements.ps1            # System requirements checker
└── INSTALL-GUIDE.txt                 # This documentation
```

---

## System Requirements

### Minimum Requirements
- **Windows:** Windows 10 or Windows Server 2016+ (64-bit)
- **RAM:** 4 GB
- **Disk Space:** 500 MB + database storage
- **Administrator Access:** Required for installation

### Recommended Requirements
- **RAM:** 8 GB or more
- **CPU:** Modern multi-core processor
- **Disk Space:** 1+ GB free
- **Network:** Hospital LAN (not public internet)

### Software Requirements
- **Node.js:** 18+ (installed globally OR bundled in package)
- **Database:** MongoDB 4.4+ (cloud or on-premise)
- **Browser:** Modern browser (Chrome, Edge, Firefox, Safari)

### Network Requirements
- TCP connection from hospital network to MongoDB server
- Default H1MS port: 3000 (can be customized)

---

## Installation

### Step 1: Pre-Installation Check

Run the system requirements checker:

```powershell
# Run as Administrator
.\check-requirements.ps1
```

This will verify:
- Windows version and architecture
- Available RAM and disk space
- Node.js installation
- Port 3000 availability
- MongoDB connectivity (if you provide connection string)

### Step 2: Run the Installer

**Option A: Using the Windows Installer (.exe)**
```
1. Double-click: H1MS-Setup-1.0.0-Enterprise.exe
2. Follow the installation wizard
3. Accept the pre-installation information
4. Choose installation folder (default: C:\Program Files\H1MS)
5. Choose whether to run initial setup (RECOMMENDED)
6. Complete installation
```

**Option B: Manual Installation (ZIP)**
```
1. Extract: H1MS-1.0.0-win64.zip
2. Move to desired location (e.g., C:\Program Files\H1MS)
3. Proceed to Step 3: Initial Setup
```

### Step 3: Initial Setup (First Time Only)

Run the setup wizard to configure H1MS:

```powershell
# Navigate to H1MS folder, then:
.\setup-h1ms.ps1
```

Or via Start Menu:
- Start Menu → H1MS → Initial Setup Wizard

You'll be prompted for:
1. **MongoDB Connection String** (see next section)
2. **Port Number** (default: 3000)
3. **Administrator Credentials** (email & password)

---

## MongoDB Database Setup

H1MS requires a MongoDB database to store hospital data.

### Option A: MongoDB Atlas (Cloud - Recommended)

**Easiest option for small/medium hospitals**

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Sign up (free tier available)

2. **Create a Cluster**
   - Click "Create a Deployment"
   - Choose "Shared" (Free M0)
   - Select region closest to your hospital
   - Review and Create

3. **Create Database User**
   - Go to: Database Access → Add New Database User
   - Create username and password
   - Choose "Read and write to any database"
   - Add user

4. **Configure Network Access**
   - Go to: Network Access → Add IP Address
   - Add your hospital's IP or "0.0.0.0/0" for any IP
   - Confirm

5. **Get Connection String**
   - In Deployment, click "CONNECT"
   - Choose "Drivers" (Node.js)
   - Copy the connection string
   - Replace `<password>` with your database user password
   
   Example:
   ```
   mongodb://localhost:27017/h1ms
   ```

6. **Use in H1MS Setup**
   - When running setup-h1ms.ps1, paste the connection string

### Option B: On-Premise MongoDB

**For hospitals wanting full control**

1. **Install MongoDB on Hospital Server**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Select Windows (MSI installer)
   - Run installer, follow setup wizard
   - MongoDB will run as a Windows service

2. **Verify MongoDB is Running**
   - Open Services (services.msc)
   - Look for "MongoDB Server" or "mongod"
   - Should show "Running"

3. **Create Database User**
   ```powershell
   # Connect to MongoDB (on server)
   mongosh mongodb://localhost:27017
   
   # Create admin for database
   use admin
   db.createUser({
     user: "h1ms_admin",
     pwd: "change_me_to_secure_password",
     roles: ["readWrite"]
   })
   ```

4. **Configure Connection String**
   ```
   mongodb://localhost:27017/h1ms
   ```
   - Replace with your MongoDB server's IP or hostname

5. **Test from Installation Computer**
   ```powershell
   # Install MongoDB tools
   mongosh "mongodb://h1ms_admin:Password@SERVER_NAME:27017/h1ms"
   
   # Should connect successfully
   ```

### Choosing Between Options

| Aspect | Atlas (Cloud) | On-Premise |
|--------|-------------|-----------|
| **Setup Time** | 5 minutes | 30+ minutes |
| **Cost** | Free tier (small) | Server hardware |
| **Security** | Managed by MongoDB | Your responsibility |
| **Internet Required** | Yes | No |
| **Best For** | Small hospitals | Large hospitals |
| **Data Location** | MongoDB's servers | Your server |

---

## Accessing H1MS

### Start the Application

**Option A: Start Menu**
- Start Menu → H1MS → Start H1MS
- A command window will open
- Application is ready when you see: "Open http://localhost:3000 in your browser"

**Option B: Manual**
- Navigate to H1MS installation folder
- Double-click: start-h1ms.bat
- Wait for message about localhost:3000

**Option C: Command Line**
```powershell
cd "C:\Program Files\H1MS"
.\start-h1ms.bat
```

### Access via Web Browser

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. Login with the administrator account you created during setup
4. You're in!

### Verify It's Running

The command window should show:
```
  Starting H1MS Hospital Management System...
  Open http://localhost:3000 in your browser
  Press Ctrl+C to stop the server
```

---

## Post-Installation Configuration

### Changing the Port

If port 3000 is in use by another application:

1. **Stop H1MS** (Ctrl+C in command window)
2. **Edit the .env file:**
   ```
   # Edit: C:\Program Files\H1MS\.env
   
   # Find: PORT=3000
   # Change to: PORT=3001
   ```
3. **Restart H1MS** (run start-h1ms.bat again)
4. **Access at new port:** http://localhost:3001

### Changing MongoDB Connection

If you need to connect to a different database:

1. **Stop H1MS**
2. **Edit .env:**
   ```
   # Find: DATABASE_URL=mongodb://...
   # Change to your new connection string
   ```
3. **Restart H1MS**

### Auto-Start with Windows

To automatically start H1MS when the computer boots:

1. **Create a Shortcut**
   - Right-click start-h1ms.bat → Create shortcut
   - Move shortcut to: C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup

2. **Test It**
   - Restart Windows
   - H1MS should start automatically

### Accessing from Other Workstations

By default, H1MS only accepts local connections. To access from other computers:

1. **Stop H1MS**
2. **Edit .env:**
   ```
   # Change: NEXTAUTH_URL="http://localhost:3000"
   # To: NEXTAUTH_URL="http://HOSPITAL-PC-NAME:3000"
   # Or: NEXTAUTH_URL="http://192.168.1.100:3000"
   ```
3. **Restart H1MS**
4. **From other computers, access:**
   ```
   http://HOSPITAL-PC-NAME:3000
   ```

⚠️ **SECURITY:** Do NOT expose H1MS to the public internet. Use only on hospital network.

---

## Operational Guide

### Daily Operations

#### Starting H1MS
```
Double-click: start-h1ms.bat
Wait for: "Open http://localhost:3000 in your browser"
Access: http://localhost:3000 in browser
```

#### Stopping H1MS
```
In the command window: Press Ctrl+C
Or: Close the command window
```

#### Checking Status
- If command window is open and showing no errors, H1MS is running
- If you can access http://localhost:3000, H1MS is running
- If you get "connection refused", H1MS has stopped

### Monitoring & Logs

**Application output appears in the command window:**
- Connection requests
- Database queries
- Errors (if any)
- Performance metrics

**Persistent logs stored in:**
- MongoDB (all database operations)
- Application logs (in .next/ directory)

### Backing Up Your Configuration

**IMPORTANT:** Before upgrading or migrating, backup:

```powershell
# Files to backup:
# 1. .env file (configuration & credentials)
# 2. app\prisma\schema.prisma (if customized)

# Backup command:
Copy-Item "C:\Program Files\H1MS\.env" "C:\Backup\h1ms-backup.env"
```

### Backup MongoDB Data

**If using MongoDB Atlas:**
- Automatic daily backups included
- No action needed

**If using On-Premise MongoDB:**

```powershell
# Backup database
mongodump --uri "mongodb://localhost:27017/h1ms" --out "C:\Backup\mongodb"

# Restore from backup
mongorestore --uri "mongodb://localhost:27017/h1ms" "C:\Backup\mongodb/h1ms"
```

---

## Troubleshooting

### Application Won't Start

**Error: "Node.js not found"**
```
Solution:
1. Install Node.js 18+ from https://nodejs.org
2. OR verify bundled runtime\node\node.exe exists
3. Restart H1MS
```

**Error: "Port 3000 already in use"**
```
Solution:
1. Edit .env and change PORT to 3001
2. Or stop other application using port 3000
3. Restart H1MS
```

**Error: "Cannot read app/server.js"**
```
Solution:
1. Verify installation folder is correct
2. Check that app/server.js exists
3. Reinstall H1MS
```

### Database Connection Issues

**Error: "Cannot connect to MongoDB"**
```
Troubleshooting:
1. Verify MongoDB server is running
2. Check connection string in .env
3. Test connection string manually using mongosh
4. Verify username/password are correct
5. Check firewall rules allow connection
6. If using MongoDB Atlas:
   - Verify cluster is running
   - Check IP is whitelisted in Network Access
   - Verify password doesn't have special characters (URL encode if needed)
```

**Error: "Schema does not match"**
```
Solution:
1. Stop H1MS
2. This usually means database already exists with different schema
3. Contact support if data loss is a concern
4. Or: Start with fresh MongoDB database
```

### Access Issues

**Cannot access http://localhost:3000**
```
Troubleshooting:
1. Verify H1MS is running (check command window)
2. Try: http://127.0.0.1:3000 instead
3. Try: http://COMPUTER-NAME:3000 from another computer
4. Check firewall rules (Windows Firewall)
5. Try different browser
```

**Forgot Administrator Password**
```
Solution:
1. Contact support (cannot self-recover)
2. Or: Create new admin account via create-admin.mjs
   - Stop H1MS
   - Run: node tools\create-admin.mjs
   - Follow prompts to create new admin
```

### Performance Issues

**H1MS is running slowly**
```
Optimization:
1. Check available RAM (should have 4+ GB free)
2. Verify MongoDB connection speed (network latency)
3. Check MongoDB database size (might need optimization)
4. Restart H1MS to clear memory
5. If many concurrent users, increase RAM or add more servers
```

**High CPU Usage**
```
Causes and Solutions:
1. Check MongoDB - may be running heavy queries
2. Too many open browser tabs (client-side)
3. Old browser version - update to latest
4. Check Windows Task Manager for other resource hogs
```

---

## Support

### Getting Help

1. **Read the documentation**
   - This guide (INSTALL-GUIDE.txt)
   - POSTINSTALL.txt (in installation folder)

2. **Run diagnostics**
   ```powershell
   .\check-requirements.ps1
   ```

3. **Check logs**
   - Application output (in command window)
   - MongoDB logs (if on-premise)

4. **Contact Support**
   - Email: support@h1ms.example.com
   - Include: error message, steps to reproduce, Windows version
   - Attach: .env file (with sensitive data removed)

### What You'll Need for Support

- **Hospital Name & Location**
- **Windows Version** (Run: `winver`)
- **MongoDB Type** (Atlas or On-Premise)
- **H1MS Version** (Check start-h1ms.bat output)
- **Error Message** (Full text)
- **Steps to Reproduce** (Exact sequence)

---

## FAQ

**Q: Can I use this on Mac or Linux?**  
A: This version is Windows only. Contact sales for other platforms.

**Q: What if I want to modify the application?**  
A: Source code is not included. Contact support for customization options.

**Q: Is my patient data secure?**  
A: Yes - data stays on your MongoDB server, never leaves your network.

**Q: Can I upgrade H1MS later?**  
A: Yes. Backup .env, uninstall, install new version, restore .env.

**Q: What if MongoDB fails?**  
A: H1MS won't start. Contact MongoDB support. Have backups ready.

**Q: Can I run this on multiple computers?**  
A: Yes, but share one MongoDB instance. Install on each computer.

---

## Legal & Security

- **License:** See LICENSE.txt in installation folder
- **Privacy:** No telemetry, no external data collection
- **Security:** Use strong admin password (min 8 characters)
- **Backup:** Regular MongoDB backups strongly recommended
- **Support:** Commercial support available from H1MS

---

**Last Updated:** 2024  
**Version:** 1.0.0 Enterprise  
**Status:** Production Ready
