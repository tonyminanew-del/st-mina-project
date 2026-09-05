from flask import Flask, jsonify, request
from firebase_admin import credentials, firestore, initialize_app

app = Flask(__name__)

# تهيئة الاتصال بفايربيس باستخدام ملف الاعتماد
cred = credentials.Certificate("serviceAccountKey.json")
initialize_app(cred)
db = firestore.client()


@app.route("/")
def home():
  return "St. Mina Server is Running & Listening for Orders!"


# نقطة نهاية (API) لاستقبال أو فحص الطلبات الجديدة وإرسالها
@app.route("/api/check-orders", methods=["GET"])
def check_orders():
  try:
    notifications_ref = db.collection("notifications")
    docs = notifications_ref.order_by(
        "timestamp", direction=firestore.Query.DESCENDING
    ).limit(5)
    orders = []

    for doc in docs.stream():
      data = doc.to_dict()
      # تحويل التاريخ ليكون قابلاً للعرض بصيغة JSON
      if "timestamp" in data and data["timestamp"]:
        data["timestamp"] = data["timestamp"].isoformat()
      data["id"] = doc.id
      orders.append(data)

    return jsonify({"status": "success", "orders": orders}), 200
  except Exception as e:
    return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True)