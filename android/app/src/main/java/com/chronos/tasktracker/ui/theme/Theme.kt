package com.chronos.tasktracker.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = ChronosPrimary,
    onPrimary = Color.White,
    secondary = ChronosSecondary,
    onSecondary = Color.White,
    background = ChronosBg,
    onBackground = TextPrimary,
    surface = ChronosSurface,
    onSurface = TextPrimary,
    surfaceVariant = ChronosCard,
    onSurfaceVariant = TextSecondary,
    outline = ChronosBorder
)

@Composable
fun ChronosTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
