from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

# Route to handle the make request scenario
@app.route('/make_request', methods=['POST'])
def make_request():
    try:
        data = request.json

        # 1. Verify Employee exists using Employee Microservice
        staff_id = data.get("staff_id")
        employee_verification = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")

        if employee_verification.status_code == 200:
            employee_data = employee_verification.json()
            
            # Log employee data in terminal
            app.logger.info(f"Employee found: {employee_data}")

            # 2. Create WFH Request using Arrangement Microservice
            arrangement_data = {
                "staff_id": staff_id,
                "manager_id": data.get("manager_id"),
                "request_date": data.get("request_date"),
                "arrangement_date" : data.get("arrangement_date"),
                "timeslot": data.get("timeslot"),
                "reason": data.get("reason")
            }
            print(arrangement_data)

            # Send POST request to create a WFH request
            arrangement_response = requests.post(f"{REQUEST_LOG_MICROSERVICE_URL}/create_request", json=arrangement_data)

            if arrangement_response.status_code == 201:
                created_request = arrangement_response.json().get("data")
                manager_id = created_request.get("manager_id")

                # 3. Retrieve the manager's email using Employee Microservice
                employee_response =  requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/manager_email/{manager_id}")

                if employee_response.status_code == 200:
                    manager_email = employee_response.json().get("manager_email")

                    # 4. Send a notification to the manager using Notification Microservice
                    notification_data = {
                        "manager_email": manager_email,
                        "staff_id": staff_id,
                        "request_date": created_request.get("request_date"),
                        "timeslot": created_request.get("timeslot"),
                        "reason": created_request.get("reason"),
                        "request_id": created_request.get("request_id")
                    }

                    notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/request_sent", json=notification_data)

                    if notification_response.status_code == 200:
                        return jsonify({
                            "message": "Request created and manager notified successfully",
                            "request_data": created_request,
                            "code": 201
                    }), 201
                    else:
                        return jsonify({
                            "message": "Request created, but failed to notify manager",
                            "request_data": created_request,
                            "code": 500
                    }), 500
                
                else:
                    return jsonify({"message": "Failed to retrieve manager email", "code": 500}), 500
                
            else:
                return jsonify({"message": "Failed to create WFH request", "code": 500}), 500

        else:
            return jsonify({
                "message": f"Employee with ID {staff_id} not found",
                "code": 404
            }), 404

    except Exception as e:
        app.logger.error(f"Error in make_request: {e}")
        return jsonify({
            "message": "Internal Server Error",
            "error": str(e),
            "code": 500
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)
