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
from employee import Employee 
from sqlalchemy.orm import aliased

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)

# Arrangement model
class Arrangement(db.Model):
    __tablename__ = 'Arrangement'

    request_id = db.Column(db.Integer, primary_key=True)
    arrangement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, nullable=False)
    arrangement_date = db.Column(db.Date, nullable=False)
    timeslot = db.Column(db.String(50), nullable=False) 
    reason = db.Column(db.String(255), nullable=False)

    def __init__(self, request_id, arrangement_id, staff_id, arrangement_date, timeslot, reason):
        self.request_id = request_id
        self.arrangement_id = arrangement_id
        self.staff_id = staff_id
        self.arrangement_date = arrangement_date
        self.timeslot = timeslot
        self.reason = reason

    def json(self):
        return {
            "request_id": self.request_id,
            "arrangement_id": self.arrangement_id,
            "staff_id": self.staff_id,
            "arrangement_date": str(self.arrangement_date),
            "timeslot": self.timeslot,
            "reason": self.reason
        }
    
# get the next available arrangement_id for a given request_id
def get_next_arrangement_id(request_id):
    try:
        max_arrangement = db.session.query(db.func.max(Arrangement.arrangement_id))\
            .filter(Arrangement.request_id == request_id)\
            .scalar()
        return 1 if max_arrangement is None else max_arrangement + 1
    except Exception as e:
        app.logger.error(f"Failed to get next arrangement ID: {e}")
        raise
    
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
                            "code": 400
                        }), 400
        
        # check for existing arrangement
        existing_arrangement = Arrangement.query.filter_by(
            staff_id=staff_id,
            arrangement_date=arrangement_date,
            timeslot=timeslot,
        ).first()
       
        if existing_arrangement:
            return jsonify({
                "message": "Arrangement already exists for this date and timeslot",
                "code": 409
            }), 409

        # Get the next arrangement_id for this request
        arrangement_id = get_next_arrangement_id(request_id)

        new_arrangement = Arrangement(
            request_id=request_id,
            arrangement_id=arrangement_id,
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
@app.route('/get_arrangement/<int:request_id>/<int:arrangement_id>', methods=['GET'])
def get_arrangement(request_id, arrangement_id):
    try:
        arrangement = Arrangement.query.filter_by(
            request_id=request_id,
            arrangement_id=arrangement_id
        ).first()
        if arrangement:
            return jsonify({
                "message": "Arrangement retrieved successfully",
                "data": arrangement.json(),
                "code": 200
            }), 200
        else:
            return jsonify({"message": "Arrangement not found", 
                            "code": 404
            }), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve arrangement with id {request_id}: {e}")
        return jsonify({'message': f'Failed to retrieve arrangement with id {request_id}', 
                        'code': 500
        }), 500

# Get all arrangements for a specific request
@app.route('/get_arrangements/request/<int:request_id>', methods=['GET'])
def get_arrangements_by_request(request_id):
    try:
        arrangements = Arrangement.query.filter_by(request_id=request_id)\
            .order_by(Arrangement.arrangement_id).all()
        if arrangements:
            return jsonify({
                'message': f'Arrangements for request {request_id} found',
                'data': [arrangement.json() for arrangement in arrangements],
                'code': 200
            }), 200
        else:
            return jsonify({
                'message': f'No arrangements found for request {request_id}',
                'data': [],
                'code': 200
            }), 200
    except Exception as e:
        app.logger.error(f"Failed to retrieve arrangements: {e}")
        return jsonify({
            'message': 'Failed to retrieve arrangements',
            'code': 500
        }), 500

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

@app.route('/withdraw_arrangement/<int:request_id>/<int:arrangement_id>', methods=['DELETE'])
def withdraw_arrangement(request_id, arrangement_id):
    try:
        arrangement = Arrangement.query.filter_by(
            request_id=request_id,
            arrangement_id=arrangement_id
        ).first()

        if not arrangement:
            return jsonify({
                'message': 'Arrangement not found',
                'code': 404
            }), 404

        # store arrangement details before deletion for request_log update
        arrangement_details = arrangement.json()

        # delete from arrangements table
        db.session.delete(arrangement)
        db.session.commit()
        
        print(f"Arrangement ({request_id}, {arrangement_id}) deleted successfully.")
        return jsonify({
            'message': 'Arrangement withdrawn successfully',
            'data': arrangement_details,
            'code': 200
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to withdraw arrangement: {e}")
        return jsonify({
            'message': 'Failed to withdraw arrangement',
            'code': 500
        }), 500

# Revoke 1 person at once
# at least 1 date
# Can provide reason for revoking approved arrangement
# # Withdrawing arrangment must >24 hours start time
# # withdrawal must be done withon 1 month ago and 3 months forward 
@app.route('/revoke_arrangements', methods=['POST'])   
def revoke_arrangements():
    
    data = request.json
    staff_id = data.get("staff_id", False)
    staff_email = data.get("email", False)

    # check staff
    if not staff_id and staff_email:
        staff_id = (
            db.session.query(Employee.staff_id)
            .filter(Employee.email == staff_email)
            .scalar()
        )
    arrangements = Arrangement.query.filter(
        Arrangement.staff_id==staff_id
    ).all()
        
    revoke_dates = [arrangement.arrangement_date.strftime('%Y-%m-%d') for arrangement in arrangements]
    arrangements_to_delete = [(arrangement.request_id, arrangement.arrangement_id) for arrangement in arrangements]

    revoke_dates_check = [datetime.strptime(revoke_date, '%Y-%m-%d').date() for revoke_date in revoke_dates]
    
    try: 
        # 1. Check if arrangement is within 1 month ago and 3 months forward
        checked_date_response, status_code = check_date(revoke_dates_check)
        if status_code != 200:
            return checked_date_response
    
        # 2. Package data for async amqp processing
        staff_email = (
            db.session.query(Employee.email)
            .filter(Employee.staff_id == staff_id)
            .scalar()
        )

        Manager= aliased(Employee)

        manager_email = (
            db.session.query(Manager.email)
            .select_from(Employee)
            .join(Manager, Manager.staff_id == Employee.reporting_manager)
            .filter(Employee.staff_id == staff_id)
            .scalar()
        )

        task_data = {
            "staff_id": staff_id,
            "revoke_dates": revoke_dates,
            "arrangements_to_delete": arrangements_to_delete,
            "staff_email": staff_email,
            "manager_email": manager_email
        }

        # Publish to amqp queue to process deleting arrangement and updating request status
        print("Publishing to queue...")
        publish_to_queue(task_data)
        print("Successfully published to queue.")
        
        print("Revocation process started.")
        return jsonify({"message": "Revocation process started. An email will be sent to you when the revocation process is completed.", "code": 200}), 200

    except Exception as e:
        app.logger.error(f"Error revoking arrangments: {e}")
        return jsonify({'message': 'Failed to revoke arrangements', 'code': 500}), 500


# Checks for 1 month ago and 3 months back
def check_date(dates_to_check):
    for date_to_check in dates_to_check:
        print("Checking if current date is not more than 3 months ahead of arrangement date...")
        # if date.today() <= date_to_check - relativedelta(months=-1):
        #     return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 1 month past the arrangement date.", "code": 500}), 500
        if date.today() >=  date_to_check + relativedelta(months=+3):
            print(f"Failed to revoke arrangement for date {date_to_check}")
            return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 3 months ahead of arrangement date.", "code": 500}), 500
    
    print("ALl arrangements are eligible to be revoked.")
    return jsonify({"message": f"All arrangement dates are eligible to be revoked.", "code": 200}), 200

@app.route('/revoke_arrangements_request/<int:request_id>', methods=['POST'])   
def revoke_arrangements_request(request_id):
    
    arrangements = Arrangement.query.filter(
        Arrangement.request_id == request_id
    ).all()
    
    revoke_dates = [arrangement.arrangement_date.strftime('%Y-%m-%d') for arrangement in arrangements]
    arrangements_to_delete = [(arrangement.request_id, arrangement.arrangement_id) for arrangement in arrangements]
    revoke_dates_check = [datetime.strptime(revoke_date, '%Y-%m-%d').date() for revoke_date in revoke_dates]

    try: 
        checked_date_response, status_code = check_date(revoke_dates_check)
        if status_code != 200:
            return checked_date_response
        
        Arrangement.query.filter(Arrangement.request_id == request_id).delete()
        db.session.commit()

        return jsonify({
            'status': 201,
            'message': 'All arrangments have been deleted.'
        }), 201

    except Exception as e:
        app.logger.error(f"Error revoking arrangements: {e}")
        return jsonify({'message': 'Failed to revoke arrangements', 'code': 500}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
