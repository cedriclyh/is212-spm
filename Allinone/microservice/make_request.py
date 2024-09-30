from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
ARRANGEMENT_MICROSERVICE_URL = "http://localhost:5003"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

# Route to handle the make request scenario
@app.route('/make_request', methods=['POST'])
def make_request():
    try:
        data = request.json

        # 1. Verify Employee exists using Employee Microservice
        staff_id = data.get("staff_id")
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")

        if employee_response.status_code == 200:
            employee_data = employee_response.json()
            
            # Log employee data in terminal
            app.logger.info(f"Employee found: {employee_data}")

            # 2. Create WFH Request using Arrangement Microservice
            print("hi")
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
            arrangement_response = requests.post(f"{ARRANGEMENT_MICROSERVICE_URL}/create_request", json=arrangement_data)

            if arrangement_response.status_code == 201:
                created_request = arrangement_response.json().get("data")

                # # 3. Send Notification to Employee using Notification Microservice [MISSING OWNER EMAIL!!!]
                # print("Sending notification to employee")
                # notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/sucessful_arrangement", json={
                #     "staff_id": staff_id,
                #     "requested_day": data.get("requested_day"),
                #     "timeslot": data.get("timeslot"),
                #     "reason": data.get("reason"),
                #     "message": f"Your WFH request for {data.get('requested_day')} has been successfully created"
                # })

                return jsonify({
                    "message": "Request successfully created",
                    "employee_data": employee_data,
                    "request_data": created_request,
                    "code": 201,
                    # "notification_response": notification_response
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
