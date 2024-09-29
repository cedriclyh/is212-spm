from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
ARRANGEMENT_MICROSERVICE_URL = "http://localhost:5003"

# Route to handle the make request scenario
@app.route('/make_request', methods=['POST'])
def make_request():
    try:
        data = request.json

        # 1. Verify Employee exists using Employee Microservice
        staff_id = data.get("staff_id")
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")

        if employee_response.status_code == 200:
            employee_data = employee_response.json().get("data")
            
            # Log employee data in terminal
            app.logger.info(f"Employee found: {employee_data}")

            # 2. Create WFH Request using Arrangement Microservice
            arrangement_data = {
                "staff_id": staff_id,
                "requested_day": data.get("requested_day"),
                "timeslot": data.get("timeslot"),
                "reason": data.get("reason")
            }

            # Send POST request to create a WFH request
            arrangement_response = requests.post(f"{ARRANGEMENT_MICROSERVICE_URL}/create_request", json=arrangement_data)

            if arrangement_response.status_code == 201:
                created_request = arrangement_response.json().get("data")
                return jsonify({
                    "message": "Request successfully created",
                    "employee_data": employee_data,
                    "request_data": created_request,
                    "code": 201
                }), 201
            else:
                app.logger.error(f"Failed to create WFH request: {arrangement_response.json()}")
                return jsonify({
                    "message": "Failed to create WFH request",
                    "code": arrangement_response.status_code
                }), arrangement_response.status_code

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