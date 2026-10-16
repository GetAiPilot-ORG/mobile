# GetAIPilot (Mobile App)

Expo / React Native app.

## Build APK (Android)

Ek hi command:

```bash
./build-apk.sh
```

Script khud `JAVA_HOME`, `ANDROID_HOME` set karke release APK build karta hai.

Output:

```
android/app/build/outputs/apk/release/app-release.apk
```

Install (device USB debugging on):

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Manually (bina script ke)

```bash
export JAVA_HOME="$HOME/.local/opt/jdk-21.0.12.1+1"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
cd android && ./gradlew assembleRelease
```

> Pehli build slow (~15–25 min) — Gradle aur dependencies download hote hain. Uske baad fast.

## Build iOS

Linux pe possible nahi (Xcode/macOS chahiye). EAS cloud se:

```bash
npx eas build --platform ios --profile preview
```

## Dev

```bash
npm start          # Expo dev server
npm run android    # build + run on connected Android
npm run ios        # build + run (macOS only)
```
