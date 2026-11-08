package com.example.expensemanagement

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Đọc nội dung màn hình kết quả giao dịch trong MoMo app.
 * Phát hiện khi user chuyển tiền thành công bằng cách xem màn hình.
 */
class MomoAccessibilityService : AccessibilityService() {

    companion object {
        const val TAG = "MomoAccessibility"

        val MOMO_PACKAGES = setOf(
            "com.mservice.momotransfer",
            "com.mservice.momopay",
            "com.mservice.momoapp"
        )

        private val SUCCESS_SCREEN_KEYWORDS = listOf(
            "giao dịch thành công",
            "chuyển tiền thành công",
            "thanh toán thành công",
            "giao dich thanh cong",
            "chuyen tien thanh cong",
            "thanh toan thanh cong",
            "transfer successful",
            "payment successful"
        )

        private val AMOUNT_PATTERN = Regex(
            """([\d]{1,3}(?:[.,][\d]{3})+|[\d]{4,})\s*(?:đ\b|d\b|VND|dong|đồng)""",
            RegexOption.IGNORE_CASE
        )

        private val RECIPIENT_PATTERN = Regex(
            """(?:đến[:\s]+|den[:\s]+|tới[:\s]+|toi[:\s]+|to[:\s]+)([^\n\d\-]{3,50})""",
            RegexOption.IGNORE_CASE
        )

        private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    }

    private var lastBroadcastKey = ""
    private var lastBroadcastTime = 0L

    override fun onServiceConnected() {
        serviceInfo = serviceInfo?.apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            packageNames = MOMO_PACKAGES.toTypedArray()
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 300
            flags = AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg !in MOMO_PACKAGES) return

        val root = rootInActiveWindow ?: return
        try {
            processScreen(root)
        } finally {
            root.recycle()
        }
    }

    private fun processScreen(root: AccessibilityNodeInfo) {
        val allText = collectAllText(root)
        if (allText.isBlank()) return

        val isSuccess = SUCCESS_SCREEN_KEYWORDS.any { allText.contains(it, ignoreCase = true) }
        if (!isSuccess) return

        val amount = parseAmount(allText)
        if (amount <= 0) return

        val dedupKey = amount.toLong().toString()
        val now = System.currentTimeMillis()
        if (dedupKey == lastBroadcastKey && (now - lastBroadcastTime) < 15_000) {
            return
        }
        lastBroadcastKey = dedupKey
        lastBroadcastTime = now

        val recipient = extractRecipient(allText)
        val note = if (recipient.isNotBlank()) {
            "Chuyển tiền MoMo → ${recipient.trim()}"
        } else {
            "MoMo: Chuyển tiền thành công"
        }
        val date = dateFormat.format(Date())

        val intent = Intent(MomoNotificationService.ACTION_MOMO_TRANSACTION).apply {
            setPackage(packageName)
            putExtra(MomoNotificationService.EXTRA_AMOUNT, amount)
            putExtra(MomoNotificationService.EXTRA_NOTE, note)
            putExtra(MomoNotificationService.EXTRA_DATE, date)
            putExtra(MomoNotificationService.EXTRA_TIMESTAMP, now)
        }
        sendBroadcast(intent)
    }

    private fun collectAllText(node: AccessibilityNodeInfo): String {
        val sb = StringBuilder()
        collectText(node, sb, depth = 0)
        return sb.toString()
    }

    private fun collectText(node: AccessibilityNodeInfo, sb: StringBuilder, depth: Int) {
        if (depth > 25) return
        val text = node.text?.toString()
        val desc = node.contentDescription?.toString()
        if (!text.isNullOrBlank()) sb.append(text).append("\n")
        else if (!desc.isNullOrBlank()) sb.append(desc).append("\n")
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            collectText(child, sb, depth + 1)
            child.recycle()
        }
    }

    private fun parseAmount(text: String): Double {
        return AMOUNT_PATTERN.findAll(text)
            .mapNotNull { match ->
                val raw = match.groupValues[1].replace(".", "").replace(",", "")
                raw.toDoubleOrNull()
            }
            .filter { it >= 1000 }
            .maxOrNull() ?: 0.0
    }

    private fun extractRecipient(text: String): String {
        return RECIPIENT_PATTERN.find(text)?.groupValues?.get(1)?.trim() ?: ""
    }

    override fun onInterrupt() {
        // Service interrupted
    }
}
