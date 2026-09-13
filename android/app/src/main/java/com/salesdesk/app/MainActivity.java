package com.salesdesk.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
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
    }
}
