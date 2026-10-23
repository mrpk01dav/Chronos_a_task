package com.chronos.tasktracker.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.ui.theme.*
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskEditDialog(
    task: TaskEntity,
    onDismiss: () -> Unit,
    onSave: (TaskEntity) -> Unit
) {
    var title by remember { mutableStateOf(task.title) }
    var priority by remember { mutableStateOf(task.priority) }
    var dueDate by remember { mutableStateOf(task.dueDate) }
    var dueTime by remember { mutableStateOf(task.dueTime) }
    var completionRemark by remember { mutableStateOf(task.completionRemark ?: "") }

    val timeRegex = remember { Regex("^([01]\\d|2[0-3]):[0-5]\\d$") }
    val timeValid = timeRegex.matches(dueTime)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Task", color = TextPrimary) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Text("Priority", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    listOf("high", "medium", "low").forEach { p ->
                        FilterChip(
                            selected = priority == p,
                            onClick = { priority = p },
                            label = { Text(p.replaceFirstChar { it.uppercase() }) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = when (p) {
                                    "high" -> PriorityHigh
                                    "low" -> PriorityLow
                                    else -> PriorityMedium
                                },
                                selectedLabelColor = ChronosBg
                            )
                        )
                    }
                }

                Text("Due Date", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val today = LocalDate.now().toString()
                    val tomorrow = LocalDate.now().plusDays(1).toString()
                    FilterChip(
                        selected = dueDate == today,
                        onClick = { dueDate = today },
                        label = { Text("Today") }
                    )
                    FilterChip(
                        selected = dueDate == tomorrow,
                        onClick = { dueDate = tomorrow },
                        label = { Text("Tomorrow") }
                    )
                }

                OutlinedTextField(
                    value = dueTime,
                    onValueChange = { dueTime = it },
                    label = { Text("Due Time (HH:mm)") },
                    singleLine = true,
                    isError = !timeValid,
                    supportingText = {
                        if (!timeValid) Text("Use 24-hour format, e.g. 17:30")
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                // If task is completed, allow viewing/editing its progress remark
                if (task.isCompleted) {
                    OutlinedTextField(
                        value = completionRemark,
                        onValueChange = { completionRemark = it },
                        label = { Text("Completion Progress Remark") },
                        placeholder = { Text("Progress reflection...") },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            Button(
                enabled = title.isNotBlank() && timeValid,
                onClick = {
                    val updated = task.copy(
                        title = title.trim(),
                        priority = priority,
                        dueDate = dueDate,
                        dueTime = dueTime,
                        completionRemark = if (task.isCompleted) completionRemark.trim().ifEmpty { null } else task.completionRemark,
                        updatedAt = System.currentTimeMillis()
                    )
                    onSave(updated)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ChronosPrimary)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextSecondary)
            }
        },
        containerColor = ChronosSurface,
        shape = RoundedCornerShape(16.dp)
    )
}
