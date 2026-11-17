param([string]$TapDesc,[string]$TapText,[string]$InputText,[switch]$ReplaceInput)
if($InputText -and $InputText -notmatch '^[A-Za-z0-9%._:/-]+$'){throw 'Entrada ADB no segura: usar ASCII simple y %s para espacios, sin metacaracteres de shell'}
$adbAudit='C:/Android/Sdk/platform-tools/adb.exe'
$auditRemotePath='/sdcard/nexo-audit-action-'+[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()+'.xml'
$auditDump=& $adbAudit -s emulator-5554 shell uiautomator dump $auditRemotePath
if($LASTEXITCODE -ne 0 -or ($auditDump -join '') -notmatch 'dumped to:'){throw 'No se pudo observar emulador QA; no reutilizar XML anterior'}
$auditXml=& $adbAudit -s emulator-5554 shell cat $auditRemotePath
$auditNodes=([xml]$auditXml).SelectNodes('//node')
if($TapDesc){$auditTargets=@($auditNodes | Where-Object {$_.'content-desc' -eq $TapDesc -and $_.enabled -eq 'true'})}
elseif($TapText){$auditTargets=@($auditNodes | Where-Object {$_.text -ceq $TapText -and $_.enabled -eq 'true'})}
else{throw 'Especifica texto o descripción observados'}
if($auditTargets.Count -ne 1){throw "Se requieren 1 destino, encontrados $($auditTargets.Count)"}
$auditBounds=[regex]::Match($auditTargets[0].bounds,'\[(\d+),(\d+)\]\[(\d+),(\d+)\]')
if(-not $auditBounds.Success -or [int]$auditBounds.Groups[3].Value -le [int]$auditBounds.Groups[1].Value -or [int]$auditBounds.Groups[4].Value -le [int]$auditBounds.Groups[2].Value){throw 'Destino fuera de la zona visible: desplazar y observar de nuevo'}
$auditX=([int]$auditBounds.Groups[1].Value+[int]$auditBounds.Groups[3].Value)/2
$auditY=([int]$auditBounds.Groups[2].Value+[int]$auditBounds.Groups[4].Value)/2
& $adbAudit -s emulator-5554 shell input tap ([int]$auditX) ([int]$auditY)
if($ReplaceInput){if($auditTargets[0].class -ne 'android.widget.EditText'){throw 'Reemplazo requiere un campo de texto observado'};$auditDeleteKeys=@(123)+@(1..([Math]::Max(1,$auditTargets[0].text.Length)) | ForEach-Object {67});& $adbAudit -s emulator-5554 shell input keyevent @auditDeleteKeys}
if($InputText){& $adbAudit -s emulator-5554 shell input text $InputText}
& (Join-Path $PSScriptRoot 'android-observe.ps1')
