from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from os import environ
from dateutil.relativedelta import relativedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" or
    environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

from requests_log import Request

# function to validate dates are within allowed range
def validate_dates(request_date, arrangement_dates):
    try:
        request_date_obj = datetime.strptime(request_date, "%Y-%m-%d")
        earliest_date = request_date_obj - relativedelta(months=2)
        latest_date = request_date_obj + relativedelta(months=3)
        
        for date_str in arrangement_dates:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            if not (earliest_date <= date_obj <= latest_date):
                return False, f"Date {date_str} is outside allowed range (must be between {earliest_date.date()} and {latest_date.date()})"
        return True, None
    except ValueError as e:
        return False, f"Invalid date format: {str(e)}"

# function to generate recurring dates
def generate_recurring_dates(start_date, end_date, recurring_day):
    recurring_dates = []
    current_date = datetime.strptime(start_date, "%Y-%m-%d") 
    end_date = datetime.strptime(end_date, "%Y-%m-%d")

    # Define a mapping from weekday names to integers (0 = Monday, 6 = Sunday)
    days_of_week = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4
    }

    # Get the recurring day as an integer based on the day name provided
    recurring_day_int = days_of_week.get(recurring_day, -1)  # Default to -1 if invalid day
    if recurring_day_int == -1:
        raise ValueError(f"Invalid day of the week: {recurring_day}")

    # Loop through the dates
    while current_date <= end_date:
        if current_date.weekday() == recurring_day_int:  # Check if current day matches the recurring day
            recurring_dates.append(current_date.strftime("%Y-%m-%d"))
        current_date += timedelta(days=1)
    
    return recurring_dates

# validate the incoming request data
def validate_request_data(data):
    required_fields = ["staff_id", "request_date", "timeslot"]
    if not all(field in data for field in required_fields):
        return False, "Missing required fields: staff_id, request_date, and timeslot are required"
    
    is_recurring = data.get("is_recurring", False)
    if is_recurring:
        recurring_fields = ["recurring_day", "start_date", "end_date"]
        if not all(field in data for field in recurring_fields):
            return False, "Recurring requests require recurring_day, start_date, and end_date"
    else:
        if "arrangement_date" not in data:
            return False, "Single-day requests require arrangement_date"
    
    return True, None

# Route to handle the make request scenario
@app.route('/make_request', methods=['POST'])
def make_request():
    try:
        data = request.json

        is_valid, error_message = validate_request_data(data)
        if not is_valid:
            return jsonify({
                "message": error_message,
                "code": 400
            }), 400
        
        # 1. verify employee exists using employee.py
        staff_id = data.get("staff_id")
        employee_verification = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")

        if employee_verification.status_code != 200:
            return jsonify({"message": f"Employee with ID {staff_id} not found", 
                            "code": 404
            }), 404

        employee_response = employee_verification.json()
        employee_data = employee_response.get("data")
        employee_fname = employee_data.get("staff_fname")
        employee_lname = employee_data.get("staff_lname")
        employee_name = employee_fname + " " + employee_lname
        manager_id = employee_data.get("reporting_manager")
        
        # log employee data in terminal
        app.logger.info(f"Employee found: {employee_response}")

        # 2. build request data baed on whether it contains recurring dates
        is_recurring = data.get("is_recurring", False)
        if is_recurring:
            try:
                arrangement_dates = generate_recurring_dates(data["start_date"],data["end_date"],data["recurring_day"])
                if not arrangement_dates:
                    return jsonify({
                        "message": "No valid dates generated for recurring request",
                        "code": 400
                    }), 400
            except ValueError as e:
                return jsonify({
                    "message": str(e),
                    "code": 400
                }), 400
        else:
            arrangement_dates = [data["arrangement_date"]]

        # Validate dates are within allowed range
        is_valid, error_message = validate_dates(data["request_date"], arrangement_dates)
        if not is_valid:
            return jsonify({
                "message": error_message,
                "code": 400
            }), 400
        
        request_data = {
            "staff_id": staff_id,
            "manager_id": manager_id,
            "request_date": data["request_date"],
            "timeslot": data["timeslot"],
            "reason": data.get("reason", ""),
            "status": "Pending",  
            "remark": "",        
            "is_recurring": is_recurring
        }

        if is_recurring:
            request_data.update({
                "recurring_day": data["recurring_day"],
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "arrangement_date": None,  # This will be null for recurring requests
                "arrangement_dates": arrangement_dates  # The list of generated dates
            })
        else:
            request_data.update({
                "arrangement_date": data["arrangement_date"],
                "recurring_day": None,
                "start_date": None,
                "end_date": None
            })
        
        # create a WFH request
        arrangement_response = requests.post(f"{REQUEST_LOG_MICROSERVICE_URL}/create_request", json=request_data)
        if arrangement_response.status_code == 201:
            created_request = arrangement_response.json().get("data")

            # 3. retrieve the manager's email using employee.py
            manager_data_response =  requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/manager_email/{manager_id}")

            if manager_data_response.status_code == 200:
                manager_email = manager_data_response.json().get("manager_email")

                # 4. Send a notification to the manager using Notification Microservice
                notification_data = {
                    "manager_email": manager_email,
                    "staff_id": staff_id,
                    "employee_name": employee_name,
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
                return jsonify({"message": "Failed to retrieve manager email", 
                                "code": 500
                }), 500
            
        else:
            return jsonify({"message": "Failed to create WFH request", 
                            "code": 500
            }), 500

    except Exception as e:
        app.logger.error(f"Error in make_request: {e}")
        return jsonify({
            "message": "Internal Server Error",
            "error": str(e),
            "code": 500
        }), 500

# function to edit request   
@app.route('/edit_request/<int:request_id>', methods=['PUT'])
def edit_request(request_id):
    try:
        data = request.json
        
        # 1. verify the request exists 
        request_verification = requests.get(f"{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}")
        if request_verification.status_code != 200:
            return jsonify({
                "message": "Request not found",
                "code": 404
            }), 404
            
        existing_request = request_verification.json()["data"]
            
        # 2. validate edit timeframe (2 weeks before/after arrangement dates)
        current_date = datetime.strptime(data.get("request_date"), "%Y-%m-%d").date()
        
        if not existing_request["is_recurring"]:
            arrangement_date = datetime.strptime(existing_request["arrangement_date"], "%Y-%m-%d").date()
            earliest_edit = arrangement_date - timedelta(weeks=2)
            latest_edit = arrangement_date + timedelta(weeks=2)
            if not (earliest_edit <= current_date <= latest_edit):
                return jsonify({
                    "message": f"Request can only be edited between {earliest_edit} and {latest_edit}",
                    "code": 400
                }), 400

        # 3. check if edited request is recurring
        is_recurring = data.get("is_recurring", existing_request["is_recurring"])
        
        if is_recurring:
            try:
                arrangement_dates = generate_recurring_dates(
                    data["start_date"],
                    data["end_date"],
                    data["recurring_day"]
                )
                if not arrangement_dates:
                    return jsonify({
                        "message": "No valid dates generated for recurring request",
                        "code": 400
                    }), 400
            except ValueError as e:
                return jsonify({
                    "message": str(e),
                    "code": 400
                }), 400
        else:
            arrangement_dates = [data["arrangement_date"]]

        # 4. validate new dates are within allowed range
        current_date_str = current_date.strftime("%Y-%m-%d")
        is_valid, error_message = validate_dates(current_date_str, arrangement_dates)
        if not is_valid:
            return jsonify({
                "message": error_message,
                "code": 400
            }), 400

        # 5. prepare edited request data
        edit_data = {
            "request_date": current_date_str,
            "timeslot": data.get("timeslot", existing_request["timeslot"]),
            "reason": data.get("reason", existing_request["reason"]),
            "is_recurring": is_recurring,
            # "status": "Pending"  
        }

        if is_recurring:
            edit_data.update({
                "recurring_day": data["recurring_day"],
                "start_date": data["start_date"],
                "end_date": data["end_date"],
                "arrangement_date": None,
                "arrangement_dates": arrangement_dates
            })
        else:
            edit_data.update({
                "arrangement_date": data["arrangement_date"],
                "recurring_day": None,
                "start_date": None,
                "end_date": None
            })

        # 6. send update to request_log microservice
        edit_response = requests.put(f"{REQUEST_LOG_MICROSERVICE_URL}/edit_request/{request_id}", json=edit_data)

        if edit_response.status_code != 200:
            return jsonify({
                "message": "Failed to update request",
                "code": 500
            }), 500

        # 7. send notification about the edit
        employee_verification = requests.get(
            f"{EMPLOYEE_MICROSERVICE_URL}/user/{existing_request['staff_id']}"
        )
        if employee_verification.status_code == 200:
            employee_data = employee_verification.json()["data"]
            employee_name = f"{employee_data['staff_fname']} {employee_data['staff_lname']}"
            
            manager_data_response = requests.get(
                f"{EMPLOYEE_MICROSERVICE_URL}/user/manager_email/{existing_request['manager_id']}"
            )
            
            if manager_data_response.status_code == 200:
                manager_email = manager_data_response.json()["manager_email"]
                
                notification_data = {
                    "manager_email": manager_email,
                    "staff_id": existing_request["staff_id"],
                    "employee_name": employee_name,
                    "request_date": current_date_str,
                    "timeslot": edit_data["timeslot"],
                    "reason": edit_data["reason"],
                    "request_id": request_id
                }
                
                requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/request_edited", json=notification_data)

        return jsonify({
            "message": "Request updated successfully",
            "data": edit_response.json()["data"],
            "code": 200
        }), 200

    except Exception as e:
        app.logger.error(f"Error in edit_request: {e}")
        return jsonify({
            "message": "Internal Server Error",
            "error": str(e),
            "code": 500
        }), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)
