<?php
// دالة للحصول على Access Token من حساب الخدمة لـ Firebase
function getAccessToken($serviceAccountPath) {
    if (!file_exists($serviceAccountPath)) {
        return null;
    }
    
    $serviceAccount = json_decode(file_get_contents($serviceAccountPath), true);
    
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $now = time();
    $payload = json_encode([
        'iss' => $serviceAccount['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signatureInput = $base64UrlHeader . "." . $base64UrlPayload;
    openssl_sign($signatureInput, $signature, $serviceAccount['private_key'], 'SHA256');
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]));
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $response['access_token'] ?? null;
}

// إرسال الإشعار عبر FCM HTTP v1 API
function sendFCMNotification($deviceToken, $title, $body) {
    $accessToken = getAccessToken('serviceAccountKey.json');
    if (!$accessToken) {
        echo "فشل في توليد Access Token (تأكد من مسار ملف serviceAccountKey.json)";
        return;
    }

    $projectId = "st-mina-c01ec";
    $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

    $message = [
        'message' => [
            'token' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body' => $body
            ]
        ]
    ];

    $headers = [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
    
    $result = curl_exec($ch);
    curl_close($ch);

    echo "نتيجة الإرسال: " . $result;
}

// ضع هنا الـ FCM Token الذي قنسخته من المتصفح
$token = "cEw_zAL_3k_FeU3zI21Piu:APA91bG42izYaxvzCy_b1_KvQyXJQIW3R_thO6tGysIHk-DPyEnElRwboa6C7yvKMrW4Lw_cNnJuaYs5cf5XnQM2vH_wlfsnF5tUorZNag6CZ05tQBPDqPU";
sendFCMNotification($token, "طلب جديد من St. Mina", "يوجد طلب شراء جديد بانتظار المراجعة.");
?>