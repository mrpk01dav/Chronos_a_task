package com.chronos.tasktracker.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.chronos.tasktracker.data.model.TaskEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks ORDER BY dueDate ASC, dueTime ASC")
    fun getAllTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 0 ORDER BY dueDate ASC, dueTime ASC")
    fun getActiveTasks(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 0")
    suspend fun getAllActiveTasksSync(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id LIMIT 1")
    suspend fun getTaskById(id: String): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Query("UPDATE tasks SET isCompleted = 1, completedAt = :completedAt, updatedAt = :completedAt WHERE id = :id")
    suspend fun markTaskComplete(id: String, completedAt: Long = System.currentTimeMillis())

    @Query("UPDATE tasks SET isCompleted = 1, completedAt = :completedAt, completionRemark = :completionRemark, updatedAt = :completedAt WHERE id = :id")
    suspend fun markTaskCompleteWithRemark(id: String, completionRemark: String?, completedAt: Long = System.currentTimeMillis())

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("DELETE FROM tasks WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("SELECT * FROM tasks WHERE (:userId IS NULL AND userId IS NULL) OR userId = :userId ORDER BY dueDate ASC, dueTime ASC")
    fun getTasksByUser(userId: String?): Flow<List<TaskEntity>>

    @Query("UPDATE tasks SET userId = :userId WHERE userId IS NULL")
    suspend fun claimAnonymousTasks(userId: String)

    @Query("DELETE FROM tasks WHERE userId = :userId")
    suspend fun deleteTasksByUserId(userId: String)
}
