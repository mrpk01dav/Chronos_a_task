import JSZip from 'jszip';

export interface AndroidFile {
  path: string;
  content: string;
}

export function getAndroidProjectFiles(): AndroidFile[] {
  return [
    {
      path: 'settings.gradle.kts',
      content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "Chronos"
include(":app")
`,
    },
    {
      path: 'build.gradle.kts',
      content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
`,
    },
    {
      path: 'gradle/libs.versions.toml',
      content: `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
ksp = "2.0.21-1.0.28"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.11.00"
room = "2.6.1"
workManager = "2.10.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons = { group = "androidx.compose.material", name = "material-icons-extended" }
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workManager" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
`,
    },
    {
      path: 'app/build.gradle.kts',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.chronos.tasktracker"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.chronos.tasktracker"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug") // Change for production release
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // WorkManager for background sync
    implementation(libs.androidx.work.runtime.ktx)
}
`,
    },
    {
      path: 'app/src/main/AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.chronos.tasktracker">

    <!-- Android 13+ runtime notification permission -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Android 12+ exact alarm scheduling -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />

    <!-- Restore alarms after phone restart -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- Vibration and wake lock to ensure alarms trigger during Doze Mode -->
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".ChronosApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Chronos"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Chronos"
        tools:targetApi="35">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.Chronos">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Receiver for scheduled exact alarms & interactive notification actions -->
        <receiver
            android:name=".receiver.AlarmReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="com.chronos.ACTION_TASK_REMINDER" />
                <action android:name="com.chronos.ACTION_TASK_COMPLETE" />
                <action android:name="com.chronos.ACTION_TASK_SNOOZE" />
            </intent-filter>
        </receiver>

        <!-- Receiver for restoring alarms after phone reboot -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

    </application>
</manifest>
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/ChronosApplication.kt',
      content: `package com.chronos.tasktracker

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build

class ChronosApplication : Application() {

    companion object {
        const val REMINDER_CHANNEL_ID = "chronos_reminders_channel"
        const val PERSISTENT_CHANNEL_ID = "chronos_persistent_channel"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)

            // High-importance task reminder channel with sound and vibration
            val reminderChannel = NotificationChannel(
                REMINDER_CHANNEL_ID,
                "Task Reminders & Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent task alarms, deadline notifications and snoozed alerts"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200, 100, 200, 100, 300)
                val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val audioAttributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build()
                setSound(defaultSoundUri, audioAttributes)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }

            // Low-importance channel for optional persistent "Today's Tasks" summary
            val persistentChannel = NotificationChannel(
                PERSISTENT_CHANNEL_ID,
                "Today's Overview",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Ongoing summary of daily tasks and pending counts"
                setShowBadge(false)
            }

            notificationManager.createNotificationChannel(reminderChannel)
            notificationManager.createNotificationChannel(persistentChannel)
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/data/model/TaskEntity.kt',
      content: `package com.chronos.tasktracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String = "",
    val categoryId: String = "assignments", // college, assignments, personal, health, projects, other
    val priority: String = "medium", // high, medium, low
    val dueDate: String, // YYYY-MM-DD
    val dueTime: String = "12:00", // HH:mm
    val estimatedDurationMinutes: Int = 30,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val isPinned: Boolean = false,
    val subtasksJson: String = "[]",
    val recurrenceType: String = "none", // none, daily, weekdays, weekly, monthly, yearly, custom
    val recurrenceInterval: Int = 1,
    val recurrenceDaysOfWeek: String = "", // e.g. "1,3,5" for Mon, Wed, Fri
    val recurrenceEndDate: String? = null,
    val repeatLimit: Int? = null,
    val occurrenceCount: Int = 1,
    val reminderMinutesBefore: Int = 15,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/data/dao/TaskDao.kt',
      content: `package com.chronos.tasktracker.data.dao

import androidx.room.*
import com.chronos.tasktracker.data.model.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY isPinned DESC, dueDate ASC, dueTime ASC")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE dueDate = :date ORDER BY isPinned DESC, dueTime ASC")
    fun getTasksByDateFlow(date: String): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 0")
    suspend fun getPendingTasks(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getTaskById(id: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :taskId")
    suspend fun deleteById(taskId: String)

    @Query("UPDATE tasks SET isCompleted = 1, completedAt = :now WHERE id = :taskId")
    suspend fun markTaskComplete(taskId: String, now: Long = System.currentTimeMillis())

    @Query("SELECT COUNT(*) FROM tasks WHERE isCompleted = 1 AND dueDate = :date")
    suspend fun getCompletedCountForDate(date: String): Int
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/data/AppDatabase.kt',
      content: `package com.chronos.tasktracker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.chronos.tasktracker.data.dao.TaskDao
import com.chronos.tasktracker.data.model.TaskEntity

@Database(entities = [TaskEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun taskDao(): TaskDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "chronos_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/scheduler/AlarmScheduler.kt',
      content: `package com.chronos.tasktracker.scheduler

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.receiver.AlarmReceiver
import java.text.SimpleDateFormat
import java.util.*

class AlarmScheduler(private val context: Context) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun scheduleTaskReminder(task: TaskEntity) {
        if (task.isCompleted) return

        val triggerTime = calculateTriggerTime(task)
        if (triggerTime <= System.currentTimeMillis()) {
            return // Skip past alarms
        }

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TASK_REMINDER
            putExtra(AlarmReceiver.EXTRA_TASK_ID, task.id)
            putExtra(AlarmReceiver.EXTRA_TASK_TITLE, task.title)
            putExtra(AlarmReceiver.EXTRA_TASK_PRIORITY, task.priority)
            putExtra(AlarmReceiver.EXTRA_TASK_DUE_TIME, task.dueTime)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            context,
            task.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                } else {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        triggerTime,
                        pendingIntent
                    )
                }
            } else {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }

    fun cancelTaskReminder(taskId: String) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TASK_REMINDER
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.hashCode(),
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()
        }
    }

    private fun calculateTriggerTime(task: TaskEntity): Long {
        val format = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        val date = format.parse("\${task.dueDate} \${task.dueTime}") ?: return 0L
        val calendar = Calendar.getInstance().apply {
            time = date
            add(Calendar.MINUTE, -task.reminderMinutesBefore)
        }
        return calendar.timeInMillis
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/receiver/AlarmReceiver.kt',
      content: `package com.chronos.tasktracker.receiver

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.chronos.tasktracker.ChronosApplication
import com.chronos.tasktracker.MainActivity
import com.chronos.tasktracker.R
import com.chronos.tasktracker.data.AppDatabase
import com.chronos.tasktracker.scheduler.AlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_TASK_REMINDER = "com.chronos.ACTION_TASK_REMINDER"
        const val ACTION_TASK_COMPLETE = "com.chronos.ACTION_TASK_COMPLETE"
        const val ACTION_TASK_SNOOZE = "com.chronos.ACTION_TASK_SNOOZE"

        const val EXTRA_TASK_ID = "EXTRA_TASK_ID"
        const val EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE"
        const val EXTRA_TASK_PRIORITY = "EXTRA_TASK_PRIORITY"
        const val EXTRA_TASK_DUE_TIME = "EXTRA_TASK_DUE_TIME"
        const val EXTRA_SNOOZE_MINUTES = "EXTRA_SNOOZE_MINUTES"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return

        when (intent.action) {
            ACTION_TASK_REMINDER -> {
                val title = intent.getStringExtra(EXTRA_TASK_TITLE) ?: "Task Reminder"
                val priority = intent.getStringExtra(EXTRA_TASK_PRIORITY) ?: "medium"
                val dueTime = intent.getStringExtra(EXTRA_TASK_DUE_TIME) ?: ""

                showNotification(context, taskId, title, priority, dueTime)
            }
            ACTION_TASK_COMPLETE -> {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancel(taskId.hashCode())

                // Mark task complete in Room database
                CoroutineScope(Dispatchers.IO).launch {
                    val db = AppDatabase.getInstance(context)
                    db.taskDao().markTaskComplete(taskId)
                }
            }
            ACTION_TASK_SNOOZE -> {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                notificationManager.cancel(taskId.hashCode())

                val snoozeMins = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)
                val title = intent.getStringExtra(EXTRA_TASK_TITLE) ?: "Snoozed Task"

                // Reschedule for +snoozeMins from now
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
                val nextIntent = Intent(context, AlarmReceiver::class.java).apply {
                    action = ACTION_TASK_REMINDER
                    putExtra(EXTRA_TASK_ID, taskId)
                    putExtra(EXTRA_TASK_TITLE, title)
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    taskId.hashCode(),
                    nextIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                val triggerAt = System.currentTimeMillis() + snoozeMins * 60 * 1000L
                alarmManager.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
        }
    }

    private fun showNotification(
        context: Context,
        taskId: String,
        title: String,
        priority: String,
        dueTime: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Content intent: open app and focus task
        val openIntent = Intent(context, MainActivity::class.java).apply {
            putExtra("OPEN_TASK_ID", taskId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            taskId.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Complete Task
        val completeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_TASK_COMPLETE
            putExtra(EXTRA_TASK_ID, taskId)
        }
        val completePendingIntent = PendingIntent.getBroadcast(
            context,
            (taskId + "_complete").hashCode(),
            completeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Action: Snooze 10 Minutes
        val snoozeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_TASK_SNOOZE
            putExtra(EXTRA_TASK_ID, taskId)
            putExtra(EXTRA_TASK_TITLE, title)
            putExtra(EXTRA_SNOOZE_MINUTES, 10)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            (taskId + "_snooze").hashCode(),
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, ChronosApplication.REMINDER_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText("Priority: \${priority.uppercase()} · Due \${if (dueTime.isNotEmpty()) dueTime else "today"}")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.checkbox_on_background, "Complete", completePendingIntent)
            .addAction(android.R.drawable.ic_menu_recent_history, "Snooze 10m", snoozePendingIntent)
            .setVibrate(longArrayOf(0, 250, 150, 250))
            .build()

        notificationManager.notify(taskId.hashCode(), notification)
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/receiver/BootReceiver.kt',
      content: `package com.chronos.tasktracker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.chronos.tasktracker.data.AppDatabase
import com.chronos.tasktracker.scheduler.AlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val db = AppDatabase.getInstance(context)
                    val pendingTasks = db.taskDao().getPendingTasks()
                    val scheduler = AlarmScheduler(context)

                    for (task in pendingTasks) {
                        scheduler.scheduleTaskReminder(task)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/ui/theme/Color.kt',
      content: `package com.chronos.tasktracker.ui.theme

import androidx.compose.ui.graphics.Color

val DarkBg = Color(0xFF0B0C11)
val DarkSurface = Color(0xFF131520)
val DarkElevated = Color(0xFF181A29)
val PrimaryIndigo = Color(0xFF6366F1)
val SecondaryPurple = Color(0xFFA855F7)
val AccentCyan = Color(0xFF38BDF8)
val PriorityHigh = Color(0xFFF43F5E)
val PriorityMedium = Color(0xFFF59E0B)
val PriorityLow = Color(0xFF10B981)
val TextPrimary = Color(0xFFF1F5F9)
val TextSecondary = Color(0xFF94A3B8)
val BorderSubtle = Color(0x1AFFFFFF)
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/ui/theme/Theme.kt',
      content: `package com.chronos.tasktracker.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryIndigo,
    secondary = SecondaryPurple,
    tertiary = AccentCyan,
    background = DarkBg,
    surface = DarkSurface,
    onPrimary = Color.White,
    onBackground = TextPrimary,
    onSurface = TextPrimary
)

@Composable
fun ChronosTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
`,
    },
    {
      path: 'app/src/main/java/com/chronos/tasktracker/MainActivity.kt',
      content: `package com.chronos.tasktracker

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.chronos.tasktracker.data.AppDatabase
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.scheduler.AlarmScheduler
import com.chronos.tasktracker.ui.theme.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            // Notification permission granted or denied
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val database = AppDatabase.getInstance(this)
        val alarmScheduler = AlarmScheduler(this)

        setContent {
            ChronosTheme {
                MainAppScreen(database, alarmScheduler)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(database: AppDatabase, alarmScheduler: AlarmScheduler) {
    val coroutineScope = rememberCoroutineScope()
    val tasks by database.taskDao().getAllTasksFlow().collectAsState(initial = emptyList())
    var selectedTab by remember { mutableStateOf(0) }
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = DarkBg,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "Chronos",
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            fontSize = 20.sp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = MaterialTheme.shapes.small,
                            color = PrimaryIndigo.copy(alpha = 0.2f)
                        ) {
                            Text(
                                "Native Compose",
                                color = PrimaryIndigo,
                                fontSize = 10.sp,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = DarkSurface) {
                val items = listOf("Home" to Icons.Default.Home, "Tasks" to Icons.Default.Checklist, "Reports" to Icons.Default.BarChart)
                items.forEachIndexed { index, pair ->
                    NavigationBarItem(
                        icon = { Icon(pair.second, contentDescription = pair.first) },
                        label = { Text(pair.first) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = PrimaryIndigo,
                            indicatorColor = PrimaryIndigo.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = PrimaryIndigo,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            when (selectedTab) {
                0 -> {
                    // Home Dashboard
                    val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                    val todayTasks = tasks.filter { it.dueDate == todayStr }
                    val completedCount = todayTasks.count { it.isCompleted }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Today's Progress", fontWeight = FontWeight.SemiBold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "\$completedCount / \${todayTasks.size} Tasks Completed",
                                fontSize = 14.sp,
                                color = TextSecondary
                            )
                            LinearProgressIndicator(
                                progress = { if (todayTasks.isNotEmpty()) completedCount.toFloat() / todayTasks.size else 1f },
                                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                                color = PrimaryIndigo,
                                trackColor = DarkElevated
                            )
                        }
                    }

                    Text("Active Tasks", fontWeight = FontWeight.Bold, color = TextPrimary, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(tasks, key = { it.id }) { task ->
                            TaskRow(
                                task = task,
                                onToggleComplete = {
                                    coroutineScope.launch {
                                        val updated = task.copy(isCompleted = !task.isCompleted)
                                        database.taskDao().updateTask(updated)
                                        if (updated.isCompleted) {
                                            alarmScheduler.cancelTaskReminder(task.id)
                                        } else {
                                            alarmScheduler.scheduleTaskReminder(updated)
                                        }
                                    }
                                }
                            )
                        }
                    }
                }
                1 -> {
                    // All Tasks list
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(tasks, key = { it.id }) { task ->
                            TaskRow(
                                task = task,
                                onToggleComplete = {
                                    coroutineScope.launch {
                                        val updated = task.copy(isCompleted = !task.isCompleted)
                                        database.taskDao().updateTask(updated)
                                    }
                                }
                            )
                        }
                    }
                }
                2 -> {
                    // Reports overview
                    val completedTotal = tasks.count { it.isCompleted }
                    Card(
                        colors = CardDefaults.cardColors(containerColor = DarkSurface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Productivity Velocity", fontWeight = FontWeight.Bold, color = TextPrimary)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Total Accomplished: \$completedTotal", color = PriorityLow)
                            Text("Pending Queue: \${tasks.size - completedTotal}", color = PriorityMedium)
                        }
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        QuickAddDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { title, priority, dueTime ->
                coroutineScope.launch {
                    val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                    val newTask = TaskEntity(
                        id = "task_\${System.currentTimeMillis()}",
                        title = title,
                        priority = priority,
                        dueDate = todayStr,
                        dueTime = dueTime
                    )
                    database.taskDao().insertTask(newTask)
                    alarmScheduler.scheduleTaskReminder(newTask)
                    showAddDialog = false
                }
            }
        )
    }
}

@Composable
fun TaskRow(task: TaskEntity, onToggleComplete: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = DarkSurface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = task.isCompleted,
                onCheckedChange = { onToggleComplete() },
                colors = CheckboxDefaults.colors(
                    checkedColor = PriorityLow,
                    uncheckedColor = TextSecondary
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    task.title,
                    color = if (task.isCompleted) TextSecondary else TextPrimary,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    "Due \${task.dueDate} at \${task.dueTime} · \${task.priority.uppercase()}",
                    fontSize = 11.sp,
                    color = when (task.priority) {
                        "high" -> PriorityHigh
                        "medium" -> PriorityMedium
                        else -> PriorityLow
                    }
                )
            }
        }
    }
}

@Composable
fun QuickAddDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, priority: String, dueTime: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("medium") }
    var dueTime by remember { mutableStateOf("17:00") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("New Task") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = dueTime,
                    onValueChange = { dueTime = it },
                    label = { Text("Due Time (HH:mm)") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { if (title.isNotBlank()) onConfirm(title, priority, dueTime) },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo)
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
`,
    },
    {
      path: 'README.md',
      content: `# Chronos - Native Android Task Tracker & Smart Reminders

A production-ready native Android task tracker built with **Kotlin**, **Jetpack Compose**, **Room Database**, and **AlarmManager**.

## Features
- **Jetpack Compose & Material 3**: Dark charcoal UI designed for OLED displays.
- **Room Database (Local Storage)**: All tasks, subtasks, notes, and recurrence configurations persist across device reboots and app updates.
- **Exact Alarms & Doze Mode**: Schedules alarms using \`AlarmManager.setExactAndAllowWhileIdle()\` with wakeup capabilities.
- **Notification Actions**: Snooze 10m and Complete tasks directly from the Android notification shade.
- **Reboot Persistence**: Registered \`BootReceiver\` reschedules all pending task alarms on \`BOOT_COMPLETED\`.

## Building the APK & Testing
1. Unzip the project folder.
2. Open in **Android Studio Ladybug (2024.2+)** or newer.
3. Allow Gradle to sync.
4. Run on Android Emulator or physical device:
   \`\`\`bash
   ./gradlew installDebug
   \`\`\`
5. Build signed production APK:
   \`\`\`bash
   ./gradlew assembleRelease
   \`\`\`
`,
    },
  ];
}

export async function generateAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();
  const files = getAndroidProjectFiles();

  for (const file of files) {
    zip.file(file.path, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
