# St. Mina — إشعارات FCM للويب (GitHub Pages + Chrome Android)

هذه حزمة ويب منفصلة عن Android. تحتوي على صفحة الإعلانات الأصلية، Service Worker، كود تسجيل الجهاز، وCloud Functions لإرسال إشعار عند إنشاء رسالة وتنبيه History بعد 7 أيام.

## الملفات
- `notifications_fast_full.html`: نسخة صفحة الإعلانات الأصلية مع إضافة `web-fcm.js` قبل `</body>`.
- `web-fcm.js`: زر تفعيل الإشعارات وتسجيل Web Push token في Firestore.
- `firebase-messaging-sw.js`: استقبال إشعارات الخلفية وعرضها.
- `functions/index.js`: إرسال إشعار عند إنشاء مستند `notifications/{id}`، وجدولة تنبيه History يوميًا.
- `firebase.json`: إعداد نشر Cloud Functions.

## 1) إنشاء مفتاح VAPID
1. افتح Firebase Console للمشروع `st-mina-c01ec`.
2. Project settings > Cloud Messaging > Web Push certificates.
3. أنشئ/ولّد Web Push key pair وانسخ **المفتاح العام فقط**.
4. افتح `web-fcm.js` واستبدل `PASTE_YOUR_PUBLIC_VAPID_KEY_HERE` بالمفتاح العام.

لا تضع المفتاح الخاص أو Service Account داخل صفحات الويب أو GitHub.

## 2) GitHub Pages
1. انسخ `firebase-messaging-sw.js` و`web-fcm.js` إلى نفس مجلد الصفحة المنشورة، بجانب HTML.
2. تأكد أن ملفات الخدمة في جذر مسار الموقع المنشور الذي ستطلب منه الصفحة، وليس في مجلد مختلف.
3. ادفع التعديلات إلى GitHub وانتظر نشر GitHub Pages. يجب أن يكون الموقع على HTTPS.
4. افتح الموقع على Chrome في Android، اضغط زر **تفعيل إشعارات الجهاز** واسمح بالإشعارات.
5. جرّب الإشعار من Firebase Console > Messaging بإرسال Test message إلى token الجهاز (يمكن فحصه في Firestore `fcmTokens`).

إذا كانت الصفحة منشورة باسم مختلف عن `notifications_fast_full.html`، عدّل URL في `functions/index.js` لاسم الصفحة الفعلي.

## 3) نشر Cloud Functions
ثبّت Firebase CLI على الكمبيوتر، ثم من مجلد الحزمة:

```bash
npm install -g firebase-tools
firebase login
firebase use st-mina-c01ec
cd functions
npm install
cd ..
firebase deploy --only functions
```

قد تحتاج تفعيل الفوترة/الخطة المناسبة لاستخدام Cloud Functions والجدولة. تحقق من خطة مشروعك قبل النشر. الوظيفة المجدولة تنفذ يوميًا في 10:00 بتوقيت القاهرة.

## 4) شكل مستندات الإشعارات
الوظيفة الحالية تفترض أن الرسالة الجديدة تُضاف إلى `notifications` وأن الحقول المتوافقة تشمل:
- `title`: عنوان الرسالة
- `message`: نص الرسالة
- `targetGrade`: الصف المستهدف أو `all`
- `timestamp`: وقت إنشاء الرسالة (Firestore Timestamp)
- `type: "announcement"` لرسائل الإعلانات التي تدخل History

تأكد أن الحقول هذه تطابق كودك الفعلي. لا تُعدّل كل مستندات `notifications` القديمة لاختبار الوظيفة حتى لا ترسل تنبيهات غير مقصودة.

## 5) الأمان — لازم قبل استخدامه مع ناس حقيقيين
- هذا الكود التجريبي يحفظ الرمز في `fcmTokens` ويستخدم `grade` من بيانات المتصفح؛ هذا ليس نظام صلاحيات آمنًا بمفرده.
- لا تسمح بقواعد Firestore العامة بقراءة أو حذف رموز أجهزة الآخرين. اربط الرمز بمستخدم موثّق (Firebase Auth أو تحقق موثوق) وضع قواعد Firestore مناسبة قبل نشره على مستخدمين حقيقيين.
- Cloud Functions ترسل الإشعارات من جهة السيرفر باستخدام Admin SDK؛ لا ترسل FCM من الواجهة الأمامية ولا تضع مفاتيح خادم فيها.

## 6) الصوت والقيود
Chrome/Android يتحكم في صوت إشعار الويب حسب إعدادات إشعارات الموقع والجهاز ووضع الصامت. الويب لا يستطيع فرض ملف صوت مخصص في إشعار النظام. قد لا تصل الإشعارات إذا أُغلقت صلاحيات الموقع أو تم إيقاف عمل Chrome بالخلفية أو قطع الإنترنت.

## 7) ملاحظات History
الوظيفة المجدولة تبحث يوميًا عن رسائل `announcement` التي مرّ على `timestamp` الخاص بها 7 أيام، ثم ترسل إشعارًا واحدًا لكل رسالة وتضع `historyPushSent: true`. إذا كان نظام History الحالي يعتمد على قاعدة مختلفة (مثلاً نقل المستند إلى مجموعة أخرى)، عدّل الوظيفة لتطابق منطق البرنامج قبل النشر.
