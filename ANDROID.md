# Ascend for Android

The Android app bundles the React interface, fonts, reference datasets, character artwork, all 96 sound cues, and all eight final cinematics with embedded scene audio. It works without a server or internet connection. External source links still need internet.

## Install

Transfer `releases/Ascend-1.0.0.apk` to your phone and open it. Android may ask you to allow installation from the browser or file manager used to open the APK. The app supports Android 7 and later with an updated Android System WebView/Chrome. This is a directly installable personal APK.

Your existing browser data is separate from Android app storage. Export a backup from the browser and import that JSON file from **Settings & backup** inside the Android app. Android export opens the system share sheet so you can save or send the backup. No account or cloud synchronization is involved. Keep backups before uninstalling or clearing app storage.

## Build

Run `scripts/build_android.ps1 -Debug` for a test APK, or `scripts/build_android.ps1` for a signed release. The script builds the web app in Android mode (without a service worker) and synchronizes it into Capacitor before building. This workspace uses the SDK in `tmp/android-sdk` and JDK 21 in `tmp/java`; adjust those paths for another computer.

The release key is in the ignored `.android-signing` directory. Keep that directory private and backed up: future APK updates must use the same signing identity and application ID (`com.ascend.training`) to preserve installed app data. Do not include the key or passwords in downloads. Increase `versionCode` in `android/app/build.gradle` for subsequent releases.

## Android adaptations

- Android back closes a reveal or dialog, returns to the lift collection/overview, and minimizes the app at the root.
- The native wrapper handles system-bar and keyboard insets.
- Backgrounding pauses video and stops separate sound cues; a paused cinematic can be replayed.
- Backup export uses Android's file sharing rather than browser-only Blob downloads. Import uses the Android document picker.
- The native build packages media locally and does not register a web service worker.

`scripts/android-smoke.mjs` connects to a debug APK's WebView through ADB, tests with emulator networking disabled, and exercises data entry, all eight cinematics, audio decoding, navigation and backup round trips. Test artifacts are written to `tmp/android-test`.

Verified on an Android 16 emulator: six lift logs; all eight final videos with decoded soundtracks; character WebAudio playback; native Back; notes, programs, measurements and comparisons; saga completion and reward equipment; native backup sharing, import and reload persistence. `scripts/android-lifecycle.mjs` also checks decoded video pixels, background pause, foreground replay and data retention after an APK update. The signed release was separately installed and launched. These are emulator checks, not a test on your physical phone or an audible speaker check.

To publish the built release into the local download folder, run `python scripts/package_android.py` with `JAVA_HOME` pointing at the JDK. It checks the APK signature and every bundled character media file, then writes the APK, checksum and download page to `releases`.

