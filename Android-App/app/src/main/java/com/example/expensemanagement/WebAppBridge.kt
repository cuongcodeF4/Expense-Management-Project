package com.example.expensemanagement

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView

/**
 * JavaScript interface bridging native Android ↔ WebView.
 * Exposed as `window.AndroidBridge` in JS.
 */
class WebAppBridge(
    private val context: Context,
    private val webView: WebView
) {
    companion object {
        const val TAG = "WebAppBridge"
        const val JS_INTERFACE_NAME = "AndroidBridge"
    }

    /**
     * Called from JS to check if notification listener permission is granted.
     */
    @JavascriptInterface
    fun isNotificationListenerEnabled(): Boolean {
        val flat = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        )
        return flat?.contains(context.packageName) == true
    }

    /**
     * Called from JS to open the notification listener settings screen.
     */
    @JavascriptInterface
    fun openNotificationListenerSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Called from JS to check if Accessibility Service is enabled.
     */
    @JavascriptInterface
    fun isAccessibilityServiceEnabled(): Boolean {
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabledServices.contains(context.packageName, ignoreCase = true)
    }

    /**
     * Called from JS to open Accessibility settings screen.
     */
    @JavascriptInterface
    fun openAccessibilitySettings() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Called from JS to get MoMo auto-add preference.
     */
    @JavascriptInterface
    fun isMomoAutoAddEnabled(): Boolean {
        val prefs = context.getSharedPreferences("momo_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("auto_add", true)
    }

    /**
     * Called from JS to toggle MoMo auto-add on/off.
     */
    @JavascriptInterface
    fun setMomoAutoAddEnabled(enabled: Boolean) {
        val prefs = context.getSharedPreferences("momo_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("auto_add", enabled).apply()
        Log.d(TAG, "MoMo auto-add set to: $enabled")
    }

    /**
     * Called from native side when a MoMo notification is received.
     * Injects a JS call on the UI thread.
     */
    fun injectMomoTransaction(amount: Double, type: String, note: String, date: String, timestamp: Long) {
        // Escape note for JS string
        val safeNote = note
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")

        val js = """
            (function() {
                if (typeof window._onMomoTransaction === 'function') {
                    window._onMomoTransaction($amount, '$type', '$safeNote', '$date', $timestamp);
                } else {
                    console.warn('MoMo bridge: _onMomoTransaction not defined yet, queuing...');
                    window._momoQueue = window._momoQueue || [];
                    window._momoQueue.push({amount: $amount, type: '$type', note: '$safeNote', date: '$date', timestamp: $timestamp});
                }
            })();
        """.trimIndent()

        webView.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
