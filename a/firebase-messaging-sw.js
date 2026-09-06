importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBcUuUmMe8Lok8Ap7IspdQP5Zp8VHykUWE",
    authDomain: "st-mina-c01ec.firebaseapp.com",
    projectId: "st-mina-c01ec",
    storageBucket: "st-mina-c01ec.firebasestorage.app",
    messagingSenderId: "792349150559",
    appId: "1:792349150559:web:8a86bbf57c2c7e351f3aea"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828765.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});