from flask import Flask, request, jsonify
import requests
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS
from dateutil.relativedelta import relativedelta
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    # environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)

EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
ARRANGEMENT_MICROSERVICE_URL = "http://localhost:5005"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

from arrangement import Arrangement
from employee import Employee
from requests_log import Request

def count_wfh(manager_id, arrangement_date):
    try:
        # count the number of WFH arrangements for AM, PM, and FULL shifts
        am_count = db.session.query(Arrangement) \
            .join(Employee, Employee.staff_id == Arrangement.staff_id) \
            .filter(Employee.reporting_manager == manager_id, Arrangement.arrangement_date == arrangement_date, Arrangement.timeslot == 'AM') \
            .count()
        
        pm_count = db.session.query(Arrangement) \
            .join(Employee, Employee.staff_id == Arrangement.staff_id) \
            .filter(Employee.reporting_manager == manager_id, Arrangement.arrangement_date == arrangement_date, Arrangement.timeslot == 'PM') \
            .count()
        
        full_count = db.session.query(Arrangement) \
            .join(Employee, Employee.staff_id == Arrangement.staff_id) \
            .filter(Employee.reporting_manager == manager_id, Arrangement.arrangement_date == arrangement_date, Arrangement.timeslot == 'FULL') \
            .count()
        
        # full_count counts towards both AM and PM shifts
        am_count += full_count
        pm_count += full_count

        return am_count, pm_count
    except Exception as e:
        app.logger.error(
            f"Failed to count WFH for maanger {manager_id} on {arrangement_date}: {e}")
        return 0
    
def past_wfh(staff_id, arrangement_date):
    try:
        # check if the staff member has already WFH on the requested date
        existing_wfh = db.session.query(Arrangement) \
                        .filter(Arrangement.staff_id == staff_id, Arrangement.arrangement_date == arrangement_date).first()
        return existing_wfh is not None  # True if a record exists, False otherwise
    except Exception as e:
        app.logger.error(f"Failed to check if staff {staff_id} already worked from home on {arrangement_date}: {e}")
        return False

# Function to check and reject overdue requests
def auto_reject_pending_requests():
    two_months_ago = datetime.now(tz=timezone.utc) - relativedelta(months=2)

    overdue_requests = db.session.query(Request) \
        .filter(Request.status == 'Pending', Request.request_date <= two_months_ago).all()

    for request in overdue_requests:
        request.status = 'Rejected'
        db.session.commit()
        print(f"Request {request.request_id} automatically rejected as it has been 'pending' for more than 2 months")

# Initialize and configure APScheduler
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=auto_reject_pending_requests, trigger="interval", days=1)
    scheduler.start()

@app.before_request
def start_auto_rejection_scheduler():
    if not getattr(app, 'scheduler_started', False):
        start_scheduler()
        app.scheduler_started = True

@app.route('/manage_request', methods=['PUT'])
def manage_request():
    try:
        data = request.json

        request_id = data.get("request_id")
        status = data.get("status")  # either 'Approved' or 'Rejected'
        remarks = data.get("remarks", "")  # optional remarks from the manager

        if not request_id or not status or status not in ['Approved', 'Rejected']:
            return jsonify({"message": "Invalid data", 
                            "code": 400
            }), 400

        # 1: fetch request from database via arrangement.py
        fetch_response = requests.get(f"{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}")
        
        if fetch_response.status_code != 200:
            return jsonify({"message": "Failed to fetch request from database", 
                            "code": 404
            }), 404
        
        request_entry = fetch_response.json().get("data")
        request_id - request_entry.get("request_id")
        staff_id = request_entry.get("staff_id")
        arrangement_date = request_entry.get("arrangement_date")
        timeslot = request_entry.get("timeslot")
        reason = request_entry.get("reason")

        # 2: fetch staff email and department from employee.py using staff_id
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")
        
        if employee_response.status_code != 200:
            return jsonify({"message": "Failed to fetch employee details", 
                            "code": 404
            }), 404

        employee_data = employee_response.json().get("data")
        staff_email = employee_data.get("email")
        dept = employee_data.get("dept")
        reporting_manager = employee_data.get("reporting_manager")

        if not staff_email:
            return jsonify({"message": "Staff email not found", 
                            "code": 404
            }), 404
        
        if status == "Rejected":
            # directly update the request status
            arrangement_update_data = {
                "request_id": request_id,
                "status": status,
                "remarks": remarks
            }

            update_response = requests.put(f"{REQUEST_LOG_MICROSERVICE_URL}/update_request/{request_id}", json=arrangement_update_data)
            
            if update_response.status_code != 200:
                return jsonify({"message": "Failed to update request status", 
                                "code": 500
                }), 500

            # send notification to the staff about the rejection
            notification_data = {
                "staff_email": staff_email,  
                "status": status,
                "request_id": request_id,
                "remarks": remarks
            }

            notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/notify_status_update", json=notification_data)

            if notification_response.status_code != 200:
                return jsonify({"message": "Request status updated but failed to notify staff", 
                                "code": 500
                }), 500

            return jsonify({
                "message": f"Request {status} successfully and staff notified",
                "code": 200
            }), 200
        
        # 3: check if the employee has already worked from home on the arrangement date
        if past_wfh(staff_id, arrangement_date):
            # if they already worked from home, skip the threshold check
            app.logger.info(f"Staff {staff_id} already worked from home on {arrangement_date}, skipping threshold check.")
        else:
            # fetch team members under this manager 
            team_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/users/team/{reporting_manager}")

            if team_response.status_code != 200:
                return jsonify({"message": "Failed to fetch team members", 
                                "code": 404
                }), 404

            team_data = team_response.json().get("data")
            total_team_size = len(team_data)
            # print(total_team_size)

            # 4: check WFH threshold before approving (only if not CEO)
            if dept != "CEO":
                am_count, pm_count = count_wfh(reporting_manager, arrangement_date)
                # print(am_count)
                # print(pm_count)
                if status == "Approved":
                    if timeslot == "AM":
                        if (am_count + 1)/ total_team_size > 0.5:
                            return jsonify({"message": "Approval would exceed the 50% WFH threshold for AM shift!",
                                            "code": 403
                            }), 403
                        
                    elif timeslot == "PM":
                        if (pm_count + 1)/ total_team_size > 0.5:
                            return jsonify({"message": "Approval would exceed the 50% WFH threshold for PM shift!",
                                            "code": 403
                            }), 403
                    elif timeslot == "FULL":
                        if (am_count + 1)/ total_team_size > 0.5 or (pm_count + 1)/ total_team_size > 0.5:
                            return jsonify({"message": "Approval would exceed the 50% WFH threshold for FULL shift!",
                                            "code": 403
                            }), 403
        
        # 5: update the request status
        arrangement_update_data = {
            "request_id": request_id,
            "status": status,
            "remarks": remarks
        }

        update_response = requests.put(f"{REQUEST_LOG_MICROSERVICE_URL}/update_request/{request_id}", json=arrangement_update_data)
        
        if update_response.status_code != 200:
            return jsonify({"message": "Failed to update request status", 
                            "code": 500
            }), 500

        # 6: if status is Approved, insert the request into the arrangement table
        if status == "Approved":
            arrangement_data = {
                "request_id": request_id,
                "staff_id": staff_id,
                "arrangement_date": arrangement_date,
                "timeslot": timeslot,
                "reason": reason
            }
            arrangement_response = requests.post(f"{ARRANGEMENT_MICROSERVICE_URL}/create_arrangement", json=arrangement_data)
            
            if arrangement_response.status_code != 201:
                return jsonify({"message": "Failed to create arrangement entry", 
                                "code": 500
                }), 500
            
        # 7: call notification.py to notify the staff of the updated status
        notification_data = {
            "staff_email": staff_email,  
            "status": status,
            "request_id": request_id,
            "remarks": remarks
        }

        notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/notify_status_update", json=notification_data)

        if notification_response.status_code != 200:
            return jsonify({"message": "Request status updated but failed to notify staff", 
                            "code": 500
        }), 500

        return jsonify({
            "message": f"Request {status} successfully and staff notified",
            "code": 200
        }), 200

    except Exception as e:
        app.logger.error(f"Failed to manage request: {e}")
        return jsonify({"message": "Internal server error", 
                        "code": 500
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)  