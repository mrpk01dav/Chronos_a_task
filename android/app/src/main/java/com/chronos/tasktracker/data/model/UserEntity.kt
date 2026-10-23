package com.chronos.tasktracker.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val email: String,
    val displayName: String,
    val passwordHash: String,
    val salt: String,
    val isVerified: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
