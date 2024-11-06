from flask import Flask, request, jsonify
import requests
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS
from dateutil.relativedelta import relativedelta
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    or "mysql+mysqlconnector://root@host.docker.internal:3307/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
    or 'sqlite:///:memory:'  # fallback for testing
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = os.getenv("EMPLOYEE_MICROSERVICE_URL")
ARRANGEMENT_MICROSERVICE_URL = os.getenv("ARRANGEMENT_MICROSERVICE_URL")
REQUEST_LOG_MICROSERVICE_URL = os.getenv("REQUEST_LOG_MICROSERVICE_URL")
NOTIFICATION_MICROSERVICE_URL = os.getenv("NOTIFICATION_MICROSERVICE_URL")

print("URL endpoints:")
print(EMPLOYEE_MICROSERVICE_URL)
print(ARRANGEMENT_MICROSERVICE_URL)
print(REQUEST_LOG_MICROSERVICE_URL)
print(NOTIFICATION_MICROSERVICE_URL)

from arrangement.arrangement import Arrangement
from employee.employee import Employee
from requests_log.requests_log import Request

def count_wfh(manager_id, arrangement_date):
    try:
        # base query to join Arrangement with Employee
        base_query = db.session.query(Arrangement)\
            .join(Employee, Employee.staff_id == Arrangement.staff_id)\
            .filter(Employee.reporting_manager == manager_id,
                    Arrangement.arrangement_date == arrangement_date)

        am_count = base_query.filter(Arrangement.timeslot == 'AM').count()
        pm_count = base_query.filter(Arrangement.timeslot == 'PM').count()
        full_count = base_query.filter(Arrangement.timeslot == 'FULL').count()
        
        # full_count counts towards both AM and PM shifts
        am_count += full_count
        pm_count += full_count

        return am_count, pm_count
    except Exception as e:
        app.logger.error(
            f"Failed to count WFH: {e}")
        return 0, 0
    
def past_wfh(staff_id, arrangement_date):
    try:
        # check if the staff member has already WFH on the requested date
        existing_wfh = db.session.query(Arrangement) \
                        .filter(Arrangement.staff_id == staff_id, Arrangement.arrangement_date == arrangement_date).first()
        return existing_wfh is not None  # True if a record exists, False otherwise
    except Exception as e:
        app.logger.error(f"Failed to check if staff {staff_id} already worked from home on {arrangement_date}: {e}")
        return False

def check_duplicate_dates(staff_id, new_dates):
    try:
        new_dates_set = set(new_dates) # converting to a set removes duplicates automatically
        
        # check for duplicates within new dates themselves
        if len(new_dates_set) != len(new_dates):
            duplicate_dates = [date for date in new_dates if new_dates.count(date) > 1]
            return list(set(duplicate_dates))  
        
        # check for existing arrangements
        existing_arrangements = db.session.query(Arrangement.arrangement_date)\
            .filter(Arrangement.staff_id == staff_id)\
            .all()
        
        existing_dates = {str(date[0]) for date in existing_arrangements}
        duplicate_dates = new_dates_set.intersection(existing_dates)
        
        return list(duplicate_dates)
        
    except Exception as e:
        app.logger.error(f"Failed to check duplicate dates: {e}")
        return []

# Function to check and reject overdue requests
def auto_reject_pending_requests():
    try:
        two_months_ago = datetime.now(tz=timezone.utc) - relativedelta(months=2)
        overdue_requests = Request.query.filter(
            Request.status == 'Pending',
            Request.request_date <= two_months_ago
        ).all()

        for request in overdue_requests:
            # Update status
            update_status(request.request_id, 'Rejected', 'Auto-rejected due to timeout')
            
            # Fetch employee email and notify
            employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{request.staff_id}")
            if employee_response.status_code == 200:
                staff_email = employee_response.json().get("data", {}).get("email")
                if staff_email:
                    notify_staff(staff_email, 'Rejected', request.request_id, 'Auto-rejected due to timeout')
            
            print(f"Request {request.request_id} automatically rejected")
    except Exception as e:
        app.logger.error(f"Auto-rejection failed: {e}")

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
        disable_notification = data.get("disable_notification", False) # to avoid sending notifications when revoking multiple dates for same user 
        print(f"Disable Notification: {disable_notification}")

        if not request_id or not status or status not in ['Approved', 'Rejected', 'Withdrawn']:
            return jsonify({"message": "Invalid data", 
                            "code": 400
            }), 400

        # 1: fetch request from database via request_log.py
        fetch_response = requests.get(f"{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}")
        
        if fetch_response.status_code != 200:
            return jsonify({"message": "Failed to fetch request from database", 
                            "code": 404
            }), 404
        
        request_entry = fetch_response.json().get("data")
        staff_id = request_entry.get("staff_id")
        arrangement_dates = request_entry.get("arrangement_dates")
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
        
        # 3: if request is rejected, update the status and notify staff of rejection
        if status == "Rejected":
            update_status(request_id, status, remarks)
            notify_staff(staff_email, status, request_id, remarks)
            return jsonify({
                "message": f"Request {status} successfully and staff notified",
                "code": 200
            }), 200
        
        # 4: check for duplicate dates 
        duplicate_dates = check_duplicate_dates(staff_id, arrangement_dates)
        if duplicate_dates:
            return jsonify({
                "message": "Duplicate dates found in request",
                "duplicate_dates": duplicate_dates,
                "code": 400
            }), 400
        
        # 5: fetch employee's team size 
        team_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/users/team/{reporting_manager}")
        if team_response.status_code != 200:
            return jsonify({"message": "Failed to fetch team details", 
                            "code": 404
            }), 404

        team_data = team_response.json().get("data")
        team_size = len(team_data)

        failed_dates = [] # to be showed to staff, which dates caused the request to be rejected

        if dept != "CEO": # do not need to check threshold for CEO
        # 6: loop through arrangement_dates to process each date
            for arrangement_date in arrangement_dates:
            # check if the employee has already worked from home on the arrangement date
                if past_wfh(staff_id, arrangement_date):
                    continue

            # 7: check WFH threshold before approving (only if not CEO)
                am_count, pm_count = count_wfh(reporting_manager, arrangement_date)
                if timeslot == "AM" and (am_count + 1)/ team_size > 0.5:
                    failed_dates.append({
                        'date': arrangement_date,
                        'reason': "Exceeds 50% threshold for AM shift"
                    })
                elif timeslot == "PM" and (pm_count + 1)/ team_size > 0.5:
                    failed_dates.append({
                        'date': arrangement_date,
                        'reason': "Exceeds 50% threshold for PM shift"
                    })
                elif timeslot == "FULL":
                    if (am_count + 1)/ team_size > 0.5 or (pm_count + 1)/ team_size > 0.5:
                        failed_dates.append({
                            'date': arrangement_date,
                            'reason': "Exceeds 50% threshold for FULL shift"
                        })

        # 8: show staff the dates that caused the request to rejected        
        if failed_dates:
            return jsonify({
                "message": "Request rejected because some dates exceed team WFH threshold",
                "failed_dates": failed_dates,
                "code": 403
            }), 403
        
        # 9: if all dates pass, create individual arrangements
        try: 
            for index, date in enumerate(arrangement_dates, 1):
                arrangement_data = {
                    "request_id": request_id,
                    "staff_id": staff_id,
                    "arrangement_date": date,
                    "timeslot": timeslot,
                    "reason": reason
                }
                arrangement_response = requests.post(f"{ARRANGEMENT_MICROSERVICE_URL}/create_arrangement", json=arrangement_data)
            
                if arrangement_response.status_code != 201:
                    return jsonify({"message": f"Failed to create arrangement entry for date {date}", 
                                    "code": 500
                    }), 500
            
        except Exception as e:
            # if any arrangement creation fails, reject the entire request
            update_status(request_id, "Rejected", f"Failed to create arrangements: {str(e)}")
            notify_staff(staff_email, "Rejected", request_id, str(e))
            return jsonify({
                "message": "Failed to create arrangements",
                "error": str(e),
                "code": 500
            }), 500

        # 10: update the request status and notify staff
        update_status(request_id, status, remarks)
        if not disable_notification:
            notify_staff(staff_email, status, request_id, remarks)
        return jsonify({
            "message": f"Request {status} successfully and staff notified",
            "code": 200
        }), 200

    except Exception as e:
        app.logger.error(f"Failed to manage request: {e}")
        return jsonify({"message": "Internal server error", 
                        "code": 500
        }), 500
    
@app.route('/cancel_request/<int:request_id>', methods=['PUT'])
def cancel_request(request_id):
    """
    Cancel a pending request with a provided reason.
    """
    try:
        data = request.get_json() 
        reason = data.get("remark")
        
        if not reason:
            return jsonify({
                "message": "Cancellation reason is required", 
                "code": 400
            }), 400
        
        # Fetch the request details from the Request Log microservice
        fetch_response = requests.get(f"{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}")
        
        if fetch_response.status_code != 200:
            return jsonify({
                "message": "Request not found", 
                "code": 404
            }), 404
        
        request_entry = fetch_response.json().get("data")
        current_status = request_entry.get("status")
        staff_id = request_entry.get("staff_id")
        
        # Check if the request is currently pending
        if current_status != "Pending":
            return jsonify({
                "message": "Only pending requests can be cancelled", 
                "code": 403
            }), 403
        
        # Update the status to 'Cancelled' in the Request Log microservice
        update_data = {
            "request_id": request_id,
            "status": "Cancelled",
            "remarks": reason
        }
        
        update_response = requests.put(
            f"{REQUEST_LOG_MICROSERVICE_URL}/update_request/{request_id}", 
            json=update_data
        )
        
        if update_response.status_code != 200:
            return jsonify({
                "message": "Failed to update request status", 
                "code": 500
            }), 500
        
        # Fetch employee email for notification commented out for testing
        # employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")
        
        # if employee_response.status_code == 200:
        #     employee_data = employee_response.json().get("data")
        #     staff_email = employee_data.get("email")
            
        #     # Send notification email to staff
        #     notification_data = {
        #         "staff_email": staff_email,
        #         "status": "Cancelled",
        #         "request_id": request_id,
        #         "remarks": reason
        #     }
            
        #     requests.post(
        #         f"{NOTIFICATION_MICROSERVICE_URL}/notify_status_update", 
        #         json=notification_data
        #     )
        return jsonify({
            "message": "Request successfully cancelled",
            "code": 200
        }), 200

    except Exception as e:
        app.logger.error(f"Failed to cancel request: {e}")
        return jsonify({
            "message": "Internal server error", 
            "code": 500
        }), 500

@app.route('/withdraw_wfh_arrangement/<int:request_id>/<int:arrangement_id>', methods=['DELETE'])
def withdraw_wfh_arrangement(request_id, arrangement_id):
    try:
        # 1. get arrangement details first before deletion
        arrangement_response = requests.get(
            f"{ARRANGEMENT_MICROSERVICE_URL}/get_arrangement/{request_id}/{arrangement_id}"
        )
        
        if arrangement_response.status_code != 200:
            return jsonify({
                "message": "Failed to fetch arrangement details",
                "code": 404
            }), 404
            
        arrangement_data = arrangement_response.json().get("data")
        staff_id = arrangement_data.get("staff_id")

        # 2. get employee details for notification
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")
        if employee_response.status_code != 200:
            return jsonify({
                "message": "Failed to fetch employee details",
                "code": 404
            }), 404

        staff_email = employee_response.json().get("data", {}).get("email")

        # 3. delete the arrangement
        withdraw_response = requests.delete(
            f"{ARRANGEMENT_MICROSERVICE_URL}/withdraw_arrangement/{request_id}/{arrangement_id}"
        )
        
        if withdraw_response.status_code != 200:
            return jsonify({
                "message": "Failed to withdraw arrangement",
                "code": 500
            }), 500

        # 4. update request_log status and notify staff
        remarks = f"Arrangement {arrangement_id} withdrawn"
        update_status(request_id, "Withdrawn", remarks)
        if staff_email:
            notify_staff(
                staff_email=staff_email,
                status="Withdrawn",
                request_id=request_id,
                remarks=remarks
            )

        return jsonify({
            "message": "Arrangement withdrawn successfully and staff notified",
            "data": arrangement_data,
            "code": 200
        }), 200
    
    except Exception as e:
        app.logger.error(f"Failed to process arrangement withdrawal: {e}")
        return jsonify({
            "message": "Failed to process arrangement withdrawal",
            "code": 500
        }), 500

    
def update_status(request_id, status, remarks):
    arrangement_update_data = {
        "request_id": request_id,
        "status": status,
        "remarks": remarks
    }
    update_response = requests.put(f"{REQUEST_LOG_MICROSERVICE_URL}/update_request/{request_id}", json=arrangement_update_data)
    if update_response.status_code != 200:
        raise Exception("Failed to update request status")

def notify_staff(staff_email, status, request_id, remarks):
    notification_data = {
        "staff_email": staff_email,  
        "status": status,
        "request_id": request_id,
        "remarks": remarks
    }
    notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/notify_status_update", json=notification_data)
    if notification_response.status_code != 200:
        raise Exception("Failed to notify staff")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)  