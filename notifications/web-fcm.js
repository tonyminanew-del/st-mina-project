/* Include this file on a page served from GitHub Pages HTTPS. */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getMessaging, getToken, onMessage, isSupported } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBcUuUmMe8Lok8Ap7IspdQP5Zp8VHykUWE',
  authDomain: 'st-mina-c01ec.firebaseapp.com',
  databaseURL: 'https://st-mina-c01ec-default-rtdb.firebaseio.com',
  projectId: 'st-mina-c01ec',
  storageBucket: 'st-mina-c01ec.firebasestorage.app',
  messagingSenderId: '792349150559',
  appId: '1:792349150559:web:8a86bbf57c2c7e351f3aea',
  measurementId: 'G-XZGSBG05KR'
};

// REQUIRED: replace with the PUBLIC Web Push certificate key from Firebase Console.
const VAPID_PUBLIC_KEY = 'PASTE_YOUR_PUBLIC_VAPID_KEY_HERE';
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);

function getGrade() {
  // Adjust this mapping if your app stores the class/grade under a different field.
  for (const key of ['currentUser', 'userData', 'user', 'currentUserData']) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const value = JSON.parse(raw);
      const grade = value.grade || value.className || value.stageGrade || value.myGrade;
      if (grade) return String(grade);
    } catch (_) {}
  }
  return 'all'; // Works as a general registration only if your security/routing policy allows it.
}

async function enableStMinaPush() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('المتصفح لا يدعم إشعارات الويب. افتح الموقع في Chrome على Android.');
  }
  if (VAPID_PUBLIC_KEY.startsWith('PASTE_')) {
    throw new Error('ضع مفتاح Web Push (VAPID) العام من Firebase Console داخل web-fcm.js أولاً.');
  }
  if (!(await isSupported())) throw new Error('Firebase Messaging غير مدعوم في هذا المتصفح.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('لم يتم السماح بالإشعارات من إعدادات المتصفح.');

  const sw = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY, serviceWorkerRegistration: sw });
  if (!token) throw new Error('لم يتم إنشاء رمز الجهاز. تحقق من إعداد VAPID.');

  // NOTE: Before production, bind this token to a verified Firebase Auth user and secure Firestore rules.
  // Do not allow clients to read other users' tokens.
  const tokenId = await sha256(token);
  await setDoc(doc(db, 'fcmTokens', tokenId), {
    token,
    grade: getGrade(),
    platform: 'web',
    updatedAt: serverTimestamp()
  }, { merge: true });

  const status = $('webPushStatus');
  if (status) status.textContent = 'تم تفعيل إشعارات هذا الجهاز ✅';
  return token;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function addPushButton() {
  if ($('enableWebPushBtn')) return;
  const box = document.createElement('section');
  box.id = 'webPushCard';
  box.dir = 'rtl';
  box.style.cssText = 'margin:16px auto;padding:16px;max-width:900px;background:#fff;border:1px solid #eadfe1;border-radius:16px;box-shadow:0 5px 18px rgba(20,30,50,.05);font-family:Cairo,Tajawal,sans-serif;color:#1f1715';
  box.innerHTML = '<strong style="display:block;margin-bottom:8px">🔔 إشعارات St. Mina</strong><p style="margin:0 0 12px;color:#737b88;font-size:13px">فعّل الإشعارات لتصلك الرسائل الجديدة وتنبيهات الـ History.</p><button id="enableWebPushBtn" type="button" style="border:0;border-radius:10px;padding:11px 16px;background:#7d1424;color:#fff;font-weight:700;cursor:pointer">تفعيل إشعارات الجهاز</button><div id="webPushStatus" role="status" style="margin-top:10px;font-size:13px"></div>';
  document.body.prepend(box);
  $('enableWebPushBtn').addEventListener('click', async () => {
    const btn = $('enableWebPushBtn'); btn.disabled = true; btn.textContent = 'جاري التفعيل...';
    try { await enableStMinaPush(); btn.textContent = 'الإشعارات مفعّلة ✓'; }
    catch (e) { $('webPushStatus').textContent = e.message || String(e); btn.disabled = false; btn.textContent = 'إعادة المحاولة'; }
  });
}

(async () => {
  addPushButton();
  if (await isSupported().catch(() => false)) {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'St. Mina';
      const body = payload.notification?.body || payload.data?.body || 'لديك رسالة جديدة';
      const status = $('webPushStatus');
      if (status) status.textContent = `رسالة جديدة: ${title} — ${body}`;
      // Browser notifications while the page is foregrounded are not forced here to avoid duplicates.
    });
  }
})();
