from flask import Flask, request, jsonify

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import TINYINT

from os import environ
from flask_cors import CORS
import os
import sys
from datetime import date

import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    # environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm" 
    environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db =SQLAlchemy(app)

CORS(app)

class Employee(db.Model):
    __tablename__ = 'Employee'

    staff_id = db.Column(db.Integer, primary_key = True, nullable=False)
    staff_fname = db.Column(db.String(50), nullable=False)
    staff_lname = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=False)
    reporting_manager = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Integer, nullable=False)

class Request(db.Model):
    __tablename__ = 'Request'

    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, ForeignKey('Employee.staff_id'), nullable=False)
    requested_day = db.Column(db.Date, nullable=False)
    current_date = db.Column(db.Date, nullable=False, default=date.today)
    timeslot = db.Column(db.Integer, nullable=False)  # Morning, Afternoon, Full Day
    reason = db.Column(db.String(255), nullable=False) # Reason for WFH request
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, Approved, Rejected

    employee = relationship("Employee", backref="requests")

    def __init__(self, staff_id, requested_day, timeslot, reason, status='Pending'):
        self.staff_id = staff_id
        self.requested_day = requested_day
        self.current_date = date.today()
        self.timeslot = timeslot
        self.reason = reason
        self.status = status

    def json(self):
        return {
            'staff_id': self.staff_id,
            'requested_day': str(self.requested_day),
            'current_date': str(self.current_date),
            'timeslot': self.timeslot,
            'reason': self.reason,
            'status': self.status
        }
    
# Create a new WFH request
@app.route('/create_request', methods=['POST'])
def create_request():
    try:
        data = request.json
        new_request = Request(
            staff_id=data["staff_id"],
            requested_day=data["requested_day"],
            timeslot = data["timeslot"],
            reason = data["reason"],
        )
        print(new_request)
        db.session.add(new_request)
        db.session.commit()
        return jsonify({'message': 'Request created', 'data': new_request.json(), 'code':201}), 201
    
    except Exception as e:
        app.logger.error(f"Failed to create request: {e}")
        return jsonify({'message': 'Failed to create request', 'code': 500}), 500
    
# Retrieve all WFH requests
@app.route('/get_all_requests', methods = ["GET"])
def get_all_requests():
    try: 
        requests = Request.query.all()
        return jsonify({'message': 'All requests', 'data': [req.json() for req in requests], 'code': 200}), 200
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests: {e}")
        return jsonify({'message': 'Failed to retrieve requests', 'code': 500}), 500
    
# Retrieve a specific WFH request
@app.route('/request/<int:request_id>', methods=['GET'])
def get_request(request_id):
    try:
        request = Request.query.filter_by(request_id=request_id).first()
        if request:
            return jsonify({'message': 'Request found', 'data': request.json(), 'code': 200}), 200
        else:
            return jsonify({'message': 'Request not found', 'code': 404}), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve request: {e}")
        return jsonify({'message': 'Failed to retrieve request', 'code': 500}), 500

#Retrieve a WFH request by staff
@app.route('/requests/staff/<int:staff_id>', methods=['GET'])
def get_requests_by_staff_id(staff_id):
    try:
        requests = Request.query.filter_by(staff_id=staff_id).all()
        if requests:
            return jsonify({'message': f'Requests from staff {staff_id} found', 'data': [req.json() for req in request], 'code': 200}), 200
        else:
            return jsonify({'message': f'No requests from staff {staff_id}', 'code': 404}), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests by staff ID: {e}")
        return jsonify({'message': 'Failed to retrieve requests by staff ID', 'code': 500}), 500
    
# Update request status
@app.route('/request/<int:request_id>', methods=['PUT'])
def update_request(request_id):
    try:
        data = request.json
        request_to_update = Request.query.filter_by(request_id=request_id).first()
        if request_to_update:
            request_to_update.status = data.get('status', request_to_update.status)
            db.session.commit()
            return jsonify({'message': 'Request updated', 'data': request_to_update.json(), 'code': 200}), 200
        else:
            return jsonify({'message': 'Request not found', 'code': 404}), 404
    except Exception as e:
        app.logger.error(f"Failed to update request: {e}")
        return jsonify({'message': 'Failed to update request', 'code': 500}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)