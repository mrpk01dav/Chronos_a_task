package com.chronos.tasktracker.scheduler

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.receiver.AlarmReceiver
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeParseException

class AlarmScheduler(private val context: Context) {
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    /**
     * Schedules a reminder for an upcoming task.
     * Addresses C-04: If trigger time has already passed but task is not yet due,
     * immediately fires reminder within 3 seconds rather than silently skipping.
     */
    fun scheduleTaskReminder(task: TaskEntity) {
        if (task.isCompleted) return
        val now = System.currentTimeMillis()
        val due = dueMillis(task) ?: return
        if (due <= now) return // already overdue: nothing to remind
        var trigger = due - task.reminderMinutesBefore * 60_000L
        if (trigger <= now) trigger = now + 3_000L // due soon: remind right away
        scheduleAt(task.id, task.title, task.priority, task.dueTime, trigger)
    }

    /**
     * Schedules an alarm at a specific epoch millis.
     * Reused by both task reminders and snooze actions (C-05).
     * Handles exact-alarm permissions safely with try-catch fallback.
     */
    fun scheduleAt(
        taskId: String,
        title: String,
        priority: String,
        dueTime: String,
        triggerAtMillis: Long
    ) {
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_TASK_REMINDER
            putExtra(AlarmReceiver.EXTRA_TASK_ID, taskId)
            putExtra(AlarmReceiver.EXTRA_TASK_TITLE, title)
            putExtra(AlarmReceiver.EXTRA_TASK_PRIORITY, priority)
            putExtra(AlarmReceiver.EXTRA_TASK_DUE_TIME, dueTime)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            taskId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
                alarmManager.canScheduleExactAlarms()
        try {
            if (canExact) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        }
    }

    /**
     * Cancels any scheduled reminder or snooze alarm for the given task.
     */
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

    /**
     * C-03: Safe date and time parsing without crashing on malformed strings.
     */
    fun dueMillis(task: TaskEntity): Long? = try {
        LocalDateTime.of(LocalDate.parse(task.dueDate), LocalTime.parse(task.dueTime))
            .atZone(ZoneId.systemDefault())
            .toInstant()
            .toEpochMilli()
    } catch (e: DateTimeParseException) {
        null
    }
}
