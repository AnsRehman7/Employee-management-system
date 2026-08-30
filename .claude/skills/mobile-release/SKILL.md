---
name: mobile-release
description: Building, signing, and sharing the DayMark Android APK from AttendenceApp/, and debugging a build that installs but misbehaves at runtime. Load when asked to build an APK, make a release build, share the app with employees, bump the app version, change ProGuard or Gradle config, or fix "Firebase authentication is not configured for this build". Triggers on APK, Android, release build, gradlew, ProGuard, signing, keystore, sideload, react-native-config.
---

# Android release builds

App lives in `AttendenceApp/`. `applicationId` is `com.staffflow.attendance` (predates the DayMark
rename — changing it is a **new app** to Android, not an upgrade, so existing installs won't update).

```bash
cd AttendenceApp/android
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

Those are separate commands, not one. On Windows use `./gradlew` from Git Bash or `gradlew.bat` from
PowerShell. Sideloading requires "Install unknown apps" for whatever app receives the file — WhatsApp
compresses unknown types, so Drive or a direct link is more reliable.

## The ProGuard trap

**Symptom:** debug builds work; the release APK installs and launches but reports
*"Firebase authentication is not configured for this build"* or silently loses its API URL.

**Cause:** `react-native-config` reads values by **reflection** on the generated `BuildConfig` class.
The values are compiled in correctly — verify by inspecting `BuildConfig.java` — and then destroyed
*afterward*, when minification renames the class the reflection is looking for.

**Fix** is in `android/app/proguard-rules.pro`, and must stay there:

```
-keep class com.staffflow.attendance.BuildConfig { *; }
-keep class com.lugg.RNCConfig.** { *; }
-keepclassmembers class **.R$string { public static <fields>; }
```

The generalizable rule: **anything reached by reflection needs an explicit `-keep`.** If a release
build loses config that debug has, suspect minification before suspecting the config.

Config keys currently read: `FIREBASE_WEB_API_KEY`, `STAFFFLOW_API_URL`, `STAFFFLOW_WEB_URL`.
Adding a key means adding it to the `.env` file *and* confirming it survives a release build — check
the running app, not `BuildConfig.java`.

## Before sharing a build

- **Bump `versionCode`** in `android/app/build.gradle`. Android refuses to install an APK whose
  `versionCode` is not higher than what's installed, and the failure message is unhelpful.
- **Use a real release keystore.** `buildTypes.release` currently falls back to the debug signing
  config in places — a debug-signed APK cannot be upgraded in place by a later properly-signed one,
  so this is worth fixing *before* the first wide share, not after.
- **Test the release APK itself**, not the debug build. Everything in this file only goes wrong in
  release.
- `cd AttendenceApp && npm test && npm run lint`.
