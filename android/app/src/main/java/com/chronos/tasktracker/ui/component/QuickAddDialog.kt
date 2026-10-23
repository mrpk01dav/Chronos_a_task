package com.chronos.tasktracker.ui.component

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.chronos.tasktracker.ui.theme.*
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeParseException

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickAddDialog(
    onDismiss: () -> Unit,
    onConfirm: (title: String, priority: String, dueDate: String, dueTime: String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("medium") } // C-08
    var dueDate by remember { mutableStateOf(LocalDate.now().toString()) }
    
    // C-04: Default due time to the next hour (e.g. 17:00 if 16:15)
    var dueTime by remember {
        mutableStateOf(
            LocalTime.now().plusHours(1).withMinute(0).toString().take(5)
        )
    }

    // C-03: Regex validation for 24-hour time format HH:mm
    val timeRegex = remember { Regex("^([01]\\d|2[0-3]):[0-5]\\d$") }
    val timeValid = timeRegex.matches(dueTime)

    // C-04: Extra validation if due date is today
    val isToday = dueDate == LocalDate.now().toString()
    val isPastToday = isToday && timeValid && try {
        LocalTime.parse(dueTime).isBefore(LocalTime.now())
    } catch (_: DateTimeParseException) {
        false
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("New Task", color = TextPrimary) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Task Title
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Task Title") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // C-08: Priority Selection Chips
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

                // Due Date Quick Selection
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

                // C-03 & C-04: Due Time input with error states
                OutlinedTextField(
                    value = dueTime,
                    onValueChange = { dueTime = it },
                    label = { Text("Due Time (HH:mm)") },
                    singleLine = true,
                    isError = !timeValid || isPastToday,
                    supportingText = {
                        if (!timeValid) {
                            Text("Use 24-hour format, e.g. 17:30")
                        } else if (isPastToday) {
                            Text("That time has already passed today")
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                // C-03, C-04, C-10: Guard against blank title, invalid time, past time
                enabled = title.isNotBlank() && timeValid && !isPastToday,
                onClick = {
                    onConfirm(title.trim(), priority, dueDate, dueTime)
                },
                colors = ButtonDefaults.buttonColors(containerColor = ChronosPrimary)
            ) {
                Text("Create")
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
