from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

import os
from os import environ
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/spm_db" 
    # environ.get("dbURL") or "mysql+mysqlconnector://root:yourpassword@localhost:3306/spm_db" #this is for mac users
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)

db = SQLAlchemy(app)

if __name__ == "__main__":
    # db.create_all()  # Creates the SQLite database
    app.run(port=5000, debug=True)
