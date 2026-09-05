// استيراد سكربتات فايربيس للعمل في الخلفية
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// تهيئة فايربيس باستخدام بيانات مشروعك الحقيقية
firebase.initializeApp({
  apiKey: "AIzaSyBcUuUmMe8Lok8Ap7IspdQP5Zp8VHykUWE",
  authDomain: "st-mina-c01ec.firebaseapp.com",
  databaseURL: "https://st-mina-c01ec-default-rtdb.firebaseio.com",
  projectId: "st-mina-c01ec",
  storageBucket: "st-mina-c01ec.firebasestorage.app",
  messagingSenderId: "792349150559",
  appId: "1:792349150559:web:8a86bbf57c2c7e351f3aea",
  measurementId: "G-XZGSBG05KR"
});

const messaging = firebase.messaging();

// التعامل مع الإشعارات عندما يكون التطبيق في الخلفية أو مغلقاً
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || "طلب هدية جديد";
  const notificationOptions = {
    body: payload.notification.body || "هناك عملية شراء جديدة تمت في المتجر.",
    icon: "/icon.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});