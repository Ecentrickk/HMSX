; H1MS Hospital Management System - Windows Enterprise Installer
; Compiled with Inno Setup 6: https://jrsoftware.org/isdl.php
; Build command: scripts\build-release.ps1 -BundleNode (includes Node.js)
; Build command: scripts\build-release.ps1 (requires Node.js installed)

#define MyAppName "H1MS Hospital Management System"
#define MyAppNameShort "H1MS"
#define MyAppPublisher "H1MS"
#define MyAppURL "https://h1ms.example.com"
#define MyAppSupportURL "https://h1ms.example.com/support"
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif
#ifndef ReleaseDir
  #define ReleaseDir "..\dist\H1MS-1.0.0"
#endif

[Setup]
AppId={{A7B3C9D1-E5F2-4A8B-9C0D-1E2F3A4B5C6D}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppSupportURL}
AppComments="Enterprise Hospital Management System"
DefaultDirName={autopf}\{#MyAppNameShort}
DefaultGroupName={#MyAppNameShort}
DisableProgramGroupPage=yes
DisableReadyMemo=yes
DisableFinishedPage=no
ShowLanguageDialog=no
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=H1MS-Setup-{#MyAppVersion}-Enterprise
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName}
VersionInfoTextVersion={#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
WizardImageFile=installer\wizard-image.bmp
WizardSmallImageFile=installer\wizard-small-image.bmp
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\app\icon.ico
SetupIconFile=installer\setup-icon.ico
LicenseFile=LICENSE.txt
InfoBeforeFile=installer\PREINSTALL.txt
InfoAfterFile=installer\POSTINSTALL.txt

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel1=Welcome to the [MyAppName] Setup Wizard
WelcomeLabel2=This will install [MyAppName] Enterprise Edition on your hospital network.%n%nIMPORTANT: Your source code is NOT included in this package.
ReadyLabel=H1MS is ready to be installed. Click Install to continue.
FinishedHeadingText=Setup Complete
FinishedLabelFile=
FinishedLabel=Installation complete. The Setup Wizard will now show you how to configure H1MS for your hospital.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "setupfirst"; Description: "Run initial setup wizard (configure database & create admin)"; GroupDescription: "Post-installation:"; Flags: checkedonce

[Files]
; Main application
Source: "{#ReleaseDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Documentation
Source: "PREINSTALL.txt"; DestDir: "{app}"
Source: "POSTINSTALL.txt"; DestDir: "{app}"
Source: "LICENSE.txt"; DestDir: "{app}"

[Icons]
Name: "{group}\{#MyAppNameShort}"; Filename: "{app}\start-h1ms.bat"; WorkingDir: "{app}"; Comment: "Start the H1MS Hospital Management System"
Name: "{group}\Initial Setup Wizard"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\setup-h1ms.ps1"""; WorkingDir: "{app}"; Comment: "Configure database and create administrator account"; IconIndex: 0
Name: "{group}\Installation Guide"; Filename: "notepad.exe"; Parameters: "{app}\INSTALL-GUIDE.txt"; Comment: "View installation documentation"
Name: "{group}\{cm:ProgramOnTheWeb,{#MyAppName}}"; Filename: "{#MyAppURL}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppNameShort}"; Filename: "{app}\start-h1ms.bat"; Tasks: desktopicon; WorkingDir: "{app}"; Comment: "Start H1MS Hospital Management System"
Name: "{autostartup}\H1MS-Service"; Filename: "{app}\start-h1ms.bat"; WorkingDir: "{app}"; Comment: "H1MS will start when Windows starts"; Tasks: ""; Flags: createonlyiffileexists

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\setup-h1ms.ps1"""; Description: "Configure H1MS (Database Setup & Create Admin Account)"; Flags: postinstall runascurrentuser; Tasks: setupfirst
Filename: "{app}\start-h1ms.bat"; Description: "Start H1MS now"; Flags: postinstall nowait unchecked; Tasks: ""

[UninstallDelete]
Type: filesandordirs; Name: "{app}\app\.env"
Type: filesandordirs; Name: "{app}\.env"
Type: filesandordirs; Name: "{app}\app\node_modules"
Type: filesandordirs; Name: "{app}\tools\node_modules"

[Code]
procedure InitializeWizard();
begin
  WizardForm.LicenseAcceptedRadio.Checked := False;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  if not FileExists(ExpandConstant('{#ReleaseDir}\app\server.js')) then
  begin
    MsgBox('ERROR: Application files are missing or corrupted.' + #13#13 +
      'Rebuild the release package with: npm run release', mbCriticalError, MB_OK);
    Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstallFinished then
  begin
    MsgBox('Installation successful!'#13#13 +
      'Next: Run "Initial Setup Wizard" from the Start Menu to configure your hospital database.',
      mbInformation, MB_OK);
  end;
end;
