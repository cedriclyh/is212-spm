from flask import Flask, request, jsonify

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import TINYINT

from os import environ
from flask_cors import CORS
import os
import sys

import bcrypt

import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:yourpassword@localhost:3306/spm" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db =SQLAlchemy(app)

CORS(app)

class User(db.Model):
    __tablename__ = 'Credentials'

    staff_id = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)

    def __init__(self, staff_id: int, email: str, password: str) -> None:
        super().__init__()
        self.staff_id = staff_id
        self.email = email
        self.password = password

    def json(self):
        return {
            'staff_id': self.staff_id,
            'email': self.email,
            'password': self.password
        }
    
# Get password - check password
@app.route('/login')
def login():
    credentials = request.get_json().get('credentials')

    staff_id = credentials['staff_id']
    email = credentials['email']
    password = credentials['password']

    user = db.session.query(User).filter_by(staff_id=staff_id, email=email).first()

    if user:
        # check if password matches
        if user.password == password :
            return jsonify ({"message": "Login successful", "code": 200}), 200
        else:
            return jsonify({"message": "Incorrect password", "code": 401}), 401
    else:
        return jsonify({"message": "Email not found"}), 404

# Update password - user changes password
@app.route('/user/password', methods=['PUT'])
def update_password():
    credentials = request.get_json().get('credentials')
    staff_id = credentials['staff_id']
    try:
        user = db.sessions.scalars(db.select(User).filter_by(staff_id=staff_id).limit(1)).first()
        if not user:
            return jsonify({"code":404, "message":"User not found."}), 404
        else:
            # get new password
            new_password = credentials['password']

            # update user's password
            user.password = new_password

            # commit the changes to the database
            db.session.commit()

            return jsonify({"code":201, "message": "Password successfully updated."}), 201
        
    except Exception as e:
        return jsonify({"code":500, "message":"An error occured while updating user preferences." + str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)