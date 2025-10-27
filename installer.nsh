!include "FileFunc.nsh"

!macro customInit
  DetailPrint "=== Pre-installation Check ==="

  ; 1. 关闭运行中的程序
  DetailPrint "Checking for running processes..."
  nsExec::ExecToStack 'taskkill /F /IM cmdd_js.exe /T'
  Pop $0
  Pop $1
  Sleep 1500

  ; 2. 检查是否存在用户数据
  ${If} ${FileExists} "$APPDATA\cmdd_js\*.*"
  ${OrIf} ${FileExists} "$LOCALAPPDATA\cmdd_js\*.*"
    ; 询问用户是否删除
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "检测到旧版本的用户数据。$\n$\n是否删除所有旧数据（包括数据库和配置）？$\n$\n• 点击'是': 完全清除旧数据，全新安装$\n• 点击'否': 保留数据（可能导致兼容性问题）" \
      IDYES RemoveData IDNO KeepData

    RemoveData:
      DetailPrint "User chose to remove all data"
      RMDir /r "$APPDATA\cmdd_js"
      RMDir /r "$LOCALAPPDATA\cmdd_js"
      RMDir /r "$LOCALAPPDATA\cmdd_js"
      DetailPrint "All user data removed"
      Goto EndChoice

    KeepData:
      DetailPrint "User chose to keep data"

    EndChoice:
  ${Else}
    DetailPrint "No existing user data found"
  ${EndIf}

  DetailPrint "=== Cleanup Complete ==="
!macroend

!macro customInstall
  DetailPrint "Installation completed successfully"
!macroend

!macro customUnInstall
  ; 卸载时也询问
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "是否同时删除所有用户数据？" \
    IDYES RemoveUninstallData IDNO KeepUninstallData

  RemoveUninstallData:
    DetailPrint "Removing user data..."
    RMDir /r "$APPDATA\cmdd_js"
    RMDir /r "$LOCALAPPDATA\cmdd_js-updater"
    DetailPrint "User data removed"
    Goto EndUninstall

  KeepUninstallData:
    DetailPrint "User data preserved"

  EndUninstall:
!macroend
