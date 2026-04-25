# Android Release Signing

Use a real release keystore for distributable APK builds.
Without `client/android/key.properties`, Gradle now builds an unsigned release APK for local smoke checks.

## Local files

Keep these local only. They are ignored by git:

- `android/key.properties`
- `android/app/*.keystore`
- `android/app/*.jks`

## Required `key.properties`

Create `client/android/key.properties` with:

```properties
storeFile=app/tindai-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=tindai-release
keyPassword=YOUR_KEY_PASSWORD
```

`storeFile` is resolved relative to `client/android/`.

## Build APK

From `client/android`:

```powershell
.\gradlew assembleRelease
```

APK output when `android/key.properties` exists:

`client/android/app/build/outputs/apk/release/app-release.apk`

APK output when `android/key.properties` is missing:

`client/android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Notes

- Release builds use the local keystore from `android/key.properties` when it is available.
- Unsigned release APKs are for local validation only. Install or distribute a release build only after signing it with a real keystore.
- The Expo asset bundle is limited to `src/assets/*` so design scratch files are not packed into the distributable APK.
