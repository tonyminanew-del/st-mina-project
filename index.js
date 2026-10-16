const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const REGION = 'europe-west1';
const DAY_MS = 24 * 60 * 60 * 1000;

async function sendToGrade(grade, title, body, url = 'notifications_fast_full.html') {
  let q = db.collection('fcmTokens');
  if (grade && grade !== 'all') q = q.where('grade', '==', grade);
  const snap = await q.get();
  const tokens = [...new Set(snap.docs.map(d => d.get('token')).filter(Boolean))];
  if (!tokens.length) return;
  // FCM multicast accepts at most 500 tokens per request.
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: chunk,
      data: { title: String(title || 'St. Mina'), body: String(body || ''), url: String(url) },
      android: { priority: 'high' }
    });
    const invalid = [];
    response.responses.forEach((r, index) => {
      if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) invalid.push(chunk[index]);
    });
    if (invalid.length) {
      const docs = await db.collection('fcmTokens').where('token', 'in', invalid.slice(0, 30)).get();
      const batch = db.batch(); docs.docs.forEach(d => batch.delete(d.ref)); await batch.commit();
    }
  }
}

// يرسل إشعارًا عند إضافة رسالة جديدة إلى notifications.
exports.pushNewNotification = onDocumentCreated({ document: 'notifications/{notificationId}', region: REGION }, async event => {
  const data = event.data?.data();
  if (!data || data.suppressPush === true) return;
  const grade = String(data.targetGrade || 'all').trim() || 'all';
  await sendToGrade(grade, data.title || 'رسالة جديدة من الكنيسة', data.message || 'تمت إضافة رسالة جديدة', 'notifications_fast_full.html');
});

// كل يوم: يرسل مرة واحدة تنبيه History لكل رسالة عمرها 7 أيام أو أكثر.
exports.pushHistoryAfterSevenDays = onSchedule({ schedule: 'every day 10:00', timeZone: 'Africa/Cairo', region: REGION }, async () => {
  const cutoff = Timestamp.fromMillis(Date.now() - 7 * DAY_MS);
  const snap = await db.collection('notifications').where('timestamp', '<=', cutoff).limit(300).get();
  for (const item of snap.docs) {
    const data = item.data();
    if (data.historyPushSent === true || data.type !== 'announcement') continue;
    const title = data.title || 'رسالة قديمة';
    const grade = String(data.targetGrade || 'all').trim() || 'all';
    await sendToGrade(grade, 'تمت إضافة رسالة إلى الهيستوري', `أصبحت الرسالة القديمة ضمن History: ${title}`, 'notifications_fast_full.html');
    await item.ref.update({ historyPushSent: true, historyPushSentAt: FieldValue.serverTimestamp() });
  }
});
