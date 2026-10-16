#!/usr/bin/env bash
set -e

JDK=$(ls -d "$HOME"/.local/opt/jdk-21* 2>/dev/null | head -1)
export JAVA_HOME="${JAVA_HOME:-$JDK}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

if [ -z "$JAVA_HOME" ] || [ ! -x "$JAVA_HOME/bin/java" ]; then
    echo "ERROR: JDK not found. Set JAVA_HOME or install a JDK." >&2
    exit 1
fi

cd "$(dirname "$0")/android"
./gradlew assembleRelease

echo
echo "APK ready: $(pwd)/app/build/outputs/apk/release/app-release.apk"
