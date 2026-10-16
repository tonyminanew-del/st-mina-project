/* دمج هذا الجزء داخل script type="module" في صفحة الويب بعد إنشاء db وتعريف myGrade */
/* يعتمد على db وmyGrade والدوال المستوردة مسبقًا في سكربت الصفحة: collection, addDoc, query, where, getDocs, serverTimestamp, updateDoc */

async function registerAndroidFcmToken() {
  try {
    if (!window.AndroidFcm || typeof window.AndroidFcm.getToken !== "function") {
      console.info("Android FCM bridge is not available; page may be running in a normal browser.");
      return;
    }
    const token = await window.AndroidFcm.getToken();
    if (!token) return;
    const deviceId = window.AndroidFcm.getDeviceId();
    const tokensRef = collection(db, "fcmTokens");
    const existing = await getDocs(query(tokensRef, where("token", "==", token)));
    if (existing.empty) {
      await addDoc(tokensRef, {
        token,
        grade: (myGrade || "").trim(),
        deviceId: deviceId || "android-webview",
        platform: "android-webview",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    } else {
      const updateRef = existing.docs[0].ref;
      await updateDoc(updateRef, {
        grade: (myGrade || "").trim(),
        deviceId: deviceId || "android-webview",
        updatedAt: serverTimestamp()
      });
    }
    console.info("Android FCM token registered.");
  } catch (e) {
    console.error("FCM token registration failed:", e);
  }
}

// ينفذ عند تحميل الصفحة، ويمكن استدعاؤه مرة أخرى بعد تسجيل الدخول/تغيير الصف.
registerAndroidFcmToken();
