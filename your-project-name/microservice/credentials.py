from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from functools import wraps
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS

import os
from os import environ
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = (
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:yourpassword@localhost:3306/spm_db" #this is for mac users
)
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
CORS(app)

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    __tablename__ = 'Credentials'

    staff_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<Staff ID: {self.staff_id}>'


class Employee(db.Model):
    __tablename__ = 'Employee'
    
    staff_id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.Integer, nullable=False)

    def __repr__(self):
        return f'<Staff ID: {self.staff_id}>'

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(username=data['username'], password=hashed_password, role='user')  # default role
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Check if user exists in database
        user = User.query.filter_by(staff_id=data["staff_id"]).first()
        if not user:
            print("incorrect user")  # rmb to comment out later
            return jsonify({'error': 'Invalid email or password'}), 401

        # if not bcrypt.check_password_has(user.password, data['password']):
        if user.password != data['password']:
            print("incorrect password") # rmb to comment out later
            return jsonify({'error': 'Invalid email or password'}), 401

        # Check role
        employee = Employee.query.filter_by(staff_id=data["staff_id"]).first()

        #Succesful login: create access token
        access_token = create_access_token(identity={"username": user.staff_id, "role": employee.role})
        return jsonify(access_token=access_token), 200
        
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Exception during login: {str(e)}")
        return jsonify({'error': 'Internal Server Error'}), 500

# Role check decorator
def role_required(required_role):
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            current_user = get_jwt_identity()
            if current_user['role'] != required_role:
                return jsonify({"message": "Access forbidden: Insufficient role"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Example route accessible only by 'HR' users
# change path in the future
@app.route('/hr-data', methods=['GET'])
@role_required(1)
def hr_data():
    return jsonify({"message": "Welcome HR! You can view HR-specific data here."}), 200

# Example route accessible only by 'manager' users
# change path in the future
@app.route('/manager-data', methods=['GET'])
@role_required(3)
def manager_data():
    return jsonify({"message": "Welcome Manager! You can view manager-specific data here."}), 200


if __name__ == "__main__":
    # db.create_all()  # Creates the SQLite database
    app.run(port=5000, debug=True)
