package com.example.expensemanagement

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import android.os.Message
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

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Enable WebView debugging ONLY in debuggable builds
        if ((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

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
                val uri = request.url
                if (isAllowedWebViewUrl(uri)) {
                    return false
                }
                // Open external URLs safely in the system browser
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, uri))
                } catch (_: Exception) { }
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
                        val uri = request.url
                        if (isAllowedWebViewUrl(uri)) {
                            return false
                        }
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, uri))
                        } catch (_: Exception) { }
                        return true
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

        // Xử lý nút Back cho Android 13+ (đóng modal / đóng sidebar / về Dashboard trước khi thoát)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    """
                    (function() {
                      var modal = document.getElementById('delete-modal');
                      if (modal && modal.classList.contains('open') && typeof closeModal === 'function') {
                        closeModal();
                        return 'handled';
                      }
                      var sb = document.getElementById('sidebar');
                      if (sb && sb.classList.contains('open') && typeof closeSidebar === 'function') {
                        closeSidebar();
                        return 'handled';
                      }
                      var dash = document.getElementById('page-dashboard');
                      if (dash && !dash.classList.contains('active') && typeof navigate === 'function') {
                        navigate('dashboard');
                        return 'handled';
                      }
                      return 'exit';
                    })();
                    """.trimIndent()
                ) { result ->
                    if (result != "\"handled\"") {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
            }
        })
    }

    private fun isAllowedWebViewUrl(uri: Uri?): Boolean {
        val scheme = uri?.scheme?.lowercase() ?: return false
        val host = uri.host?.lowercase() ?: return false
        if (scheme != "https") return false
        return host == "appassets.androidplatform.net" ||
            host == "accounts.google.com" ||
            host == "accounts.youtube.com" ||
            host == "apis.google.com" ||
            host == "www.gstatic.com" ||
            host == "ssl.gstatic.com" ||
            host.endsWith(".google.com") ||
            host.endsWith(".firebaseapp.com") ||
            host.endsWith(".googleapis.com") ||
            host.endsWith(".gstatic.com")
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(wv: WebView) {
        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportMultipleWindows(true)
            javaScriptCanOpenWindowsAutomatically = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            textZoom = 100
            // Enable zoom in/out
            setSupportZoom(true)
            builtInZoomControls = true
            displayZoomControls = false // Hide the zoom buttons (pinch to zoom will still work)
            // Use a standard mobile Chrome User-Agent to bypass the "disallowed_useragent" error
            userAgentString = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
        }
    }
}
