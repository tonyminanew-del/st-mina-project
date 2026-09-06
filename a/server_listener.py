import firebase_admin
from firebase_admin import credentials, messaging

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

def send_push_notification(device_token, title, body):
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        token=device_token,
    )

    try:
        response = messaging.send(message)
        print('تم إرسال الإشعار بنجاح:', response)
    except Exception as e:
        print('فشل إرسال الإشعار:', e)

if __name__ == "__main__":
    # حط الـ Token الحقيقي هنا بين العلامتين
    sample_token = "انسخ_التوكن_الطويل_من_الكونسول_هنا"
    
    send_push_notification(
        device_token=sample_token, 
        title="طلب جديد من St. Mina", 
        body="يوجد طلب شراء جديد بانتظار المراجعة."
    )