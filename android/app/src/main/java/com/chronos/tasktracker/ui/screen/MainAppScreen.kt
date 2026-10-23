package com.chronos.tasktracker.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.chronos.tasktracker.data.local.AppDatabase
import com.chronos.tasktracker.data.model.TaskEntity
import com.chronos.tasktracker.scheduler.AlarmScheduler
import com.chronos.tasktracker.ui.component.CompletionRemarkDialog
import com.chronos.tasktracker.ui.component.QuickAddDialog
import com.chronos.tasktracker.ui.component.TaskEditDialog
import com.chronos.tasktracker.ui.component.TaskRow
import com.chronos.tasktracker.ui.theme.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen() {
    val context = LocalContext.current
    val database = remember { AppDatabase.getInstance(context) }
    val alarmScheduler = remember { AlarmScheduler(context) }
    val coroutineScope = rememberCoroutineScope()

    val allTasks by database.taskDao().getAllTasks().collectAsState(initial = emptyList())
    val todayStr = remember { LocalDate.now().toString() }

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Home, 1: Tasks
    var showAddDialog by remember { mutableStateOf(false) }
    var taskToEdit by remember { mutableStateOf<TaskEntity?>(null) }
    var pendingCompletionTask by remember { mutableStateOf<TaskEntity?>(null) }
    val snackbarHostState = remember { SnackbarHostState() } // C-16

    // Task completion and reopening handler:
    // If incomplete, immediately prompts for completion progress remark.
    // If already complete, directly reopens the task.
    val toggleTask: (TaskEntity) -> Unit = { task ->
        if (!task.isCompleted) {
            pendingCompletionTask = task
        } else {
            coroutineScope.launch {
                val now = System.currentTimeMillis()
                val reopened = task.copy(
                    isCompleted = false,
                    completedAt = null,
                    updatedAt = now
                )
                database.taskDao().updateTask(reopened)
                alarmScheduler.scheduleTaskReminder(reopened)
            }
        }
    }

    // C-16: Delete task with undo snackbar
    val deleteTask: (TaskEntity) -> Unit = { task ->
        coroutineScope.launch {
            alarmScheduler.cancelTaskReminder(task.id)
            database.taskDao().deleteById(task.id)
            val result = snackbarHostState.showSnackbar(
                message = "Task deleted",
                actionLabel = "Undo",
                duration = SnackbarDuration.Short
            )
            if (result == SnackbarResult.ActionPerformed) {
                database.taskDao().insertTask(task)
                if (!task.isCompleted) {
                    alarmScheduler.scheduleTaskReminder(task)
                }
            }
        }
    }

    // C-16: Edit task
    val saveEditedTask: (TaskEntity) -> Unit = { updated ->
        coroutineScope.launch {
            database.taskDao().updateTask(updated)
            if (!updated.isCompleted) {
                alarmScheduler.scheduleTaskReminder(updated)
            }
        }
        taskToEdit = null
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            modifier = Modifier.size(32.dp),
                            shape = CircleShape,
                            color = ChronosPrimary
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Chronos",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        // C-14: "Native Compose" developer badge and Spacer intentionally removed
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ChronosBg
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = ChronosSurface,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ChronosPrimary,
                        selectedTextColor = ChronosPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = ChronosPrimary.copy(alpha = 0.15f)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.List, contentDescription = "Tasks") },
                    label = { Text("Tasks") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = ChronosPrimary,
                        selectedTextColor = ChronosPrimary,
                        unselectedIconColor = TextSecondary,
                        unselectedTextColor = TextSecondary,
                        indicatorColor = ChronosPrimary.copy(alpha = 0.15f)
                    )
                )
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = ChronosPrimary,
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Task")
            }
        },
        containerColor = ChronosBg
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            when (selectedTab) {
                0 -> HomeScreen(
                    tasks = allTasks,
                    todayStr = todayStr,
                    onToggleComplete = toggleTask,
                    onEdit = { taskToEdit = it },
                    onDelete = deleteTask
                )
                1 -> TasksScreen(
                    tasks = allTasks,
                    onToggleComplete = toggleTask,
                    onEdit = { taskToEdit = it },
                    onDelete = deleteTask
                )
            }
        }
    }

    // Quick Add Dialog
    if (showAddDialog) {
        QuickAddDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { title, priority, dueDate, dueTime ->
                // C-10: Close dialog immediately to prevent double-tap collisions
                showAddDialog = false
                coroutineScope.launch {
                    val newTask = TaskEntity(
                        id = UUID.randomUUID().toString(), // C-10: Unique UUID instead of timestamp
                        title = title,
                        priority = priority,
                        dueDate = dueDate,
                        dueTime = dueTime
                    )
                    database.taskDao().insertTask(newTask)
                    alarmScheduler.scheduleTaskReminder(newTask)
                }
            }
        )
    }

    // Edit Dialog
    taskToEdit?.let { task ->
        TaskEditDialog(
            task = task,
            onDismiss = { taskToEdit = null },
            onSave = saveEditedTask
        )
    }

    // Task Completion Remark Dialog
    pendingCompletionTask?.let { task ->
        CompletionRemarkDialog(
            task = task,
            onDismiss = { pendingCompletionTask = null },
            onSaveAndComplete = { remark ->
                coroutineScope.launch {
                    val now = System.currentTimeMillis()
                    val cleanRemark = remark.trim().ifEmpty { null }
                    val completedTask = task.copy(
                        isCompleted = true,
                        completedAt = now,
                        completionRemark = cleanRemark,
                        updatedAt = now
                    )
                    database.taskDao().updateTask(completedTask)
                    alarmScheduler.cancelTaskReminder(task.id)
                    pendingCompletionTask = null
                }
            },
            onSkip = {
                coroutineScope.launch {
                    val now = System.currentTimeMillis()
                    val completedTask = task.copy(
                        isCompleted = true,
                        completedAt = now,
                        completionRemark = null,
                        updatedAt = now
                    )
                    database.taskDao().updateTask(completedTask)
                    alarmScheduler.cancelTaskReminder(task.id)
                    pendingCompletionTask = null
                }
            }
        )
    }
}

@Composable
fun HomeScreen(
    tasks: List<TaskEntity>,
    todayStr: String,
    onToggleComplete: (TaskEntity) -> Unit,
    onEdit: (TaskEntity) -> Unit,
    onDelete: (TaskEntity) -> Unit
) {
    // C-09: Filter active tasks only for Home display
    val activeTasks = remember(tasks) { tasks.filter { !it.isCompleted } }
    val todayTasks = remember(tasks, todayStr) { tasks.filter { it.dueDate == todayStr } }
    val completedCount = remember(todayTasks) { todayTasks.count { it.isCompleted } }

    // C-09: Progress is 0f if todayTasks is empty (never shows 100% when 0 tasks exist)
    val progress = remember(todayTasks, completedCount) {
        if (todayTasks.isNotEmpty()) completedCount.toFloat() / todayTasks.size else 0f
    }
    val progressLabel = if (todayTasks.isEmpty()) {
        "No tasks due today"
    } else {
        "$completedCount / ${todayTasks.size} Tasks Completed"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Daily Progress Card (C-09)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ChronosSurface),
            border = CardDefaults.outlinedCardBorder().copy(
                brush = androidx.compose.ui.graphics.SolidColor(ChronosBorder)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Today's Progress",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    Text(
                        text = "${(progress * 100).toInt()}%",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = ChronosPrimary
                    )
                }

                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = ChronosPrimary,
                    trackColor = ChronosCard
                )

                Text(
                    text = progressLabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        }

        // Section Title
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Active Tasks",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary
            )
            Text(
                text = "${activeTasks.size} remaining",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        // Active Tasks List with Empty State (C-09, C-16)
        if (activeTasks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = TextSecondary.copy(alpha = 0.5f),
                        modifier = Modifier.size(48.dp)
                    )
                    Text(
                        text = "No tasks yet. Tap + to add one.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(activeTasks, key = { it.id }) { task ->
                    TaskRow(
                        task = task,
                        onToggleComplete = { onToggleComplete(task) },
                        onEdit = { onEdit(task) },
                        onDelete = { onDelete(task) }
                    )
                }
            }
        }
    }
}

@Composable
fun TasksScreen(
    tasks: List<TaskEntity>,
    onToggleComplete: (TaskEntity) -> Unit,
    onEdit: (TaskEntity) -> Unit,
    onDelete: (TaskEntity) -> Unit
) {
    var filterCompleted by remember { mutableStateOf<Boolean?>(null) } // null = All, false = Active, true = Completed

    val filteredTasks = remember(tasks, filterCompleted) {
        when (filterCompleted) {
            null -> tasks
            true -> tasks.filter { it.isCompleted }
            false -> tasks.filter { !it.isCompleted }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Filter Chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                selected = filterCompleted == null,
                onClick = { filterCompleted = null },
                label = { Text("All (${tasks.size})") }
            )
            FilterChip(
                selected = filterCompleted == false,
                onClick = { filterCompleted = false },
                label = { Text("Active (${tasks.count { !it.isCompleted }})") }
            )
            FilterChip(
                selected = filterCompleted == true,
                onClick = { filterCompleted = true },
                label = { Text("Completed (${tasks.count { it.isCompleted }})") }
            )
        }

        if (filteredTasks.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tasks found",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextSecondary
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(filteredTasks, key = { it.id }) { task ->
                    TaskRow(
                        task = task,
                        onToggleComplete = { onToggleComplete(task) },
                        onEdit = { onEdit(task) },
                        onDelete = { onDelete(task) }
                    )
                }
            }
        }
    }
}
