from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from os import environ
from dateutil.relativedelta import relativedelta

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    # environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

from requests_log import Request

# Function to generate recurring dates
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

# Route to handle the make request scenario
@app.route('/make_request', methods=['POST'])
def make_request():
    try:
        data = request.json

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

        # 2. check if it is a single-day request or recurring request
        arrangement_date = data.get("arrangement_date")
        recurring_day = data.get("recurring_day")
        request_date_str = data.get("request_date")

        request_date = datetime.strptime(request_date_str, "%Y-%m-%d")

        # calculate valid date range
        earliest_date = request_date - relativedelta(months=2)
        latest_date = request_date + relativedelta(months=3)

        if recurring_day:
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            if not start_date or not end_date:
                return jsonify({"message": "Start date and end date are required for recurring requests", 
                                "code": 400
                }), 400  
        
            # generate recurring dates for the specific day of the week
            recurring_dates = generate_recurring_dates(start_date, end_date, recurring_day)
            # print(recurring_dates)
            if not recurring_dates:
                return jsonify({"message": "No recurring dates generated for the selected day", 
                                "code": 400
                }), 400
            
            arrangement_dates = []
            for date in recurring_dates:
                # Convert the string date to a datetime object for validation
                arrangement_date_obj = datetime.strptime(date, "%Y-%m-%d")
                
                # Check if the date is within the valid range
                if not (earliest_date <= arrangement_date_obj <= latest_date):
                    return jsonify({
                        "message": f"Arrangement date {date} is out of the valid range. The request must be within 2 months before and 3 months after the request date.", 
                        "code": 400
                    }), 400
                arrangement_dates.append(date)
        else:  
            if not arrangement_date:
                return jsonify({"message": "Arrangement date is required for single-day requests", 
                                "code": 400
                }), 400
            
            arrangement_date_obj = datetime.strptime(arrangement_date, "%Y-%m-%d")
            # Check if the single arrangement date is within the valid range
            if not (earliest_date <= arrangement_date_obj <= latest_date):
                return jsonify({
                    "message": f"Arrangement date {arrangement_date} is out of the valid range. The request must be within 2 months before and 3 months after the request date.", 
                    "code": 400
                }), 400
            arrangement_dates = [arrangement_date]
                
        # create a WFH request
        arrangement_data = {
            "staff_id": staff_id,
            "manager_id": manager_id,
            "request_date": data.get("request_date"),  # Date of request creation
            "arrangement_date": arrangement_dates,
            "timeslot": data.get("timeslot"),
            "reason": data.get("reason"),
        }
        print(arrangement_data)

        # Send POST request to create a WFH request
        arrangement_response = requests.post(f"{REQUEST_LOG_MICROSERVICE_URL}/create_request", json=arrangement_data)
        if arrangement_response.status_code == 201:
            created_request = arrangement_response.json().get("data")
            manager_id = created_request.get("manager_id")

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



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)
