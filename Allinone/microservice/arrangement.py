from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from os import environ
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = ( 
    # environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    environ.get("dbURL") or "mysql+mysqlconnector://root:root@localhost:3306/spm_db" #this is for mac users
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

# Create a new arrangement
@app.route('/create_arrangement', methods=['POST'])
def create_arrangement():
    try:
        data = request.json
        request_id = data.get("request_id")
        staff_id = data.get("staff_id")
        arrangement_date = data.get("arrangement_date")
        timeslot = data.get("timeslot")
        reason = data.get("reason")

        if not request_id or not staff_id or not arrangement_date or not timeslot or not reason:
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
        app.logger.error(f"Failed to retrieve arrangement: {e}")
        return jsonify({"message": "Failed to retrieve arrangement", "code": 500}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)  
