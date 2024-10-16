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
    title = db.Column(db.String(255), nullable=False)
    blockout_description = db.Column(db.String(255), nullable=False)

    def json(self):
        return {
            'blockout_id': self.blockout_id,
            'start_date': str(self.start_date),
            'end_date': str(self.end_date),
            'title': self.title,
            'blockout_description': self.blockout_description
    }

# Create a new WFH request
@app.route('/create_request', methods=['POST'])
def create_request():
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
            return jsonify({'message': f'No requests from staff {staff_id}', 'code': 404}), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests by staff ID: {e}")
        return jsonify({'message': 'Failed to retrieve requests by staff ID', 'code': 500}), 500


# Create new blockout dates
@app.route('/blockout', methods=['POST'])
def blockDate():
    try:
        data = request.json
        print(data)
        
        start_date = datetime.strptime(data["start_date"], '%Y-%m-%d').date()
        end_date = datetime.strptime(data["end_date"], '%Y-%m-%d').date()

        blockout = BlockoutDates(
            start_date = start_date,
            end_date = end_date,
            title = data["title"],
            blockout_description = data["blockout_description"],
        )

        if get_blockout_by_date(start_date, end_date).data:
            # Commit changes for all dates 
            db.session.add(blockout)
            db.session.commit()
            print(f"Failed to create blockout. At least one blockout already exists within the selected date range.")
            return jsonify({'message': 'Failed to create blockout. At least one blockout already exists within the selected date range.', 'data': blockout.json(), 'code':409}), 409        
        else:
            print(f'Blockout created for {data["title"]} from {start_date} and {end_date}')
            return jsonify({'message': f'Blockout created for {data["title"]} from {start_date} and {end_date}', 'data': blockout.json(), 'code':200}), 200

    except Exception as e:
        app.logger.error(f"Failed to create blockout: {e}")
        return jsonify({'message': 'Failed to create blockout', 'code': 500}), 500
    
# Retrieve all block out dates
@app.route('/get_blockouts', methods=['GET'])
def get_blockouts():
    try:
        blockouts = BlockoutDates.query.all()
        return jsonify({'message': 'All requests', 'data': [blockout.json() for blockout in blockouts], 'code': 200}), 200

    except Exception as e:
        app.logger.error(f"Failed to retrieve blockout dates: {e}")
        return jsonify({'message': 'Failed to retrieve blockout dates', 'code': 500}), 500

@app.route('/get_blockout/date/<string:query_start_date><string:query_end_date>', methods=['GET'])
def get_blockout_by_date(query_start_date, query_end_date):
    # Convert query_date to datetime.date object
    # query_start_date = date.fromisoformat(query_start_date)
    # query_end_date = date.fromisoformat(query_end_date)

    try:
        blockout = BlockoutDates.query.filter(
            BlockoutDates.start_date <= query_end_date,
            BlockoutDates.end_date >= query_start_date
        ).first()

        if blockout:
            return jsonify({'message': f'Blockout found', 'data': blockout.json()})
        else:
            return jsonify({'message': 'No blockout date found for given date', 'data': False})

    except Exception as e:
        app.logger.error(f"Failed to retrieve blockouts for the date {date}: {e}")
        return jsonify({'message':f'Failed to retrieve blockouts for the date {date}', 'code': 500}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
