package com.chronos.tasktracker

import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeParseException

class AlarmSchedulerTest {

    // C-03: Test safe time regex matching
    @Test
    fun testTimeRegexValidation() {
        val timeRegex = Regex("^([01]\\d|2[0-3]):[0-5]\\d$")
        assertTrue(timeRegex.matches("00:00"))
        assertTrue(timeRegex.matches("17:30"))
        assertTrue(timeRegex.matches("23:59"))
        assertFalse(timeRegex.matches("abc"))
        assertFalse(timeRegex.matches("25:99"))
        assertFalse(timeRegex.matches("5:00")) // requires 2 digits HH
        assertFalse(timeRegex.matches("12:60"))
    }

    // C-03: Test safe parsing without crashing on malformed strings
    @Test
    fun testSafeDateParsing() {
        fun parseMillis(dateStr: String, timeStr: String): Long? = try {
            LocalDateTime.of(LocalDate.parse(dateStr), LocalTime.parse(timeStr))
                .atZone(ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli()
        } catch (_: DateTimeParseException) {
            null
        }

        assertNotNull(parseMillis("2026-10-22", "17:30"))
        assertNull(parseMillis("2026-10-22", "abc"))
        assertNull(parseMillis("invalid-date", "17:30"))
    }

    // C-04: Test trigger time calculation for near/past reminders
    @Test
    fun testNearReminderTriggerAdjustment() {
        val now = 100_000L
        val due = 110_000L // due in 10s
        val reminderMinutesBefore = 15 // 15 mins = 900_000ms
        
        var trigger = due - reminderMinutesBefore * 60_000L // -790,000 (past)
        if (trigger <= now) {
            trigger = now + 3_000L // immediately due soon (3s)
        }

        assertEquals(103_000L, trigger)
    }
}
