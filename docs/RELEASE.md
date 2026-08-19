# Release packaging (vendor only — do NOT give hospitals your source repo)

## Build the installer

From the `H1MS` folder:

```powershell
# Standard release (hospital must install Node.js 18+)
npm run release

# Release with bundled Node.js (no separate Node install needed)
npm run release:full
```

Output in `dist/`:

| File | Purpose |
|------|---------|
| `H1MS-1.0.0/` | Compiled release folder |
| `H1MS-1.0.0-win64.zip` | ZIP to send to hospitals |
| `H1MS-Setup-1.0.0.exe` | Windows installer (requires [Inno Setup 6](https://jrsoftware.org/isinfo.php)) |

## What hospitals receive

- Compiled Next.js app (minified JavaScript only)
- No `.ts`, `.tsx`, or `src/` folder
- Source maps stripped
- Setup wizard for MongoDB + admin account
- `start-h1ms.bat` launcher

## What hospitals do NOT receive

- Your Git repository
- TypeScript source code
- Development dependencies
- Your `.env` / credentials

## Optional: build `.exe` installer

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php)
2. Run `npm run release`
3. The script auto-builds `dist/H1MS-Setup-1.0.0.exe`

## Code protection notes

Production builds compile TypeScript to minified JavaScript. This hides source from casual inspection but is not DRM — determined reverse-engineering is still possible. For stronger protection, consider:

- Hosting as a SaaS (you keep the server)
- License key validation in your build pipeline
- Legal license agreement with hospitals

## Per-hospital deployment

Each hospital needs its own MongoDB database. They run `setup-h1ms.ps1` once to connect their database and create their admin account.
