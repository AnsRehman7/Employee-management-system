# StaffFlow Attendance

React Native attendance client for StaffFlow. It authenticates against Firebase, stores the session in the operating-system credential vault, loads active office geofences from the API, verifies local user presence with device biometrics, obtains a short-lived server challenge, and submits a location/accuracy-backed attendance scan.

## Configuration

Copy `.env.example` to `.env`:

```dotenv
STAFFFLOW_API_URL=https://your-api.example.com/api
STAFFFLOW_WEB_URL=https://your-web-app.example.com
FIREBASE_WEB_API_KEY=your-restricted-firebase-web-api-key
```

No Google Maps API key is required. GPS coordinates come from the device location provider; office coordinates and radius come from the authenticated StaffFlow API.

## Development

Prerequisites are Node.js 22, JDK 17, Android Studio/SDK for Android, and Xcode/CocoaPods for iOS.

```powershell
npm ci
npm start
```

In another terminal:

```powershell
npm run android
```

Run quality gates with:

```powershell
npm run lint
npm test -- --runInBand
cd android
.\gradlew.bat assembleDebug --no-daemon
```

## Attendance Behavior

- Read-only location checks do not consume an attendance challenge.
- A check-in/out obtains a fresh challenge immediately before submission.
- Network operations allow slow connections; attendance uses a longer timeout and one replay-safe retry.
- A repeated consumed challenge returns the matching scan when the original response was lost.
- Location services cannot be silently enabled by an app. StaffFlow requests permission, opens device settings when needed, and explains the required action.
- The server, not the phone, decides whether the scan meets office, accuracy, timing, and sequence constraints.

GPS and local biometrics are anti-abuse signals, not proof that a rooted device is trustworthy. Add Play Integrity and App Attest before using mobile attendance for high-stakes payroll decisions.

## Release Signing

Android release builds do not use the debug key. Configure `STAFFFLOW_UPLOAD_STORE_FILE`, `STAFFFLOW_UPLOAD_STORE_PASSWORD`, `STAFFFLOW_UPLOAD_KEY_ALIAS`, and `STAFFFLOW_UPLOAD_KEY_PASSWORD` as protected Gradle/CI secrets. Build an Android App Bundle with `./gradlew bundleRelease`.

The iOS bundle identifier is `com.staffflow.attendance`. Register Android and iOS apps in Firebase before adding native push; platform Firebase configuration files must remain outside public source control.
