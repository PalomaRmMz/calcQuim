$adbAudit = 'C:/Android/Sdk/platform-tools/adb.exe'
$auditRemotePath='/sdcard/nexo-audit-window-'+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()+'.xml'
$auditDump = & $adbAudit -s emulator-5554 shell uiautomator dump $auditRemotePath
if ($LASTEXITCODE -ne 0 -or ($auditDump -join '') -notmatch 'dumped to:') { throw 'No se pudo leer emulador QA; no reutilizar XML anterior' }
$auditXml = & $adbAudit -s emulator-5554 shell cat $auditRemotePath
([xml]$auditXml).SelectNodes('//node[@text!="" or @content-desc!="" or @class="android.widget.EditText"]') | ForEach-Object {
 [pscustomobject]@{text=$_.text;desc=$_.'content-desc';bounds=$_.bounds;class=$_.class}
} | ConvertTo-Json -Depth 3 -Compress
