from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS
import os
import sys

from datetime import date
from dateutil.relativedelta import relativedelta


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
def delete_arrangement():
    try:
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
@app.route('/revoke_arrangement')   
def revoke_arrangement(staff_id, revoke_dates,):
    data = request.json
    try: 
        
        for revoke_date in revoke_dates:
        # 1. Check if arrangement is within 1 month ago and 3 months forward
            checked_date_response = check_date(revoke_date)
            if checked_date_response.json.code != 200:
                return checked_date_response
            
        # 2. Delete arrangement from db
            arrangements_to_delete = Arrangement.query.filter_by(staff_id=staff_id,
                                                       arrangement_date=revoke_date
                                                       ).all()     
            arrange_ids = [arrangement.request_id for arrangement in arrangements_to_delete]
            
        #2. Update list 

    except Exception as e:
        app.logger.error(f"Error revoking arrangments: {e}")

# Checks for 1 month ago and 3 months back
def check_date(date_to_check):
    # if date_to_check <= date.today() + relativedelta(days=+1):
        # return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement that", "code": 500}), 500
    if date_to_check <= date.today() + relativedelta(months=-1):
        return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 1 month past the arrangement date.", "code": 500}), 500
    if date_to_check >= date.today() + relativedelta(months=+3):
        return jsonify({"message": f"Failed to revoke arrangement for date {date_to_check}: Cannot revoke arrangement more than 3 months ahead of current date.", "code": 500}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
