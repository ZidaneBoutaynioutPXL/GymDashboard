param([switch]$Debug)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:JAVA_HOME=(Get-ChildItem (Join-Path $PWD 'tmp/java') -Directory -Filter 'jdk-21*' | Select-Object -First 1).FullName
if(!$env:JAVA_HOME){throw 'JDK 21 is required in tmp/java.'}
$env:ANDROID_HOME=Join-Path $PWD 'tmp/android-sdk'
if(!(Test-Path "$env:ANDROID_HOME/platforms/android-36/android.jar")){throw 'Android SDK 36 is required in tmp/android-sdk.'}
$sdkPath=$env:ANDROID_HOME.Replace('\','/')
[IO.File]::WriteAllText((Join-Path $PWD 'android/local.properties'),"sdk.dir=$sdkPath`n")
npm run android:sync
if($LASTEXITCODE -ne 0){throw 'Web build failed'}
Push-Location android
try {
  if($Debug){./gradlew.bat assembleDebug --console=plain}else{./gradlew.bat assembleRelease --console=plain}
  if($LASTEXITCODE -ne 0){throw 'Android build failed'}
} finally {Pop-Location}
