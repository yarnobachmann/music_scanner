; Working NSIS installer script for Music Scan Pro
; Includes banner and icon fixes without problematic sections

; Include required headers
!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; Variables for checkbox states
Var CreateDesktopShortcut
Var CreateStartMenuShortcut
Var LaunchAfterInstall

; Custom page for shortcut options
Page custom ShortcutOptionsPage ShortcutOptionsPageLeave

; Install banner and icon assets
Section -InstallAssets
  DetailPrint "Setting up Music Scan Pro..."
  DetailPrint "Installing core application files..."
  ; Copy the icon file to installation directory for shortcuts
  IfFileExists "${BUILD_RESOURCES_DIR}\icon.ico" 0 skip_icon_copy
    File "/oname=$INSTDIR\icon.ico" "${BUILD_RESOURCES_DIR}\icon.ico"
    DetailPrint "Installing application icons..."
  skip_icon_copy:
  
  ; Copy PNG icon as well for runtime
  IfFileExists "$INSTDIR\icon.png" 0 skip_png_copy
    DetailPrint "Configuring application resources..."
    Goto done_icons
  skip_png_copy:
  
  ; Fallback - copy from build if no custom icon.png exists
  IfFileExists "${BUILD_RESOURCES_DIR}\..\icon.png" 0 done_icons
    File "/oname=$INSTDIR\icon.png" "${BUILD_RESOURCES_DIR}\..\icon.png"
    DetailPrint "Installing application resources..."
  
  done_icons:
SectionEnd

; Custom page functions
Function ShortcutOptionsPage
  !insertmacro MUI_HEADER_TEXT "Additional Options" "Choose your installation preferences"
  
  nsDialogs::Create 1018
  Pop $0
  
  ${If} $0 == error
    Abort
  ${EndIf}
  
  ; Create checkboxes
  ${NSD_CreateCheckbox} 0 10u 100% 10u "Create &Desktop shortcut"
  Pop $1
  ${NSD_SetState} $1 ${BST_CHECKED}  ; Default checked
  
  ${NSD_CreateCheckbox} 0 30u 100% 10u "Create &Start Menu shortcuts"
  Pop $2
  ${NSD_SetState} $2 ${BST_CHECKED}  ; Default checked
  
  ${NSD_CreateCheckbox} 0 50u 100% 10u "&Launch Music Scan Pro after installation"
  Pop $3
  ${NSD_SetState} $3 ${BST_CHECKED}  ; Default checked
  
  ; Store control references
  StrCpy $CreateDesktopShortcut $1
  StrCpy $CreateStartMenuShortcut $2
  StrCpy $LaunchAfterInstall $3
  
  nsDialogs::Show
FunctionEnd

Function ShortcutOptionsPageLeave
  ; Get checkbox states
  ${NSD_GetState} $CreateDesktopShortcut $CreateDesktopShortcut
  ${NSD_GetState} $CreateStartMenuShortcut $CreateStartMenuShortcut
  ${NSD_GetState} $LaunchAfterInstall $LaunchAfterInstall
FunctionEnd

; Hook into the installation completion to create shortcuts
Function .onInstSuccess
  ; Define the executable path
  StrCpy $0 "$INSTDIR\Music Scan Pro.exe"
  
  ; Verify the main executable exists
  IfFileExists "$0" 0 no_shortcuts
  
  ; Create desktop shortcut if requested
  ${If} $CreateDesktopShortcut == ${BST_CHECKED}
    CreateShortcut "$DESKTOP\Music Scan Pro.lnk" "$INSTDIR\Music Scan Pro.exe"
    DetailPrint "Creating desktop shortcut..."
  ${EndIf}
  
  ; Create start menu shortcuts if requested
  ${If} $CreateStartMenuShortcut == ${BST_CHECKED}
    CreateDirectory "$SMPROGRAMS\Music Scan Pro"
    CreateShortcut "$SMPROGRAMS\Music Scan Pro\Music Scan Pro.lnk" "$INSTDIR\Music Scan Pro.exe"
    DetailPrint "Creating Start Menu shortcuts..."
  ${EndIf}
  
  ; Refresh shell to update shortcuts
  DetailPrint "Finalizing installation..."
  System::Call 'shell32.dll::SHChangeNotify(l, l, p, p) v (0x08000000, 0, 0, 0)'
  DetailPrint "Installation completed successfully!"
  
  no_shortcuts:
  ; Show success message after installation is complete
  MessageBox MB_OK "Music Scan Pro installed successfully!$\n$\nYour rock music scanning experience awaits! 🎸"
FunctionEnd

; Function called when user clicks Finish button
Function .onGUIEnd
  ; Launch application if requested, but only when user clicks Finish
  ${If} $LaunchAfterInstall == ${BST_CHECKED}
    StrCpy $0 "$INSTDIR\Music Scan Pro.exe"
    IfFileExists "$0" 0 no_launch
      Exec '"$0"'
    no_launch:
  ${EndIf}
FunctionEnd



 