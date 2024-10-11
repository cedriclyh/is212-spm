from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"

@app.route('/employees/<int:employee_id>/requests', methods=['GET'])
def get_employee_requests(employee_id):
    return {}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)