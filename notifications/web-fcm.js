
/* ==========================================
   St. Mina — Smart Web Push
   GitHub Pages + Firebase Messaging
========================================== */

import {
  initializeApp,
  getApps
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  isSupported
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js';

import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';


/* 1. FIREBASE */

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

const VAPID_PUBLIC_KEY =
  'BNkdrW0VTl67BA5b1Jgl6AD4d1r4ePRPUBLqVSJfYfd2CZeD1nFw_9-eUChV_VPKsfi6aD8qDHQuJaYjWuv0TEQ';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

let messaging = null;
let swRegistration = null;
let isBusy = false;

const $ = id => document.getElementById(id);
const DISABLED_KEY = 'stMinaPushDisabled';


/* 2. USER GRADE */

function getGrade() {
  const keys = [
    'servantGrade',
    'currentUser',
    'userData',
    'user',
    'currentUserData'
  ];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let value = raw;

      try {
        value = JSON.parse(raw);
      } catch {}

      if (key === 'servantGrade' &&
          typeof value === 'string' &&
          value.trim()) {
        return value.trim();
      }

      if (value && typeof value === 'object') {
        const grade =
          value.servantGrade ||
          value.grade ||
          value.className ||
          value.stageGrade ||
          value.myGrade;

        if (grade) return String(grade).trim();
      }
    } catch (error) {
      console.warn('تعذر قراءة الصف:', error);
    }
  }

  return '';
}


/* 3. TOKEN ID */

async function sha256(value) {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );

  return [...new Uint8Array(hash)]
    .map(n => n.toString(16).padStart(2, '0'))
    .join('');
}


/* 4. UI DESIGN */

function addStyles() {
  if ($('stMinaPushStyles')) return;

  const style = document.createElement('style');
  style.id = 'stMinaPushStyles';

  style.textContent = `
    #webPushCard {
      direction: rtl;
      box-sizing: border-box;
      width: calc(100% - 24px);
      max-width: 900px;
      margin: 18px auto;
      padding: 20px;
      color: #30213D;
      background: #fff;
      border: 1px solid #ECE9E5;
      border-radius: 20px;
      box-shadow: 0 8px 28px rgba(48,33,61,.055);
      font-family: Cairo, sans-serif;
    }

    #webPushCard * {
      box-sizing: border-box;
    }

    #webPushCard .push-heading {
      display: flex;
      align-items: center;
      gap: 13px;
    }

    #webPushCard .push-icon {
      width: 50px;
      height: 50px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 16px;
      color: #30213D;
      background: #F5F0E5;
      font-size: 21px;
    }

    #webPushCard .push-heading-text {
      flex: 1;
      min-width: 0;
    }

    #webPushCard .push-title {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 800;
    }

    #webPushCard .push-subtitle {
      color: #77716D;
      font-size: 12px;
      line-height: 1.8;
    }

    #webPushCard .push-status-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 19px 0 14px;
      padding: 13px;
      border: 1px solid #ECE9E5;
      border-radius: 14px;
      background: #FAF9F7;
    }

    #webPushCard .push-status-dot {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      margin-top: 6px;
      border-radius: 50%;
      background: #B79A63;
    }

    #webPushCard .push-status-dot[data-state="success"] {
      background: #39815C;
    }

    #webPushCard .push-status-dot[data-state="error"] {
      background: #B84B45;
    }

    #webPushCard .push-status-title {
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 3px;
    }

    #webPushCard .push-status-message {
      color: #77716D;
      font-size: 12px;
      line-height: 1.9;
      overflow-wrap: anywhere;
    }

    #webPushCard .push-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
    }

    #webPushCard .push-btn {
      min-height: 45px;
      padding: 10px 12px;
      border-radius: 12px;
      font-family: Cairo, sans-serif;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      transition: opacity .2s, transform .2s;
    }

    #webPushCard .push-btn:active {
      transform: scale(.98);
    }

    #webPushCard .push-btn:disabled {
      opacity: .55;
      cursor: wait;
    }

    #webPushCard .push-primary {
      color: white;
      background: #30213D;
      border: 1px solid #30213D;
    }

    #webPushCard .push-secondary {
      color: #30213D;
      background: white;
      border: 1px solid #E4DFD8;
    }

    #webPushCard .push-danger {
      width: 100%;
      margin-top: 9px;
      color: #8B403B;
      background: #fff;
      border: 1px solid #EBD9D7;
    }

    #webPushCard .push-note {
      margin: 13px 0 0;
      color: #8A8580;
      font-size: 11px;
      line-height: 1.9;
    }

    @media(max-width:380px) {
      #webPushCard {
        padding: 15px;
      }

      #webPushCard .push-actions {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}


function addPushCard() {
  if ($('webPushCard')) return;

  addStyles();

  const card = document.createElement('section');
  card.id = 'webPushCard';

  card.innerHTML = `
    <div class="push-heading">
      <div class="push-icon" aria-hidden="true">
        <i class="fas fa-bell"></i>
      </div>

      <div class="push-heading-text">
        <div class="push-title">إشعارات St. Mina</div>
        <div class="push-subtitle">
          الإعلانات والتنبيهات المهمة الخاصة بالكنيسة
        </div>
      </div>
    </div>

    <div class="push-status-box" aria-live="polite" role="status">
      <span id="pushStatusDot" class="push-status-dot"></span>
      <div>
        <div id="pushStatusTitle" class="push-status-title">
          جاري فحص الإشعارات...
        </div>
        <div id="webPushStatus" class="push-status-message">
          لحظة واحدة من فضلك.
        </div>
      </div>
    </div>

    <div class="push-actions">
      <button id="enableWebPushBtn"
              class="push-btn push-primary"
              type="button">
        <i class="fas fa-bell"></i>
        تفعيل الإشعارات
      </button>

      <button id="testWebPushBtn"
              class="push-btn push-secondary"
              type="button">
        <i class="fas fa-paper-plane"></i>
        اختبار الإشعار
      </button>

      <button id="pushSettingsBtn"
              class="push-btn push-secondary"
              type="button">
        <i class="fas fa-gear"></i>
        إعدادات الإشعارات
      </button>

      <button id="refreshPushStatusBtn"
              class="push-btn push-secondary"
              type="button">
        <i class="fas fa-rotate"></i>
        تحديث الحالة
      </button>
    </div>

    <button id="disableWebPushBtn"
            class="push-btn push-danger"
            type="button">
      <i class="fas fa-bell-slash"></i>
      إيقاف إشعارات هذا الجهاز
    </button>

    <p class="push-note">
      حالة التفعيل تخص هذا المتصفح على هذا الجهاز.
      وصول الإشعارات في الخلفية يحتاج أيضًا إلى إعداد
      خدمة Firebase للإرسال.
    </p>
  `;

  // Keep the card inside the current page without replacing its content.
  document.body.prepend(card);

  $('enableWebPushBtn').addEventListener('click', enablePush);
  $('testWebPushBtn').addEventListener('click', testNotification);
  $('pushSettingsBtn').addEventListener('click', showSettingsHelp);
  $('refreshPushStatusBtn').addEventListener('click', refreshStatus);
  $('disableWebPushBtn').addEventListener('click', disablePush);
}


/* 5. STATUS */

function setStatus(title, message, state = 'normal') {
  if ($('pushStatusTitle')) {
    $('pushStatusTitle').textContent = title;
  }

  if ($('webPushStatus')) {
    $('webPushStatus').textContent = message;
  }

  if ($('pushStatusDot')) {
    $('pushStatusDot').dataset.state =
      state === 'success' ? 'success' :
      state === 'error' ? 'error' : 'normal';
  }

  const enable = $('enableWebPushBtn');
  const disable = $('disableWebPushBtn');
  const test = $('testWebPushBtn');

  if (enable) {
    enable.hidden = state === 'success';
  }

  if (disable) {
    disable.hidden = state !== 'success';
  }

  if (test) {
    test.disabled =
      !('Notification' in window) ||
      Notification.permission !== 'granted';
  }
}


/* 6. REGISTER SERVICE WORKER */

async function getServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('المتصفح لا يدعم خدمة الإشعارات.');
  }

  if (!window.isSecureContext) {
    throw new Error('افتح الموقع من رابط HTTPS.');
  }

  if (!swRegistration) {
    // This path assumes the SW is beside this JS file.
    swRegistration = await navigator.serviceWorker.register(
      './firebase-messaging-sw.js'
    );
  }

  await navigator.serviceWorker.ready;
  return swRegistration;
}


/* 7. SAVE DEVICE TOKEN */

async function saveDeviceToken(token) {
  const tokenId = await sha256(token);

  await setDoc(
    doc(db, 'fcmTokens', tokenId),
    {
      token,
      grade: getGrade(),
      platform: 'web',
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}


/* 8. ACTIVATE */

async function enablePush() {
  if (isBusy) return;
  isBusy = true;

  const btn = $('enableWebPushBtn');
  btn.disabled = true;
  btn.textContent = 'جاري التفعيل...';

  try {
    if (!('Notification' in window)) {
      throw new Error('هذا المتصفح لا يدعم إشعارات الويب.');
    }

    if (!(await isSupported())) {
      throw new Error('Firebase Messaging غير مدعوم في هذا المتصفح.');
    }

    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.length < 50) {
      throw new Error('تحقق من مفتاح VAPID العام في Firebase.');
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      throw new Error(
        permission === 'denied'
          ? 'الإذن مرفوض. غيّره من إعدادات الموقع في المتصفح.'
          : 'لم يتم السماح بالإشعارات.'
      );
    }

    setStatus(
      'جاري تسجيل الجهاز',
      'جاري تجهيز خدمة الإشعارات وحفظ رمز الجهاز.'
    );

    const registration = await getServiceWorker();
    messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      throw new Error(
        'لم يتم إنشاء رمز الجهاز. راجع إعدادات Firebase وVAPID.'
      );
    }

    await saveDeviceToken(token);

    localStorage.removeItem(DISABLED_KEY);

    setStatus(
      'الإشعارات مفعّلة',
      'تم السماح بالإشعارات وتسجيل هذا الجهاز بنجاح.',
      'success'
    );

  } catch (error) {
    console.error('St. Mina Push:', error);

    setStatus(
      'تعذر تفعيل الإشعارات',
      error.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.',
      'error'
    );
  } finally {
    isBusy = false;
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fas fa-bell"></i> تفعيل الإشعارات';
  }
}


/* 9. CHECK CURRENT STATUS */

async function refreshStatus() {
  if (!('Notification' in window)) {
    setStatus(
      'الإشعارات غير مدعومة',
      'جرّب متصفحًا يدعم إشعارات الويب.',
      'error'
    );
    return;
  }

  if (localStorage.getItem(DISABLED_KEY) === '1') {
    setStatus(
      'الإشعارات متوقفة',
      'أوقفت الإشعارات من داخل البرنامج على هذا الجهاز.',
      'normal'
    );
    return;
  }

  if (Notification.permission === 'denied') {
    setStatus(
      'الإذن مرفوض',
      'افتح إعدادات الموقع في المتصفح واسمح بالإشعارات.',
      'error'
    );
    return;
  }

  if (Notification.permission !== 'granted') {
    setStatus(
      'الإشعارات غير مفعّلة',
      'اضغط على تفعيل الإشعارات للسماح لهذا الجهاز.',
      'normal'
    );
    return;
  }

  try {
    if (!(await isSupported())) {
      throw new Error('Firebase Messaging غير مدعوم.');
    }

    const registration = await getServiceWorker();
    messaging = getMessaging(app);

    // Permission already granted: no permission prompt is shown here.
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      throw new Error('لم يتم العثور على رمز تسجيل الجهاز.');
    }

    await saveDeviceToken(token);

    setStatus(
      'الإشعارات مفعّلة',
      'الإذن مسموح والجهاز مسجّل لاستقبال رسائل Firebase.',
      'success'
    );

  } catch (error) {
    console.error('Push status check:', error);

    setStatus(
      'الإذن مسموح لكن التسجيل غير مكتمل',
      error.message || 'تعذر التحقق من تسجيل الجهاز.',
      'error'
    );
  }
}


/* 10. TEST LOCAL NOTIFICATION */

async function testNotification() {
  if (!('Notification' in window) ||
      Notification.permission !== 'granted') {
    setStatus(
      'فعّل الإشعارات أولًا',
      'لا يمكن اختبار الإشعار قبل السماح به.',
      'normal'
    );
    return;
  }

  try {
    const registration = await getServiceWorker();

    await registration.showNotification('St. Mina', {
      body: 'تم اختبار عرض الإشعار على هذا الجهاز بنجاح.',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'st-mina-local-test',
      data: { url: './' }
    });

    setStatus(
      'تم إرسال اختبار محلي',
      'ظهر طلب عرض إشعار من الجهاز. هذا الاختبار لا يختبر إرسال Firebase من الخادم.',
      'success'
    );
  } catch (error) {
    console.error('Notification test:', error);

    setStatus(
      'فشل اختبار الإشعار',
      error.message || 'تعذر عرض إشعار الاختبار.',
      'error'
    );
  }
}


/* 11. TURN OFF THIS DEVICE */

async function disablePush() {
  if (isBusy) return;

  const confirmed = window.confirm(
    'هل تريد إيقاف إشعارات St. Mina على هذا الجهاز؟\n\n' +
    'سيتم إلغاء تسجيل رمز Firebase المحلي. ' +
    'إذن المتصفح نفسه لن يُلغى من هنا.'
  );

  if (!confirmed) return;

  isBusy = true;
  const btn = $('disableWebPushBtn');
  btn.disabled = true;

  try {
    if (!(await isSupported())) {
      throw new Error('لا يمكن الوصول إلى Firebase Messaging.');
    }

    messaging = getMessaging(app);

    // Get the current token so its corresponding Firestore document can be deleted.
    let token = null;

    if (Notification.permission === 'granted') {
      try {
        const registration = await getServiceWorker();

        token = await getToken(messaging, {
          vapidKey: VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration
        });
      } catch (error) {
        console.warn('تعذر قراءة الرمز الحالي:', error);
      }
    }

    // Delete the server-side record first, so failure does not silently
    // leave the token registered in Firestore.
    if (token) {
      const tokenId = await sha256(token);
      await deleteDoc(doc(db, 'fcmTokens', tokenId));
    }

    const deleted = await deleteToken(messaging);

    if (!deleted && token) {
      throw new Error('تعذر إلغاء تسجيل رمز Firebase.');
    }

    localStorage.setItem(DISABLED_KEY, '1');

    setStatus(
      'الإشعارات متوقفة',
      'تم إيقاف تسجيل الإشعارات من داخل البرنامج على هذا الجهاز.',
      'normal'
    );

  } catch (error) {
    console.error('Disable push:', error);

    setStatus(
      'تعذر إيقاف التسجيل بالكامل',
      error.message || 'راجع اتصالك وقواعد Firestore ثم حاول مرة أخرى.',
      'error'
    );
  } finally {
    isBusy = false;
    btn.disabled = false;
  }
}


/* 12. BROWSER SETTINGS HELP */

function showSettingsHelp() {
  const message =
    'لتغيير إذن الإشعارات أو إلغائه:\n\n' +
    'Chrome على الكمبيوتر:\n' +
    'اضغط على رمز إعدادات الموقع بجوار العنوان، ' +
    'ثم الأذونات ثم الإشعارات.\n\n' +
    'Chrome على Android:\n' +
    'معلومات الموقع ← الأذونات ← الإشعارات.\n\n' +
    'iPhone:\n' +
    'إذا أضفت الموقع إلى الشاشة الرئيسية، راجع ' +
    'إعدادات iOS ← الإشعارات، أو إعدادات الموقع المتاحة في Safari.\n\n' +
    'قد تختلف الخطوات حسب الجهاز وإصدار النظام.';

  window.alert(message);
}


/* 13. FOREGROUND MESSAGES */

async function startForegroundMessages() {
  try {
    if (!(await isSupported())) return;

    messaging = getMessaging(app);

    onMessage(messaging, payload => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        'St. Mina';

      const body =
        payload.notification?.body ||
        payload.data?.body ||
        'لديك رسالة جديدة من الكنيسة';

      setStatus(
        'وصل إشعار جديد',
        `${title} — ${body}`,
        'success'
      );

      // Your existing page can also update its notification list here.
      // Do not show another system notification here, to avoid duplicates.
    });
  } catch (error) {
    console.error('Foreground messaging:', error);
  }
}


/* 14. KEEP STATUS UPDATED */

function startStatusMonitoring() {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshStatus();
  });

  window.addEventListener('focus', refreshStatus);

  // Check if browser permission state can be observed.
  if (navigator.permissions?.query) {
    navigator.permissions.query({ name: 'notifications' })
      .then(permissionStatus => {
        permissionStatus.onchange = refreshStatus;
      })
      .catch(() => {});
  }
}


/* 15. START */

function startStMinaPush() {
  addPushCard();
  startForegroundMessages();
  startStatusMonitoring();
  refreshStatus();
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    startStMinaPush,
    { once: true }
  );
} else {
  startStMinaPush();
}
