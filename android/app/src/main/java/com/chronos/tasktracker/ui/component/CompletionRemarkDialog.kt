package com.chronos.tasktracker.ui.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.ui.theme.*

@Composable
fun CompletionRemarkDialog(
    task: TaskEntity,
    onDismiss: () -> Unit, // Cancel / close: leaves task incomplete
    onSaveAndComplete: (remark: String) -> Unit, // Save & Complete with remark
    onSkip: () -> Unit, // Skip for Now: completes without remark
    modifier: Modifier = Modifier
) {
    var remarkText by remember(task.id) { mutableStateOf(task.completionRemark ?: "") }
    var isSaving by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = {
            if (!isSaving) onDismiss()
        },
        properties = DialogProperties(
            dismissOnBackPress = !isSaving,
            dismissOnClickOutside = !isSaving,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = modifier
                .fillMaxWidth(0.92f)
                .wrapContentHeight()
                .semantics {
                    contentDescription = "Task Completion Dialog for ${task.title}"
                },
            shape = RoundedCornerShape(20.dp),
            color = ChronosSurface,
            tonalElevation = 6.dp,
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(ChronosBorder)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header row with Icon, Heading and Close button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.size(36.dp),
                        shape = CircleShape,
                        color = PriorityLow.copy(alpha = 0.2f)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = PriorityLow,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Task Completed!",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = task.title,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    IconButton(
                        onClick = { if (!isSaving) onDismiss() },
                        enabled = !isSaving,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close and cancel completion",
                            tint = TextSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Instruction label
                Text(
                    text = "Add a remark about your progress.",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Multiline remark input
                OutlinedTextField(
                    value = remarkText,
                    onValueChange = { remarkText = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(120.dp)
                        .semantics {
                            contentDescription = "Remark about your progress"
                        },
                    placeholder = {
                        Text(
                            text = "What did you accomplish? What did you learn? Any challenges?",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted,
                            fontSize = 13.sp
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = ChronosCard,
                        unfocusedContainerColor = ChronosCard,
                        focusedBorderColor = ChronosPrimary,
                        unfocusedBorderColor = ChronosBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    textStyle = MaterialTheme.typography.bodyMedium.copy(fontSize = 14.sp),
                    enabled = !isSaving,
                    singleLine = false,
                    maxLines = 5
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "${remarkText.length} characters",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    modifier = Modifier.align(Alignment.End)
                )

                Spacer(modifier = Modifier.height(18.dp))

                // Actions row: Skip for Now & Save & Complete
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Secondary action: Skip for Now
                    OutlinedButton(
                        onClick = {
                            if (!isSaving) {
                                isSaving = true
                                onSkip()
                            }
                        },
                        enabled = !isSaving,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = TextSecondary
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, ChronosBorder)
                    ) {
                        Text(
                            text = "Skip for Now",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Primary action: Save & Complete
                    Button(
                        onClick = {
                            if (!isSaving) {
                                isSaving = true
                                onSaveAndComplete(remarkText.trim())
                            }
                        },
                        enabled = !isSaving,
                        modifier = Modifier.weight(1.2f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ChronosPrimary,
                            contentColor = Color.White
                        )
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = Color.White,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                        }
                        Text(
                            text = "Save & Complete",
                            style = MaterialTheme.typography.labelLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
