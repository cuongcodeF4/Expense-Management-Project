package com.example.expensemanagement

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.util.Log
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var bridge: WebAppBridge
    private var momoReceiver: BroadcastReceiver? = null

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Enable WebView debugging for Chrome DevTools via chrome://inspect
        WebView.setWebContentsDebuggingEnabled(true)

        // Build asset loader to serve local files under https://appassets.androidplatform.net/
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // Enable cookies (required for Firebase Auth)
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(findViewById(R.id.webView), true)

        webView = findViewById(R.id.webView)
        configureWebView(webView)

        // Set up native ↔ JS bridge
        bridge = WebAppBridge(this, webView)
        webView.addJavascriptInterface(bridge, WebAppBridge.JS_INTERFACE_NAME)

        // Register receiver for MoMo notification broadcasts
        registerMomoReceiver()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                // Let our app domain and Firebase/Google auth URLs load in the WebView
                if (url.startsWith("https://appassets.androidplatform.net") ||
                    url.contains("accounts.google.com") ||
                    url.contains("firebaseapp.com") ||
                    url.contains("googleapis.com") ||
                    url.contains("gstatic.com")
                ) {
                    return false
                }
                // Open external URLs in the browser
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(
                view: WebView,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: Message
            ): Boolean {
                // Handle popup windows (used by Firebase signInWithPopup)
                val popupWebView = WebView(this@MainActivity)
                configureWebView(popupWebView)

                val dialog = Dialog(this@MainActivity, android.R.style.Theme_Black_NoTitleBar_Fullscreen)
                dialog.setContentView(popupWebView)
                dialog.window?.setLayout(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                dialog.show()

                CookieManager.getInstance().setAcceptThirdPartyCookies(popupWebView, true)

                popupWebView.webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest
                    ): Boolean {
                        return false // Let everything load in the popup
                    }
                }

                popupWebView.webChromeClient = object : WebChromeClient() {
                    override fun onCloseWindow(window: WebView) {
                        dialog.dismiss()
                        window.destroy()
                    }
                }

                val transport = resultMsg.obj as WebView.WebViewTransport
                transport.webView = popupWebView
                resultMsg.sendToTarget()
                return true
            }
        }

        webView.loadUrl("https://appassets.androidplatform.net/index.html")

        // Xử lý nút Back mới cho Android 13+
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(wv: WebView) {
        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = false
            // Enable zoom in/out
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false // Hide the zoom buttons (pinch to zoom will still work)
            // Use a standard mobile Chrome User-Agent to bypass the "disallowed_useragent" error
            userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
        }
    }

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    private fun registerMomoReceiver() {
        momoReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.action != MomoNotificationService.ACTION_MOMO_TRANSACTION) return

                // Check if auto-add is enabled
                val prefs = getSharedPreferences("momo_prefs", MODE_PRIVATE)
                if (!prefs.getBoolean("auto_add", true)) return

                val amount = intent.getDoubleExtra(MomoNotificationService.EXTRA_AMOUNT, 0.0)
                val type = intent.getStringExtra(MomoNotificationService.EXTRA_TYPE) ?: "expense"
                val note = intent.getStringExtra(MomoNotificationService.EXTRA_NOTE) ?: "MoMo payment"
                val date = intent.getStringExtra(MomoNotificationService.EXTRA_DATE) ?: ""
                val timestamp = intent.getLongExtra(MomoNotificationService.EXTRA_TIMESTAMP, 0)

                if (amount > 0) {
                    Log.i("MainActivity", "MoMo transaction received: $amount ($type) - $note")
                    bridge.injectMomoTransaction(amount, type, note, date, timestamp)
                }
            }
        }

        val filter = IntentFilter(MomoNotificationService.ACTION_MOMO_TRANSACTION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(momoReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(momoReceiver, filter)
        }
    }

    override fun onDestroy() {
        momoReceiver?.let {
            try { unregisterReceiver(it) } catch (_: Exception) { }
        }
        super.onDestroy()
    }
}
