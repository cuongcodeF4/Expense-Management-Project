package com.example.expensemanagement

import android.content.Intent
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Listens for MoMo payment notifications and broadcasts parsed transaction data
 * to MainActivity, which then injects it into the WebView.
 */
class MomoNotificationService : NotificationListenerService() {

    companion object {
        const val TAG = "MomoNotifService"
        const val ACTION_MOMO_TRANSACTION = "com.example.expensemanagement.MOMO_TRANSACTION"
        const val EXTRA_AMOUNT = "amount"
        const val EXTRA_TYPE = "type" // "income" or "expense"
        const val EXTRA_NOTE = "note"
        const val EXTRA_DATE = "date"
        const val EXTRA_TIMESTAMP = "timestamp"

        // MoMo package name (hỗ trợ nhiều phiên bản MoMo)
        val MOMO_PACKAGES = setOf(
            "com.mservice.momotransfer",
            "com.mservice.momopay",
            "com.mservice.momoapp"
        )

        // Regex patterns for Vietnamese MoMo notifications
        private val AMOUNT_PATTERN = Regex(
            """(?:thanh toán|chuyển tiền|trừ|giao dịch|payment|chi|Số tiền|nhận|đã nhận)[^\d]*?([\d.,]+)\s*(?:đ|VND|dong|đồng)?""",
            RegexOption.IGNORE_CASE
        )

        // Fallback: just find any large number that looks like VND
        private val AMOUNT_FALLBACK_PATTERN = Regex(
            """(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|VND|dong|đồng)?"""
        )

        private val INCOME_KEYWORDS = listOf(
            "Nhận tiền", "đã nhận", "nhận tiền", "hoàn tiền", "cộng", "received", "added", "refund",
            "nhan tien", "da nhan", "cong tien"
        )

        private val EXPENSE_KEYWORDS = listOf(
            "thanh toán", "chuyển tiền", "đã trừ", "chi", "payment", "paid", "sent", "trừ",
            "thanh toan", "chuyen tien", "da tru"
        )

        private val SUCCESS_KEYWORDS = INCOME_KEYWORDS + EXPENSE_KEYWORDS + listOf(
            "thành công", "successful", "giao dịch", "biên lai", "túi thần tài", "chuyển khoản",
            "thanh cong", "giao dich", "Số tiền", "So tien"
        )

        private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in MOMO_PACKAGES) return

        val extras = sbn.notification.extras
        val title = extras.getCharSequence("android.title")?.toString() ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""
        val bigText = extras.getCharSequence("android.bigText")?.toString() ?: ""

        val fullText = listOf(bigText, text).maxByOrNull { it.length } ?: text
        val combined = "$title $fullText"

        val isTransaction = SUCCESS_KEYWORDS.any { combined.contains(it, ignoreCase = true) }
        if (!isTransaction) return

        val amount = parseAmount(combined)
        if (amount <= 0) return

        val type = determineType(combined)
        val note = extractNote(title, fullText)
        val date = dateFormat.format(Date())

        val intent = Intent(ACTION_MOMO_TRANSACTION).apply {
            setPackage(packageName)
            putExtra(EXTRA_AMOUNT, amount)
            putExtra(EXTRA_TYPE, type)
            putExtra(EXTRA_NOTE, note)
            putExtra(EXTRA_DATE, date)
            putExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())
        }
        sendBroadcast(intent)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        // Not needed
    }

    private fun determineType(text: String): String {
        val lowerText = text.lowercase()
        if (INCOME_KEYWORDS.any { lowerText.contains(it) }) {
            return "income"
        }
        return "expense"
    }

    private fun parseAmount(text: String): Double {
        AMOUNT_PATTERN.find(text)?.let { match ->
            return normalizeAmount(match.groupValues[1])
        }

        AMOUNT_FALLBACK_PATTERN.findAll(text).toList().let { matches ->
            if (matches.isNotEmpty()) {
                return matches.mapNotNull { normalizeAmountOrNull(it.groupValues[1]) }
                    .maxOrNull() ?: 0.0
            }
        }

        return 0.0
    }

    private fun normalizeAmount(amountStr: String): Double {
        return normalizeAmountOrNull(amountStr) ?: 0.0
    }

    private fun normalizeAmountOrNull(amountStr: String): Double? {
        val cleaned = amountStr.replace(".", "").replace(",", "")
        return cleaned.toDoubleOrNull()
    }

    private fun extractNote(title: String, text: String): String {
        val parts = mutableListOf<String>()
        if (title.isNotBlank() && !title.equals("MoMo", ignoreCase = true)) {
            parts.add(title)
        }
        val shortText = text.split(Regex("[.!\\n]")).firstOrNull()?.trim() ?: ""
        if (shortText.isNotBlank() && shortText != title) {
            parts.add(shortText)
        }
        val note = parts.joinToString(" - ").take(120)
        return if (note.isNotBlank()) "MoMo: $note" else "MoMo payment"
    }
}
