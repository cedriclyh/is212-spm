from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS
import requests
import os
import sys
from datetime import date, datetime
from dateutil.relativedelta import relativedelta
import json
from amqp_setup import publish_to_queue

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)

MANAGE_REQUEST_URL = "http://localhost:5010"

# Arrangement model
class Arrangement(db.Model):
    __tablename__ = 'Arrangement'

    request_id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, nullable=False)
    arrangement_date = db.Column(db.Date, nullable=False)
    timeslot = db.Column(db.String(50), nullable=False) 
    reason = db.Column(db.String(255), nullable=False)

    def __init__(self, request_id, staff_id, arrangement_date, timeslot, reason):
        self.request_id = request_id
        self.staff_id = staff_id
        self.arrangement_date = arrangement_date
        self.timeslot = timeslot
        self.reason = reason

    def json(self):
        return {
            "request_id": self.request_id,
            "staff_id": self.staff_id,
            "arrangement_date": str(self.arrangement_date),
            "timeslot": self.timeslot,
            "reason": self.reason
        }
    
# Create a new WFH request
@app.route('/create_arrangement', methods=['POST'])
def create_arrangement():
    try:
        data = request.json
        request_id = data.get("request_id")
        staff_id = data.get("staff_id")
        arrangement_date = data.get("arrangement_date")
        timeslot = data.get("timeslot")
        reason = data.get("reason")

        if not request_id or not staff_id or not arrangement_date or not timeslot:
            return jsonify({"message": "Missing required fields", 
                            "code": 400}), 400

        new_arrangement = Arrangement(
            request_id=request_id,
            staff_id=staff_id,
            arrangement_date=arrangement_date,
            timeslot=timeslot,
            reason=reason
        )

        db.session.add(new_arrangement)
        db.session.commit()

        return jsonify({
            "message": "Arrangement created successfully",
            "data": new_arrangement.json(),
            "code": 201
        }), 201

    except Exception as e:
        app.logger.error(f"Failed to create arrangement: {e}")
        return jsonify({"message": "Failed to create arrangement", "code": 500}), 500

# Fetch all arrangements
@app.route('/get_all_arrangements', methods=['GET'])
def get_all_arrangements():
    try:
        arrangements = Arrangement.query.all()
        return jsonify({
            "message": "All arrangements retrieved successfully",
            "data": [arrangement.json() for arrangement in arrangements],
            "code": 200
        }), 200
    except Exception as e:
        app.logger.error(f"Failed to retrieve arrangements: {e}")
        return jsonify({"message": "Failed to retrieve arrangements", "code": 500}), 500

# Fetch a specific arrangement by ID
@app.route('/get_arrangement/<int:arrangement_id>', methods=['GET'])
def get_arrangement(arrangement_id):
    try:
        arrangement = Arrangement.query.filter_by(arrangement_id=arrangement_id).first()
        if arrangement:
            return jsonify({
                "message": "Arrangement retrieved successfully",
                "data": arrangement.json(),
                "code": 200
            }), 200
        else:
            return jsonify({"message": "Arrangement not found", "code": 404}), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve arrangement with id {arrangement_id}: {e}")
        return jsonify({'message': f'Failed to retrieve arrangement with id {arrangement_id}', 'code': 500}), 500
    
#Retrieve a WFH request by staff
@app.route('/get_arrangement/staff/<int:staff_id>', methods=['GET'])
def get_arrangements_by_staff_id(staff_id):
    try:
        arrangements = Arrangement.query.filter_by(staff_id=staff_id).all()
        if arrangements:
            return jsonify({'message': f'Requests from staff {staff_id} found', 'data': [arrangement.json() for arrangement in arrangements], 'code': 200}), 200
        else:
            return jsonify({'message': f'No requests from staff {staff_id}', 'data': [], 'code': 200}), 200
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests by staff ID: {e}")
        return jsonify({'message': 'Failed to retrieve requests by staff ID', 'code': 500}), 500

# Delete arrangments by request_id
@app.route('/delete_arrangements', methods=['DELETE'])
def delete_arrangements(arrangement_ids=[]):
    print(f"[delete_arrangements] Arrangement IDs: {arrangement_ids}")
    try:
        if arrangement_ids == []:
            print(f"[delete_arrangements] Request Json: {request.json}")
            data = request.json
            arrangement_ids = data.get("arrangement_ids")

        print("[delete_arrangements] Arrangement IDs:", arrangement_ids)
        print("Deleting arrangement...")

        if not arrangement_ids or not isinstance(arrangement_ids, list):
            print("Invalid input: arrangement_ids is required and must be a list")
            return jsonify({"message": "Invalid input: arrangement_ids is required and must be a list", "code": 400}), 400

        arrangements_to_delete = Arrangement.query.filter(Arrangement.request_id.in_(arrangement_ids)).all()

        if not arrangements_to_delete:
            return jsonify({'message': 'No matching arrangements found to delete', 'code': 200}), 200

        # Delete all matching arrangements
        for arrangement in arrangements_to_delete:
            db.session.delete(arrangement)
            print(f"{arrangement} deleted")

        db.session.commit()
        return jsonify({'message': 'Arrangements deleted successfully', 'code': 200}), 200

    except Exception as e:
        app.logger.error(f"Failed to delete arrangements: {e}")
        return jsonify({'message': 'Failed to delete arrangements', 'code': 500}), 500

# Revoke 1 person at once
# at least 1 date
# Can provide reason for revoking approved arrangement
# # Withdrawing arrangment must >24 hours start time
# # withdrawal must be done withon 1 month ago and 3 months forward 
@app.route('/revoke_arrangements', methods=['POST'])   
def revoke_arrangements():
    
    data = request.json
    # manager_id = data.get("manager_id")
    staff_id = data.get("staff_id")
    revoke_dates = data.get("revoke_dates")
    revoke_dates_check = [datetime.strptime(revoke_date, '%Y-%m-%d').date() for revoke_date in revoke_dates]
    
    try: 
        # 1. Check if arrangement is within 1 month ago and 3 months forward
        checked_date_response, status_code = check_date(revoke_dates_check)
        if status_code != 200:
            return checked_date_response
    
        # 2. Package data for async amqp processing
        task_data = {
            "staff_id": staff_id,
            "revoke_dates": revoke_dates
        }

        # Publish to amqp queue to process deleting arrangement and updating request status
        print("Publishing to queue...")
        publish_to_queue(task_data)
        print("Successfully published to queue.")
        
        # # 2. Delete arrangement from db
        # arrangements_to_delete = Arrangement.query.filter(
        #     Arrangement.staff_id==staff_id,
        #     Arrangement.arrangement_date.in_(revoke_dates)
        #     ).all()   
        
        # print(f"Arrangements to delete: {arrangements_to_delete}")

        # request_ids = [arrangement.request_id for arrangement in arrangements_to_delete]
        # print(f"Request IDs: {request_ids}")

        # print("Deleting arrangements...")
        # delete_response, delete_status_code = delete_arrangements(request_ids)
        
        # if delete_status_code != 200:
        #     return delete_response

        # print("All arrangements succesfully deleted")

        # #3. Update request_log list 
        # print("Updating request statuses...")
        # for request_id in request_ids:
        #     print(f"Updating status for Request ID {request_id}")
        #     update_request_data = {
        #         "request_id": request_id,
        #         "status": "Withdrawn",
        #         "disable_notification": True
        #     }

        #     update_request_response = requests.put(f"{MANAGE_REQUEST_URL}/manage_request", json=update_request_data)        
        #     print(update_request_response.json())
        #     if(update_request_response.status_code) != 200:
        #         print(f"Failed to update request status for Request ID {request_id}")
        #         return update_request_response
            
        # print("All request statuses successfully updated.")
            
        # return jsonify({"message": f"All arrangments revoked successfully", "code": 200}), 200
        
        print("Revocation process started.")
        return jsonify({"message": "Revocation process started. An email will be sent to you when the revocation process is completed.", "code": 200}), 200

    except Exception as e:
        app.logger.error(f"Error revoking arrangments: {e}")
        return jsonify({'message': 'Failed to revoke arrangements', 'code': 500}), 500


# Checks for 1 month ago and 3 months back
def check_date(dates_to_check):
    for date_to_check in dates_to_check:
        print("Checking if date is within 1 month ago and 3 months back...")
        # if date_to_check <= date.today() + relativedelta(days=+1):
            # return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement that", "code": 500}), 500
        if date_to_check <= date.today() + relativedelta(months=-1):
            return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 1 month past the arrangement date.", "code": 500}), 500
        if date_to_check >= date.today() + relativedelta(months=+3):
            return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 3 months ahead of current date.", "code": 500}), 500
    
    print("ALl arrangements are eligible to be revoked.")
    return jsonify({"message": f"All arrangement dates are eligible to be revoked.", "code": 200}), 200
 

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
