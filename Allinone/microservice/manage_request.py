from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

@app.route('/manage_request', methods=['PUT'])
def manage_request():
    try:
        data = request.json

        request_id = data.get("request_id")
        status = data.get("status")  # either 'Approved' or 'Rejected'
        remarks = data.get("remarks", "")  # optional remarks from the manager

        if not request_id or not status or status not in ['Approved', 'Rejected']:
            return jsonify({"message": "Invalid data", 
                            "code": 400}), 400

        # 1: fetch request from database via arrangement.py
        fetch_response = requests.get(f"{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}")
        
        if fetch_response.status_code != 200:
            return jsonify({"message": "Failed to fetch request from database", 
                            "code": 404}), 404
        
        request_entry = fetch_response.json().get("data")
        staff_id = request_entry.get("staff_id")

        # 2: fetch staff email from employee.py using staff_id
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")
        
        if employee_response.status_code != 200:
            return jsonify({"message": "Failed to fetch employee details", 
                            "code": 404}), 404

        employee_data = employee_response.json().get("data")
        staff_email = employee_data.get("email")

        if not staff_email:
            return jsonify({"message": "Staff email not found", 
                            "code": 404}), 404
        
        # 3: update the request status
        arrangement_update_data = {
            "request_id": request_id,
            "status": status,
            "remarks": remarks
        }

        update_response = requests.put(f"{REQUEST_LOG_MICROSERVICE_URL}/update_request/{request_id}", json=arrangement_update_data)
        
        if update_response.status_code != 200:
            return jsonify({"message": "Failed to update request status", 
                            "code": 500}), 500

        # 4: call notification.py to notify the staff of the updated status
        notification_data = {
            "staff_email": staff_email,  
            "status": status,
            "request_id": request_id,
            "remarks": remarks
        }

        notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/notify_status_update", json=notification_data)

        if notification_response.status_code != 200:
            return jsonify({"message": "Request status updated but failed to notify staff", 
                            "code": 500}), 500

        return jsonify({
            "message": f"Request {status} successfully and staff notified",
            "code": 200
        }), 200

    except Exception as e:
        app.logger.error(f"Failed to manage request: {e}")
        return jsonify({"message": "Internal server error", 
                        "code": 500}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)  