import os
import time
from firebase_admin import credentials, firestore, initialize_app
from plyer import notification

# تحديد المسار المطلق لملف الـ JSON تلقائياً وبدقة
current_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(current_dir, "serviceAccountKey.json")

# تهيئة الاتصال بفايربيس باستخدام الملف مباشرة
cred = credentials.Certificate(key_path)
initialize_app(cred)
db = firestore.client()

print("جاري الاستماع لطلبات المشتريات الجديدة عبر St. Mina...")

seen_notifications = set()


def check_new_notifications():
  try:
    notifications_ref = db.collection("notifications")
    docs = notifications_ref.stream()

    for doc in docs:
      data = doc.to_dict()
      doc_id = doc.id

      if doc_id not in seen_notifications:
        seen_notifications.add(doc_id)

        title = data.get("title", "طلب هدية جديد")
        message = data.get("message", "هناك عملية شراء جديدة تمت في المتجر.")

        notification.notify(
            title=title,
            message=message,
            app_name="St. Mina",
            app_icon=None,
            timeout=10,
        )
        print(f"تم رصد وإرسال إشعار: {message}")

  except Exception as e:
    print(f"حدث خطأ: {e}")


if __name__ == "__main__":
  while True:
    check_new_notifications()
    time.sleep(5)