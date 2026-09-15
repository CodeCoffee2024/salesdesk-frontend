package com.salesdesk.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Must run before super.onCreate() — this is what makes the
        // core-splashscreen compat library actually draw
        // AppTheme.NoActionBarLaunch's icon/background on Android < 12.
        // Android 12+ draws its platform splash screen automatically from the
        // same theme attributes without this call, which is why the logo only
        // showed there and not on older versions.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Android 15+ (targetSdk 35+, this app ships 36) forces edge-to-edge
        // rendering with no way to opt out — Window.setDecorFitsSystemWindows()
        // (what @capacitor/status-bar's setOverlaysWebView(false) used to call
        // under the hood) is a documented no-op past that target. The WebView
        // draws under the status/nav bars regardless, and
        // env(safe-area-inset-top) (already used by topbar/sidebar SCSS) isn't
        // fed real values by Android's WebView the way Safari feeds it on iOS,
        // so that CSS alone does nothing here.
        //
        // Calling setDecorFitsSystemWindows(false) explicitly (even though the
        // OS already forces this) is what Android's own edge-to-edge migration
        // guide calls for before wiring a manual insets listener — it's what
        // actually configures the window's insets dispatch correctly, rather
        // than relying on the forced default alone. requestApplyInsets() then
        // forces an immediate dispatch, since the WebView wasn't attached yet
        // the first time insets were computed for this window (a listener
        // registered after that has to explicitly ask for a re-dispatch, or it
        // just never fires until something else — a rotation, a keyboard —
        // triggers one).
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(
            webView,
            (view, windowInsets) -> {
                Insets systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                view.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
                return windowInsets;
            }
        );
        ViewCompat.requestApplyInsets(webView);
    }
}
