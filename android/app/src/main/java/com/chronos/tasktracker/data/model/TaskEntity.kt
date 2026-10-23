package com.chronos.tasktracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String = "",
    val priority: String = "medium", // "high", "medium", "low"
    val dueDate: String, // "YYYY-MM-DD"
    val dueTime: String, // "HH:mm" (24-hour format)
    val reminderMinutesBefore: Int = 15,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val completionRemark: String? = null,
    val userId: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
