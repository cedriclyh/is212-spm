from flask import Flask, request, jsonify
import requests
from flask_sqlalchemy import SQLAlchemy
import os
from os import environ
from flask_cors import CORS

app = Flask(__name__)
if app.config['TESTING']:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        environ.get("dbURL") or
        os.environ.get('DB_URL', 'mysql+mysqlconnector://root@localhost:3306/spm_db')
        or os.environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
    )
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
CORS(app)

EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
BLOCKOUT_URL = "http://localhost:5014/blockout"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"
ARRANGEMENT_MICROSERVICE_URL = "http://localhost:5005"
NOTIFICATION_MICROSERVICE_URL = "http://localhost:5009"

from arrangement.arrangement import Arrangement
from blockout import BlockoutDates
from employee.employee import Employee

@app.route('/manage_blockout', methods=['POST'])
def manage_blockout():
    try:
        data = request.json
        print(data)

        start_date = data["start_date"]
        end_date = data["end_date"]
        timeslot = data["timeslot"]["anchorKey"]
        staff_id = 140003  # replace code to retrieve from json


        # 1: fetch staff email and department from employee.py using staff_id
        employee_response = requests.get(f"{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}")
        
        if employee_response.status_code != 200:
            return jsonify({"message": "Failed to fetch employee details", 
                            "code": 404}), 404

        employee_data = employee_response.json().get("data")
        staff_email = employee_data.get("email")
        dept = employee_data.get("dept")

        if not staff_email:
            return jsonify({"message": "Staff email not found", 
                            "code": 404}), 404

        # 2. Delete all existing arrangements within blockout range
        
        delete_arrangements_query = db.session.query(Arrangement) \
            .join(Employee, Employee.staff_id == Arrangement.staff_id) \
            .filter(Employee.dept == dept, 
                    Arrangement.arrangement_date >= start_date, 
                    Arrangement.arrangement_date <= end_date)

        print("Arrangements to delete query created")

        arrangements_to_delete = delete_arrangements_query.all()
        print("Arrangements to delete", arrangements_to_delete)

        if arrangements_to_delete:
            if timeslot == "FULL":
                arrangements_to_delete = delete_arrangements_query.filter(Arrangement.timeslot.in_(["AM", "PM", "FULL"])).all()
            else:
                arrangements_to_delete = delete_arrangements_query.filter(Arrangement.timeslot.in_([timeslot, "FULL"])).all()

            # Extracting the arrangement request_ids
            arrangement_ids = [arrangement.request_id for arrangement in arrangements_to_delete]

            # 3. Call delete_arrangements endpoint to delete the arrangements
            delete_response = requests.delete(f"{ARRANGEMENT_MICROSERVICE_URL}/delete_arrangements", json={"arrangement_ids": arrangement_ids})

            if delete_response.status_code != 200:
                print("Delete response:", delete_response.json())
                return delete_response.json(), delete_response.status_code

        # 4. Reject all approved/pending requests that coincide with blockout 
        
        # 5. Create blockout via arrangement.py
        post_response = requests.post(f"{BLOCKOUT_URL}/create_blockout", json=data)

        if post_response.status_code != 200:
            print("Post response:", post_response.json())
            return post_response.json(), post_response.status_code
    
        return jsonify({"message": "Blockout created successfully. Approved arrangements within the selected range have been deleted. ", "code": 200}), 200

    except Exception as e:
        app.logger.error(f"Failed to manage blockout: {e}")
        return jsonify({"message": "Internal server error", "code": 500}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5012, debug=True)  