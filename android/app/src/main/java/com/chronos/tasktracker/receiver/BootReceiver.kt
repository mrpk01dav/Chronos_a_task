package com.chronos.tasktracker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.chronos.tasktracker.data.local.AppDatabase
import com.chronos.tasktracker.scheduler.AlarmScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        // C-13: Handle package update, timezone shift, and clock adjustments in addition to reboot
        val actions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON",
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_TIME_CHANGED
        )

        if (intent.action in actions) {
            val pending = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val tasks = AppDatabase.getInstance(context).taskDao().getAllActiveTasksSync()
                    val scheduler = AlarmScheduler(context)
                    tasks.forEach { task ->
                        scheduler.scheduleTaskReminder(task)
                    }
                } catch (_: Exception) {
                    // Ignore errors during background reschedule
                } finally {
                    pending.finish()
                }
            }
        }
    }
}
