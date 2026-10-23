# Chronos Task Planner — Native Android

Chronos is a local-first student productivity planner and task tracker built natively with Kotlin and Jetpack Compose.

## Features

- **Local-First Architecture**: Persistent storage using Android Jetpack Room (SQLite). Data never leaves the device.
- **Accurate Exact Reminders**: Scheduled alarms using Android `AlarmManager` with `setExactAndAllowWhileIdle` and fallback support for `canScheduleExactAlarms`.
- **Actionable Notifications**: System notifications featuring instant **Complete** and **Snooze (10m)** actions with full background execution via `goAsync()`.
- **System Event Recovery**: Dynamic rescheduling of active task reminders across phone reboots (`ACTION_BOOT_COMPLETED`), application updates (`ACTION_MY_PACKAGE_REPLACED`), timezone changes (`ACTION_TIMEZONE_CHANGED`), and manual clock adjustments (`ACTION_TIME_CHANGED`).
- **Modern Jetpack Compose UI**: Clean dark-mode Material 3 theme (`#0B0C10`), intuitive priority chips, progress indicator, and accessible interactive touch targets.
- **Full Task Lifecycle**: Create, edit, toggle completion, and delete tasks with instant Undo support.

## Project Structure

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/com/chronos/tasktracker/
│           │   ├── ChronosApplication.kt
│           │   ├── MainActivity.kt
│           │   ├── data/
│           │   │   ├── local/
│           │   │   │   ├── AppDatabase.kt
│           │   │   │   └── TaskDao.kt
│           │   │   └── model/
│           │   │       └── TaskEntity.kt
│           │   ├── receiver/
│           │   │   ├── AlarmReceiver.kt
│           │   │   └── BootReceiver.kt
│           │   ├── scheduler/
│           │   │   └── AlarmScheduler.kt
│           │   └── ui/
│           │       ├── component/
│           │       │   ├── QuickAddDialog.kt
│           │       │   ├── TaskEditDialog.kt
│           │       │   └── TaskRow.kt
│           │       ├── screen/
│           │       │   └── MainAppScreen.kt
│           │       └── theme/
│           │           ├── Color.kt
│           │           ├── Theme.kt
│           │           └── Type.kt
│           └── res/
│               ├── drawable/
│               ├── mipmap-anydpi-v26/
│               ├── values/
│               └── xml/
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew
└── gradlew.bat
```

## Building in Android Studio

1. Open Android Studio (Ladybug / Iguana or later).
2. Select **Open** and choose the `android/` directory (or extracted `Chronos-Native-Android-Project`).
3. Allow Gradle to sync dependencies defined in `gradle/libs.versions.toml`.
4. Connect an Android device or launch an emulator (API 26+).
5. Click **Run** (`Shift + F10`) or run `./gradlew assembleDebug` in the terminal.
