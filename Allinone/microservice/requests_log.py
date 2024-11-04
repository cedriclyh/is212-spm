from flask import Flask, request, jsonify
from flask import render_template

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy import Boolean

from os import environ
from flask_cors import CORS
import os
import sys
from datetime import date, datetime, timezone

import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
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
    __tablename__ = 'Request_log'

    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, ForeignKey('Employee.staff_id'), nullable=False)
    manager_id = db.Column(db.Integer, nullable=False)
    request_date = db.Column(db.Date, nullable=False)
    arrangement_date = db.Column(db.Date, nullable=True)
    timeslot = db.Column(db.String(50), nullable=False)  # Morning - 1, Afternoon - 2, Full Day - 3
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, Approved, Rejected
    reason = db.Column(db.String(255), nullable=False, default="") # Reason for WFH request
    remark = db.Column(db.String(255), nullable=False, default="") # remarks for when manager approve/reject request
    recurring_day = db.Column(db.String(20), nullable=True) 
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    is_recurring = db.Column(Boolean, nullable=False, default=False)

    employee = relationship("Employee", backref="requests")

    def __init__(self, staff_id, manager_id, request_date, arrangement_date, timeslot, reason, remark, 
                 is_recurring, recurring_day, start_date, end_date, status="Pending"):
        self.staff_id = staff_id
        self.manager_id = manager_id
        self.request_date = request_date
        self.timeslot = timeslot
        self.reason = reason
        self.remark = remark
        self.is_recurring = is_recurring
        self.status = status

        if is_recurring:
            self.recurring_day = recurring_day
            self.start_date = start_date
            self.end_date = end_date
            self.arrangement_date = None
        else:
            self.arrangement_date = arrangement_date
            self.recurring_day = None
            self.start_date = None
            self.end_date = None

    def json(self):
        return {
            'request_id': self.request_id,
            'staff_id': self.staff_id,
            'manager_id': self.manager_id,
            'arrangement_date': str(self.arrangement_date),
            'request_date': str(self.request_date),
            'timeslot': self.timeslot,
            'reason': self.reason,
            'remark': self.remark,
            'status': self.status,
            'recurring_day': self.recurring_day,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'is_recurring': self.is_recurring
        }
    
class RequestDates(db.Model):
    __tablename__ = 'RequestDates'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, ForeignKey('Request_log.request_id'), nullable=False)
    arrangement_date = db.Column(db.Date, nullable=False)

# Create a new WFH request
@app.route('/create_request', methods=['POST'])
def create_request():
    try:
        data = request.json
        is_recurring = data.get("is_recurring")

        new_request = Request(
            staff_id = data["staff_id"],
            manager_id = data["manager_id"],
            request_date = data["request_date"],
            timeslot = data["timeslot"],
            reason = data["reason"],
            remark = data["remark"],
            is_recurring=is_recurring,
            arrangement_date=data.get("arrangement_date") if not is_recurring else None,
            recurring_day=data.get("recurring_day") if is_recurring else None,
            start_date=data.get("start_date") if is_recurring else None,
            end_date=data.get("end_date") if is_recurring else None
        )
        # print(new_request)
        db.session.add(new_request)
        db.session.commit()

        # If it's a recurring request, insert the additional dates into RequestDates
        if is_recurring and "arrangement_dates" in data:
            for date in data["arrangement_dates"]:
                request_date_entry = RequestDates(
                    request_id=new_request.request_id,
                    arrangement_date=date
                )
                db.session.add(request_date_entry)
        db.session.commit()

        return jsonify({
            'message': 'Request created', 
            'data': new_request.json(), 
            'code':201
        }), 201
    
    except Exception as e:
        app.logger.error(f"Failed to create request: {e}")
        return jsonify({
            'message': 'Failed to create request', 
            'code': 500
        }), 500
    
# Retrieve all WFH requests
@app.route('/get_all_requests', methods = ["GET"])
def get_all_requests():
    try: 
        all_requests = Request.query.all()
        requests_with_dates = []
        for request in all_requests:
            request_data = request.json()
            related_dates = db.session.query(RequestDates.arrangement_date).filter_by(request_id=request.request_id).all()
            request_data["arrangement_dates"] = [str(date.arrangement_date) for date in related_dates]
            requests_with_dates.append(request_data)
        return jsonify({'message': 'All requests', 
                        'data': requests_with_dates, 
                        'code': 200
        }), 200
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests: {e}")
        return jsonify({'message': 'Failed to retrieve requests', 
                        'code': 500
        }), 500
    
# Retrieve a specific WFH request
@app.route('/get_request/<int:request_id>', methods=['GET'])
def get_request(request_id):
    try:
        request = Request.query.filter_by(request_id=request_id).first()
        related_dates = db.session.query(RequestDates.arrangement_date).filter_by(request_id=request_id).all()
        if request:
            request_data = request.json()
            request_data["arrangement_dates"] = [str(date.arrangement_date) for date in related_dates]
            return jsonify({
                'message': 'Request found', 
                'data': request_data, 
                'code': 200
            }), 200
        else:
            return jsonify({'message': 'Request not found', 
                            'code': 404
            }), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve request: {e}")
        return jsonify({'message': 'Failed to retrieve request', 
                        'code': 500
        }), 500

#Retrieve a WFH request by staff
@app.route('/get_requests/staff/<int:staff_id>', methods=['GET'])
def get_requests_by_staff_id(staff_id):
    try:
        requests = Request.query.filter_by(staff_id=staff_id).all()
        if requests:
            request_with_dates = []
            for request in requests:
                request_data = request.json()
                related_dates = db.session.query(RequestDates.arrangement_date).filter_by(request_id=request.request_id).all()
                request_data["arrangement_dates"] = [str(date.arrangement_date) for date in related_dates]
                request_with_dates.append(request_data)
            return jsonify({
                'message': f'Requests from staff {staff_id} found', 
                'data': request_with_dates, 
                'code': 200
            }), 200
        else:
            return jsonify({'message': f'No requests from staff {staff_id}', 
                            'code': 404
            }), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests by staff ID: {e}")
        return jsonify({'message': 'Failed to retrieve requests by staff ID', 
                        'code': 500
        }), 500
    
#Retrieve all WFH request by team members of the same team
@app.route('/get_requests/manager/<int:manager_id>', methods=['GET'])
def get_requests_by_manager_id(manager_id):
    try:
        requests = Request.query.filter_by(manager_id=manager_id).all()
        if requests:
            request_with_dates = []
            for request in requests:
                request_data = request.json()
                related_dates = db.session.query(RequestDates.arrangement_date).filter_by(request_id=request.request_id).all()
                request_data["arrangement_dates"] = [str(date.arrangement_date) for date in related_dates]
                request_with_dates.append(request_data)
            return jsonify({
                'message': f'Requests from manager {manager_id} found', 
                'data': request_with_dates, 
                'code': 200
            }), 200
        else:
            return jsonify({'message': f'No requests from manager {manager_id}', 
                            'code': 404
            }), 404
    except Exception as e:
        app.logger.error(f"Failed to retrieve requests by manager ID: {e}")
        return jsonify({'message': 'Failed to retrieve requests by manager ID', 
                        'code': 500
        }), 500

    
# Update request status
@app.route('/update_request/<int:request_id>', methods=['PUT'])
def update_request(request_id):
    try:
        data = request.json
        request_to_update = Request.query.filter_by(request_id=request_id).first()
        if request_to_update:
            request_to_update.status = data.get('status', request_to_update.status)
            db.session.commit()
            return jsonify({'message': 'Request updated', 
                            'data': request_to_update.json(), 
                            'code': 200
            }), 200
        else:
            return jsonify({'message': 'Request not found', 
                            'code': 404
            }), 404
    except Exception as e:
        app.logger.error(f"Failed to update request: {e}")
        return jsonify({'message': 'Failed to update request', 
                        'code': 500
        }), 500
    
# Edit request
@app.route('/edit_request/<int:request_id>', methods=['PUT'])
def edit_request(request_id):
    try:
        data = request.json
        request_to_edit = Request.query.filter_by(request_id=request_id).first()
        
        if not request_to_edit:
            return jsonify({
                'message': 'Request not found',
                'code': 404
            }), 404

        # update the fields that can be edited
        request_to_edit.request_date = data.get('request_date', request_to_edit.request_date)
        request_to_edit.timeslot = data.get('timeslot', request_to_edit.timeslot)
        request_to_edit.reason = data.get('reason', request_to_edit.reason)
        request_to_edit.is_recurring = data.get('is_recurring', request_to_edit.is_recurring)

        if request_to_edit.is_recurring:
            request_to_edit.recurring_day = data.get('recurring_day', request_to_edit.recurring_day)
            request_to_edit.start_date = data.get('start_date', request_to_edit.start_date)
            request_to_edit.end_date = data.get('end_date', request_to_edit.end_date)
            request_to_edit.arrangement_date = None
            
            # handle updating arrangement dates for recurring requests
            if 'arrangement_dates' in data:
                # delete existing dates
                RequestDates.query.filter_by(request_id=request_id).delete()
                
                # add new dates
                for date in data['arrangement_dates']:
                    new_date = RequestDates(
                        request_id=request_id,
                        arrangement_date=date
                    )
                    db.session.add(new_date)
        else:
            request_to_edit.arrangement_date = data.get('arrangement_date', request_to_edit.arrangement_date)
            request_to_edit.recurring_day = None
            request_to_edit.start_date = None
            request_to_edit.end_date = None
            RequestDates.query.filter_by(request_id=request_id).delete()

        db.session.commit()

        # get updated request with dates
        request_data = request_to_edit.json()
        if request_to_edit.is_recurring:
            related_dates = db.session.query(RequestDates.arrangement_date).filter_by(request_id=request_id).all()
            request_data['arrangement_dates'] = [str(date.arrangement_date) for date in related_dates]

        return jsonify({
            'message': 'Request updated successfully',
            'data': request_data,
            'code': 200
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to edit request: {e}")
        return jsonify({
            'message': 'Failed to edit request',
            'error': str(e),
            'code': 500
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)