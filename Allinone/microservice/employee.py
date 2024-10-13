from flask import Flask, request, jsonify

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import TINYINT

from os import environ
from flask_cors import CORS
import os
import sys

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
    dept = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=False)
    reporting_manager = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Integer, nullable=False)

    # Method to convert the Employee object to a dictionary
    def to_dict(self):
        return {
            'staff_id': self.staff_id,
            'staff_fname': self.staff_fname,
            'staff_lname': self.staff_lname,
            'dept': self.dept,
            'position': self.position,
            'country': self.country,
            'email': self.email,
            'reporting_manager': self.reporting_manager,
            'role': self.role
        }


    def __init__(self, staff_id: int, staff_fname: str, staff_lname: str, dept: str, position: str, country: str, email: str, reporting_manager: int, role: int) -> None:
        super().__init__()
        self.staff_id = staff_id
        self.staff_fname = staff_fname
        self.staff_lname = staff_lname
        self.dept = dept
        self.position = position
        self.country = country
        self.email = email
        self.reporting_manager = reporting_manager
        self.role = role

    def json(self):
        output = {
            'staff_id': self.staff_id,
            'staff_fname': self.staff_fname,
            'staff_lname': self.staff_lname,
            'staff_dept': self.dept,
            'position': self.position,
            'country': self.country,
            'email': self.email,
            'reporting_manager': self.reporting_manager,
            'role_num': self.role
        }

        # checking role
        if self.role == 1:
            output['role'] = 'HR'
        elif self.role == 2:
            output['role'] = 'Staff'
        else:
            output['role'] = 'Manager'
        
        return output

# Get all employees
@app.route('/users')
def all_users():
    employee_list = db.session.query(Employee).all()

    if employee_list:
        # Convert each employee object into a dictionary
        employees_data = [employee.to_dict() for employee in employee_list]
        return jsonify({
            "message": "Employees found", 
            "data": employees_data, 
            "code": 200
            }), 200
    else:
        return jsonify({
            "message": "Employees not found", 
            "code": 404
            }), 404
    
# Get specific employee
@app.route('/user/<staff_id>')
def specific_user(staff_id):
    employee = db.session.query(Employee).filter_by(staff_id=staff_id).first()

    if employee:
        employee_data = employee.to_dict()
        return jsonify({
            "message": "Employee found", 
            "data": employee_data, 
            "code":200
            }), 200
    else:
        return jsonify({
            "message": "Employee not found", 
            "code":404
            }), 404
    
# Get specific employee's manager's email address to send notification of request made
@app.route('/user/manager_email/<int:manager_id>', methods=['GET'])
def get_manager_email(manager_id):
    try:
        # Fetch the manager's email based on their manager_id
        manager = db.session.query(Employee).filter_by(staff_id=manager_id).first()

        if manager:
            manager_email = manager.email
            return jsonify({
                "message": "Manager email found",
                "manager_email": manager_email,
                "code": 200
                }), 200
        else:
            return jsonify({
                "message": "Manager not found",
                "code": 404
                }), 404

    except Exception as e:
        app.logger.error(f"Failed to retrieve manager email: {e}")
        return jsonify({"message": "Failed to retrieve manager email", 
                        "error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)