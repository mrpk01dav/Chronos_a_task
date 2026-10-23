package com.chronos.tasktracker.receiver

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.chronos.tasktracker.ChronosApplication
import com.chronos.tasktracker.MainActivity
import com.chronos.tasktracker.R
import com.chronos.tasktracker.data.local.AppDatabase
import com.chronos.tasktracker.scheduler.AlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_TASK_REMINDER = "com.chronos.ACTION_TASK_REMINDER"
        const val ACTION_TASK_COMPLETE = "com.chronos.ACTION_TASK_COMPLETE"
        const val ACTION_TASK_SNOOZE = "com.chronos.ACTION_TASK_SNOOZE"

        const val EXTRA_TASK_ID = "extra_task_id"
        const val EXTRA_TASK_TITLE = "extra_task_title"
        const val EXTRA_TASK_PRIORITY = "extra_task_priority"
        const val EXTRA_TASK_DUE_TIME = "extra_task_due_time"
        const val EXTRA_SNOOZE_MINUTES = "extra_snooze_minutes"
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

            // C-07: Uses goAsync() so process is not killed during async database write
            ACTION_TASK_COMPLETE -> {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.cancel(taskId.hashCode())
                AlarmScheduler(context).cancelTaskReminder(taskId) // also clears pending snooze
                val pending = goAsync()
                CoroutineScope(Dispatchers.IO).launch {
                    try {
                        AppDatabase.getInstance(context).taskDao().markTaskComplete(taskId)
                    } finally {
                        pending.finish()
                    }
                }
            }

            // C-05: Preserves priority and dueTime, uses AlarmScheduler for safe scheduling
            ACTION_TASK_SNOOZE -> {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.cancel(taskId.hashCode())
                val mins = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 10)
                val title = intent.getStringExtra(EXTRA_TASK_TITLE) ?: "Snoozed Task"
                val priority = intent.getStringExtra(EXTRA_TASK_PRIORITY) ?: "medium"
                val dueTime = intent.getStringExtra(EXTRA_TASK_DUE_TIME) ?: ""
                AlarmScheduler(context).scheduleAt(
                    taskId = taskId,
                    title = title,
                    priority = priority,
                    dueTime = dueTime,
                    triggerAtMillis = System.currentTimeMillis() + mins * 60_000L
                )
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
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Content intent: Opens MainActivity when tapping notification
        val contentIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_TASK_ID, taskId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            context,
            taskId.hashCode(),
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Complete action
        val completeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_TASK_COMPLETE
            putExtra(EXTRA_TASK_ID, taskId)
        }
        val completePendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.hashCode() + 1,
            completeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Snooze action (C-05: preserves priority and due time)
        val snoozeIntent = Intent(context, AlarmReceiver::class.java).apply {
            action = ACTION_TASK_SNOOZE
            putExtra(EXTRA_TASK_ID, taskId)
            putExtra(EXTRA_TASK_TITLE, title)
            putExtra(EXTRA_TASK_PRIORITY, priority)
            putExtra(EXTRA_TASK_DUE_TIME, dueTime)
            putExtra(EXTRA_SNOOZE_MINUTES, 10)
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.hashCode() + 2,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val priorityText = priority.replaceFirstChar { it.uppercase() }
        val contentText = if (dueTime.isNotBlank()) "Due at $dueTime • Priority: $priorityText" else "Priority: $priorityText"

        val builder = NotificationCompat.Builder(context, ChronosApplication.CHANNEL_REMINDERS_ID)
            .setSmallIcon(R.drawable.ic_notification) // C-17: Custom monochrome icon
            .setContentTitle(title)
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            .addAction(R.drawable.ic_check, "Complete", completePendingIntent) // C-17: Custom monochrome icon
            .addAction(R.drawable.ic_snooze, "Snooze 10m", snoozePendingIntent) // C-17: Custom monochrome icon
            // C-17: Removed setVibrate() as notification channel controls vibration on Android 8+

        nm.notify(taskId.hashCode(), builder.build())
    }
}
