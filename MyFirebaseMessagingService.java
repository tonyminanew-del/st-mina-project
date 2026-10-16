package com.example.st_mina; // غيّر هذا السطر لاسم package الحقيقي في مشروعك

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "st_mina_general";

    @Override public void onMessageReceived(RemoteMessage message) {
        String title = message.getData().get("title");
        String body = message.getData().get("body");
        if (title == null || title.trim().isEmpty()) title = "St. Mina";
        if (body == null || body.trim().isEmpty()) body = "لديك إشعار جديد";
        showNotification(title, body, message.getData().get("url"));
    }

    private void showNotification(String title, String body, String url) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "إشعارات St. Mina", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("إعلانات ورسائل الكنيسة");
            channel.enableVibration(true);
            channel.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI,
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build());
            manager.createNotificationChannel(channel);
        }
        Intent intent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (intent == null) intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (url != null) intent.putExtra("notification_url", url);
        PendingIntent pending = PendingIntent.getActivity(this, (int)System.currentTimeMillis(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title).setContentText(body).setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).setContentIntent(pending)
            .setDefaults(NotificationCompat.DEFAULT_SOUND | NotificationCompat.DEFAULT_VIBRATE);
        manager.notify((int)(System.currentTimeMillis() & 0x7fffffff), builder.build());
    }

    @Override public void onNewToken(String token) {
        // JavaScript bridge reads the latest token using FirebaseMessaging.getInstance().getToken().
    }
}
