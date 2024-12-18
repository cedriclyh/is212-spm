from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import requests
import os
from os import environ
from flask_cors import CORS

from datetime import date, datetime, timedelta

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

# Create new blockout dates
@app.route('/blockout/create_blockout', methods=['POST'])
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
            return jsonify({'message': f'Blockout created for {data["title"]} from {start_date} and {end_date}', 'data': blockout.json(), 'code':201}), 201

    except Exception as e:
        app.logger.error(f"Failed to create blockout: {e}")
        return jsonify({'message': 'Failed to create blockout', 'code': 500}), 500
    
# Retrieve all block out dates
@app.route('/blockout/get_blockouts', methods=['GET'])
def get_blockouts():
    try:
        blockouts = BlockoutDates.query.all()
        print([blockout.json() for blockout in blockouts])
        return jsonify({'message': 'All requests', 'data': [blockout.json() for blockout in blockouts], 'code': 200}), 200

    except Exception as e:
        app.logger.error(f"Failed to retrieve blockout dates: {e}")
        return jsonify({'message': 'Failed to retrieve blockout dates', 'code': 404}), 404
    
@app.route('/blockout/get_blockout/date/<string:query_start_date><string:query_end_date>', methods=['GET'])
def get_blockout_by_date(query_start_date, query_end_date):
    blockout = fetch_blockout_by_date(query_start_date, query_end_date)
    if blockout:
        return jsonify({'message': 'Blockout found', 'data': blockout.json(), 'code':200}), 200
    else:
        return jsonify({'message': 'No blockout date found for given date', 'data': False, 'code':404}), 404

# Helper Function
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5014, debug=True)  
