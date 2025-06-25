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
  ; Copy the icon file to installation directory for shortcuts
  IfFileExists "${BUILD_RESOURCES_DIR}\icon.ico" 0 try_app_ico
    File "/oname=$INSTDIR\icon.ico" "${BUILD_RESOURCES_DIR}\icon.ico"
    DetailPrint "Installing custom icon from build resources..."
    Goto icon_done
  try_app_ico:
  ; Try to copy icon from app directory if build resources don't have it
  IfFileExists "$INSTDIR\build\icon.ico" 0 skip_icon_copy
    CopyFiles "$INSTDIR\build\icon.ico" "$INSTDIR\icon.ico"
    DetailPrint "Installing custom icon from app..."
    Goto icon_done
  skip_icon_copy:
    DetailPrint "No custom icon found, using executable icon"
  icon_done:
  
  ; Copy PNG icon as well for runtime
  IfFileExists "$INSTDIR\icon.png" 0 skip_png_copy
    DetailPrint "Using custom icon.png from app"
    Goto done_icons
  skip_png_copy:
  
  ; Fallback - copy from build if no custom icon.png exists
  IfFileExists "${BUILD_RESOURCES_DIR}\..\icon.png" 0 done_icons
    File "/oname=$INSTDIR\icon.png" "${BUILD_RESOURCES_DIR}\..\icon.png"
    DetailPrint "Installing fallback PNG icon..."
  
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
    ; Try multiple icon locations for desktop shortcut
    IfFileExists "$INSTDIR\icon.ico" 0 try_exe_icon
      CreateShortcut "$DESKTOP\Music Scan Pro.lnk" "$0" "" "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL
      DetailPrint "Created desktop shortcut with ico file"
      Goto desktop_done
    try_exe_icon:
      ; Use the executable's embedded icon as fallback
      CreateShortcut "$DESKTOP\Music Scan Pro.lnk" "$0" "" "$0" 0 SW_SHOWNORMAL
      DetailPrint "Created desktop shortcut with exe icon"
    desktop_done:
  ${EndIf}
  
  ; Create start menu shortcuts if requested
  ${If} $CreateStartMenuShortcut == ${BST_CHECKED}
    CreateDirectory "$SMPROGRAMS\Music Scan Pro"
    IfFileExists "$INSTDIR\icon.ico" 0 startmenu_try_exe
      CreateShortcut "$SMPROGRAMS\Music Scan Pro\Music Scan Pro.lnk" "$0" "" "$INSTDIR\icon.ico" 0 SW_SHOWNORMAL
      DetailPrint "Created start menu shortcut with ico file"
      Goto startmenu_done
    startmenu_try_exe:
      ; Use the executable's embedded icon as fallback
      CreateShortcut "$SMPROGRAMS\Music Scan Pro\Music Scan Pro.lnk" "$0" "" "$0" 0 SW_SHOWNORMAL
      DetailPrint "Created start menu shortcut with exe icon"
    startmenu_done:
  ${EndIf}
  
  ; Refresh shell to update shortcuts
  System::Call 'shell32.dll::SHChangeNotify(l, l, p, p) v (0x08000000, 0, 0, 0)'
  
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



 