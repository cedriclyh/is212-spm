from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS
import os
import sys
from datetime import date, datetime, timedelta

import json

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
    

class BlockoutDates(db.Model):
    __tablename__ = 'Block_Out_Dates'

    blockout_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    timeslot = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    blockout_description = db.Column(db.String(255), nullable=False)

    def json(self):
        return {
            'blockout_id': self.blockout_id,
            'start_date': str(self.start_date),
            'end_date': str(self.end_date),
            'title': self.title,
            'timeslot': self.timeslot,
            'blockout_description': self.blockout_description
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
def delete_request():

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

# Create new blockout dates
@app.route('/create_blockout', methods=['POST'])
def blockDate():
    try:
        data = request.json
        print(data)
        
        print("[create_blockout] Creating blockout...")
        start_date = datetime.strptime(data["start_date"], '%Y-%m-%d').date()
        end_date = datetime.strptime(data["end_date"], '%Y-%m-%d').date()

        blockout = BlockoutDates(
            start_date = start_date,
            end_date = end_date,
            timeslot = data["timeslot"]["anchorKey"],
            title = data["title"],
            blockout_description = data["blockout_description"],
        )

        # Check if blockout exists
        print("[create_blockout] Checking for existing blockouts...")
        if fetch_blockout_by_date(start_date, end_date):
            print("[create_blockout] Error fetching:", fetch_blockout_by_date(start_date, end_date))
            return jsonify({'message': 'Failed to create blockout. Blockout already exists within the selected date range.', 'code': 409}), 409
        
        else:
            # Commit changes for blockout 
            print("[create_blockout] No existing blockouts")
            db.session.add(blockout)
            db.session.commit()
            print(f'[create_blockout] Blockout created for {data["title"]} from {start_date} and {end_date}')
            return jsonify({'message': f'Blockout created for {data["title"]} from {start_date} and {end_date}', 'data': blockout.json(), 'code':200}), 200

    except Exception as e:
        app.logger.error(f"Failed to create blockout: {e}")
        return jsonify({'message': 'Failed to create blockout', 'code': 500}), 500
    
# Retrieve all block out dates
@app.route('/get_blockouts', methods=['GET'])
def get_blockouts():
    try:
        blockouts = BlockoutDates.query.all()
        print([blockout.json() for blockout in blockouts])
        return jsonify({'message': 'All requests', 'data': [blockout.json() for blockout in blockouts], 'code': 200}), 200

    except Exception as e:
        app.logger.error(f"Failed to retrieve blockout dates: {e}")
        return jsonify({'message': 'Failed to retrieve blockout dates', 'code': 500}), 500

def fetch_blockout_by_date(query_start_date, query_end_date):
    try:
        print("[fetch_blockout_by_date] Fetching blockouts...")
        blockout = BlockoutDates.query.filter(
            BlockoutDates.start_date <= query_end_date,
            BlockoutDates.end_date >= query_start_date
        ).first()

        print("[fetch_blockout_by_date] Returning blockout...")
        print("[fetch_blockout_by_date] Blockout:", blockout)
        return blockout
    except Exception as e:
        app.logger.error(f"Error fetching blockouts for dates: {query_start_date} to {query_end_date}: {e}")
        return None

@app.route('/get_blockout/date/<string:query_start_date><string:query_end_date>', methods=['GET'])
def get_blockout_by_date(query_start_date, query_end_date):
    blockout = fetch_blockout_by_date(query_start_date, query_end_date)
    if blockout:
        return jsonify({'message': 'Blockout found', 'data': blockout.json()})
    else:
        return jsonify({'message': 'No blockout date found for given date', 'data': False})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
