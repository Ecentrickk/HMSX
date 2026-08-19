# 🏥 H1MS Hospital Management System

**Production-Ready Enterprise Healthcare Application**

---

## Quick Start for Hospital Administrators

### ⚡ First Time Setup (5 minutes)

1. **Run the installer**
   ```
   Double-click: H1MS-Setup-1.0.0-Enterprise.exe
   ```

2. **Check your system**
   ```powershell
   .\check-requirements.ps1
   ```

3. **Run setup wizard**
   - After installation: Start Menu → H1MS → Initial Setup Wizard
   - Enter your MongoDB connection string
   - Create administrator account

4. **Start H1MS**
   - Start Menu → H1MS → Start H1MS
   - Open browser: http://localhost:3000

---

## 📦 What's Included

✓ **Compiled Application** - Minified, optimized production build  
✓ **Database Tools** - Automatic schema setup and admin creation  
✓ **Setup Wizard** - Interactive configuration for your hospital  
✓ **Documentation** - Complete deployment and troubleshooting guides  
✓ **Security Verified** - No source code exposure  

---

## 🔒 Security & Privacy

- **Your Data:** All patient information stored in YOUR MongoDB
- **No Cloud:** Never leaves your hospital network
- **No Telemetry:** Zero data collection or tracking
- **Encrypted:** Support for SSL/TLS connections
- **Secure Admin:** Role-based access control with audit logging

---

## 📋 System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Windows** | Windows 10 | Windows Server 2019+ |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 500 MB | 1+ GB |
| **Database** | MongoDB 4.4 | MongoDB 5.0+ |
| **Node.js** | 18.x | 20.x |

---

## 🚀 For IT Administrators

### Installation Options

**Option A: Windows Installer** (Recommended)
- Automatic installation
- Desktop shortcuts
- System integration
- Built-in wizard

**Option B: Manual ZIP Installation**
- Full control over installation
- Portable installation
- Network deployments

### Key Files

```
H1MS/
├── start-h1ms.bat              # Start the application
├── setup-h1ms.ps1              # Initial configuration
├── check-requirements.ps1      # Verify system compatibility
├── HOSPITAL-DEPLOYMENT-GUIDE.md # Complete admin guide
├── INSTALL-GUIDE.txt            # Detailed installation steps
└── LICENSE.txt                  # Legal terms
```

### Common Tasks

**Start H1MS**
```powershell
.\start-h1ms.bat
# Then open: http://localhost:3000
```

**Change Port** (if 3000 is in use)
```powershell
# Edit: .env file
# Change: PORT=3000 → PORT=3001
# Restart H1MS
```

**Backup Configuration**
```powershell
Copy-Item ".env" "backup-env.txt"
```

**Create Admin Account**
```powershell
node tools\create-admin.mjs
```

---

## 📚 Documentation

- **[HOSPITAL-DEPLOYMENT-GUIDE.md](./HOSPITAL-DEPLOYMENT-GUIDE.md)** 
  Complete guide for hospital IT staff (60+ pages)

- **[INSTALL-GUIDE.txt](./INSTALL-GUIDE.txt)**
  Step-by-step installation and troubleshooting

- **POSTINSTALL.txt**
  What to do after installation

- **LICENSE.txt**
  Legal terms and conditions

---

## 🆘 Troubleshooting

### H1MS Won't Start
```powershell
# Check if Node.js is installed
node -v

# If not installed:
# Install from https://nodejs.org (version 18+)

# Or run system check:
.\check-requirements.ps1
```

### Cannot Connect to MongoDB
```
Common causes:
1. MongoDB server is not running
2. Connection string is incorrect
3. Network firewall is blocking connection
4. MongoDB user credentials are wrong

Solution:
1. Verify MongoDB is accessible
2. Check connection string in .env file
3. Test connection manually using mongosh
```

### Port 3000 Already in Use
```powershell
# Edit .env file:
PORT=3001

# Restart H1MS and access at:
http://localhost:3001
```

---

## 🎯 For Hospital Operations Teams

### Daily Operations

1. **Start H1MS each morning**
   - Double-click start-h1ms.bat
   - Wait for "Server running at http://localhost:3000"

2. **Access from workstations**
   - Type in browser: http://HOSPITAL-PC:3000
   - Login with your hospital credentials

3. **Stop H1MS**
   - Press Ctrl+C in command window
   - Or close the window

### Accessing from Multiple Computers

H1MS can be accessed by any computer on your hospital network:

1. Find the computer name running H1MS
2. Access from any browser:
   ```
   http://COMPUTER-NAME:3000
   ```

---

## 🔐 Data Security Best Practices

1. **Strong Admin Password** (minimum 8 characters, mix of letters/numbers/symbols)
2. **Secure MongoDB** with strong credentials
3. **Network Firewall** - restrict access to hospital network only
4. **Regular Backups** - backup MongoDB database weekly
5. **Access Control** - assign appropriate staff roles
6. **Audit Logging** - monitor who accessed what and when

---

## 📞 Support

### Getting Help

1. **Check Documentation**
   - HOSPITAL-DEPLOYMENT-GUIDE.md
   - INSTALL-GUIDE.txt
   - POSTINSTALL.txt

2. **Run Diagnostics**
   ```powershell
   .\check-requirements.ps1
   ```

3. **Contact Support**
   - Email: support@h1ms.example.com
   - Include: Error message, Windows version, steps to reproduce

### Information for Support

When contacting support, provide:
- Hospital name and location
- Windows version (Run: `winver`)
- MongoDB type (Atlas or On-Premise)
- Exact error message
- Steps to reproduce the issue

---

## 🔄 Updating H1MS

1. **Backup current configuration**
   ```powershell
   Copy-Item ".env" ".env-backup"
   ```

2. **Uninstall old version**
   - Control Panel → Programs → Uninstall H1MS
   - Choose to keep configuration (.env)

3. **Install new version**
   - Run new H1MS-Setup-X.X.X.exe

4. **Restore configuration** (if needed)
   ```powershell
   Copy-Item ".env-backup" ".env"
   ```

5. **Restart H1MS**
   - Run start-h1ms.bat
   - Database will auto-update if needed

---

## 💡 Tips & Tricks

### Auto-Start with Windows
- Create shortcut to start-h1ms.bat
- Move to: C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
- H1MS will start when Windows boots

### Monitor Performance
- Check available RAM while H1MS is running
- Monitor database size in MongoDB
- Review application logs in command window

# Backup database:
mongodump --uri "mongodb://localhost:27017/h1ms" --out "backup-folder"

---

## ✅ Pre-Installation Checklist

Before installing H1MS:

- [ ] Windows 10 or later (64-bit)
- [ ] 4+ GB RAM available
- [ ] 500+ MB free disk space
- [ ] Node.js 18+ installed (or bundled included)
- [ ] MongoDB accessible (Atlas or On-Premise)
- [ ] Administrator access on the PC
- [ ] Network access to MongoDB verified
- [ ] Hospital IT approval obtained
- [ ] Data backup plan in place
- [ ] User training scheduled

---

## 📊 Features by Role

### 🩺 Doctors
- View patient medical history
- Create and manage prescriptions
- Generate medical reports
- Track patient vitals and medications

### 👨‍⚕️ Nurses
- Record patient vitals
- Manage medications
- Monitor ward patients
- Log nursing observations

### 💊 Pharmacists
- Manage medication inventory
- Process prescriptions
- Track dispensed medications
- Monitor stock levels

### 👩‍💼 Receptionists
- Schedule appointments
- Manage patient registration
- Process billing
- Send patient notifications

### 🔐 Administrators
- Manage user accounts
- Configure system settings
- View audit logs
- Manage hospital departments

---

## 📄 License

This software is provided under an End User License Agreement (EULA).
See [LICENSE.txt](./LICENSE.txt) for complete terms.

**Key Points:**
- Licensed to ONE hospital for internal use only
- Source code is NOT included or shared
- Your patient data remains under your control
- You are responsible for data security and compliance
- License terms must be accepted before use

---

## 🌟 Professional Features

- **Role-Based Access Control** - Secure user permissions
- **Complete Audit Trail** - Track all system changes
- **Real-Time Notifications** - WhatsApp/SMS alerts
- **Mobile-Friendly** - Works on tablets and phones
- **Scalable Architecture** - Grows with your hospital
- **RESTful API** - Integration with other systems
- **Multi-Language Support** - Available in multiple languages

---

## 🛠️ Deployment Checklist

### Pre-Installation
- [ ] System requirements verified
- [ ] MongoDB accessible
- [ ] Network tested
- [ ] Admin credentials prepared
- [ ] Backup plan documented

### Installation
- [ ] H1MS installed successfully
- [ ] Permissions verified
- [ ] Shortcuts created
- [ ] Documentation available

### Configuration
- [ ] MongoDB connected
- [ ] Administrator account created
- [ ] Staff accounts created
- [ ] Departments configured
- [ ] Roles assigned

### Testing
- [ ] Login successful
- [ ] Create test patient
- [ ] Create test appointment
- [ ] Generate report
- [ ] Access from different computer

### Go-Live
- [ ] Staff trained
- [ ] Support contacts communicated
- [ ] Backup verified
- [ ] Audit logging enabled
- [ ] Help desk prepared

---

## 🎓 Training Resources

H1MS includes built-in help and documentation for:

- **Administrators** - System configuration and user management
- **Doctors** - Patient record management and prescriptions
- **Nurses** - Vitals tracking and medication management
- **Pharmacists** - Inventory and prescription processing
- **Receptionists** - Appointments and billing

---

## 💬 FAQ

**Q: Can I use H1MS on Mac or Linux?**  
A: Currently Windows only. Contact us for other platforms.

**Q: How is patient data protected?**  
A: Data is stored in YOUR MongoDB database, never on external servers.

**Q: Can I run H1MS on multiple computers?**  
A: Yes, but all computers connect to the same MongoDB database.

**Q: What if I need to upgrade H1MS?**  
A: Backup your .env, uninstall, install new version, restore .env.

**Q: Is internet connection required?**  
A: No - H1MS runs entirely on your hospital network.

---

## 📞 Contact & Support

**Support Email:** support@h1ms.example.com  
**Website:** https://h1ms.example.com  
**Documentation:** https://docs.h1ms.example.com  
**Bug Reports:** bugs@h1ms.example.com  

---

## 🙏 Acknowledgments

H1MS is built with modern, open-source technologies:
- **Next.js** - Web framework
- **React** - UI library  
- **Node.js** - Runtime
- **Prisma** - Database ORM
- **MongoDB** - Database
- **NextAuth** - Authentication

---

**H1MS Hospital Management System v1.0.0**  
*Enterprise Edition - Production Ready*

**Remember:** Your patient data security is our priority. Follow best practices for secure healthcare deployments.

---

For detailed guides, see:
- [HOSPITAL-DEPLOYMENT-GUIDE.md](./HOSPITAL-DEPLOYMENT-GUIDE.md)
- [INSTALL-GUIDE.txt](./INSTALL-GUIDE.txt)
- [LICENSE.txt](./LICENSE.txt)
