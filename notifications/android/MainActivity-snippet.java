/* ادمج الأجزاء التالية داخل MainActivity الحالية، ولا تستبدل الملف بالكامل.
   عدّل اسم WebView إلى الاسم الموجود عندك، وغيّر package/imports حسب مشروعك. */

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.UUID;

private String fcmToken = "";
private final String deviceId = UUID.randomUUID().toString();

// بعد webView.getSettings().setJavaScriptEnabled(true) وقبل loadUrl:
// webView.addJavascriptInterface(new AndroidFcmBridge(), "AndroidFcm");
// اطلب الإذن بعد بدء الشاشة: requestNotificationPermissionIfNeeded();

private class AndroidFcmBridge {
    @JavascriptInterface public String getToken() {
        try {
            com.google.android.gms.tasks.Tasks.await(FirebaseMessaging.getInstance().getToken());
            return com.google.android.gms.tasks.Tasks.await(FirebaseMessaging.getInstance().getToken());
        } catch (Exception e) { return ""; }
    }
    @JavascriptInterface public String getDeviceId() { return deviceId; }
}

private void requestNotificationPermissionIfNeeded() {
    if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 707);
    }
}
