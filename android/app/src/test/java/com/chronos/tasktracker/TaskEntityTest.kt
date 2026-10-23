package com.chronos.tasktracker

import com.chronos.tasktracker.data.model.TaskEntity
import org.junit.Assert.*
import org.junit.Test

class TaskEntityTest {

    @Test
    fun testTaskCreationAndDefaults() {
        val task = TaskEntity(
            id = "test-123",
            title = "Study System Design",
            priority = "high",
            dueDate = "2026-10-22",
            dueTime = "18:00"
        )

        assertEquals("test-123", task.id)
        assertEquals("Study System Design", task.title)
        assertEquals("high", task.priority)
        assertFalse(task.isCompleted)
        assertNull(task.completedAt)
        assertEquals(15, task.reminderMinutesBefore)
    }

    // C-06: Test completion copy preserves state and adds completedAt
    @Test
    fun testTaskToggleCompletion() {
        val task = TaskEntity(
            id = "test-123",
            title = "Study System Design",
            priority = "high",
            dueDate = "2026-10-22",
            dueTime = "18:00"
        )

        val completionTime = 123456789L
        val completedTask = task.copy(
            isCompleted = true,
            completedAt = completionTime,
            updatedAt = completionTime
        )

        assertTrue(completedTask.isCompleted)
        assertEquals(completionTime, completedTask.completedAt)
    }

    // Remark Popup Tests: Save & Complete with progress remark
    @Test
    fun testTaskCompletionWithRemark() {
        val task = TaskEntity(
            id = "test-remark-1",
            title = "Write Unit Tests",
            dueDate = "2026-10-22",
            dueTime = "14:00"
        )

        val completionTime = System.currentTimeMillis()
        val remark = "Finished all 20 test cases with zero regressions."
        val completedTask = task.copy(
            isCompleted = true,
            completedAt = completionTime,
            completionRemark = remark,
            updatedAt = completionTime
        )

        assertTrue(completedTask.isCompleted)
        assertEquals(completionTime, completedTask.completedAt)
        assertEquals(remark, completedTask.completionRemark)
    }

    // Remark Popup Tests: Skip for Now creates completed task with null remark
    @Test
    fun testTaskCompletionSkipRemark() {
        val task = TaskEntity(
            id = "test-remark-2",
            title = "Quick chore",
            dueDate = "2026-10-22",
            dueTime = "14:00"
        )

        val completionTime = System.currentTimeMillis()
        val completedTask = task.copy(
            isCompleted = true,
            completedAt = completionTime,
            completionRemark = null,
            updatedAt = completionTime
        )

        assertTrue(completedTask.isCompleted)
        assertEquals(completionTime, completedTask.completedAt)
        assertNull(completedTask.completionRemark)
    }

    // Remark Popup Tests: Reopen resets completion while keeping task safe
    @Test
    fun testTaskReopeningFlow() {
        val task = TaskEntity(
            id = "test-remark-3",
            title = "Recurring Meeting",
            dueDate = "2026-10-22",
            dueTime = "10:00",
            isCompleted = true,
            completedAt = 100000L,
            completionRemark = "Initial remark"
        )

        val reopened = task.copy(
            isCompleted = false,
            completedAt = null,
            updatedAt = 200000L
        )

        assertFalse(reopened.isCompleted)
        assertNull(reopened.completedAt)
        assertEquals("Recurring Meeting", reopened.title)
    }
}
