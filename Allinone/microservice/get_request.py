from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"

# Get requests with complete details - for employee request table
@app.route('/employees/<int:employee_id>/requests', methods=['GET'])
def get_employee_requests(employee_id):
    try:
        # Request data from employee microservice
        employee_requests_response = requests.get(f'{REQUEST_LOG_MICROSERVICE_URL}/get_requests/staff/{employee_id}')
        employee_requests_response.raise_for_status()
    except requests.exceptions.HTTPError as http_err:
        if employee_requests_response.status_code == 404:
            return jsonify({
                "message": "Employee requests not found",
                "request_data": [],
                "code": 404
            }), 404
        elif employee_requests_response.status_code == 500:
            return jsonify({
                "message": "Internal server error while fetching employee requests",
                "request_data": [],
                "code": 500
            }), 500
        else:
            return jsonify({
                "message": f"HTTP error occurred: {http_err}",
                "request_data": [],
                "code": employee_requests_response.status_code
            }), employee_requests_response.status_code
    except requests.exceptions.Timeout:
        return jsonify({
            "message": "Request to the employee microservice timed out",
            "request_data": [],
            "code": 504
        }), 504
    except requests.exceptions.RequestException as err:
        return jsonify({
            "message": f"Error occurred: {err}",
            "request_data": [],
            "code": 500
        }), 500

    # Get employee requests data
    employee_requests = employee_requests_response.json().get('data', [])

    manager_dict = {}

    for request in employee_requests:
        manager_id = request.get('manager_id')
        if manager_id not in manager_dict:
            try:
                # Fetch manager details for each request
                manager_response = requests.get(f'{EMPLOYEE_MICROSERVICE_URL}/user/{manager_id}')
                manager_response.raise_for_status()
                manager_dict[manager_id] = manager_response.json().get('data', {})
            except requests.exceptions.HTTPError as http_err:
                # Log the error but continue processing other requests
                app.logger.error(f"Manager {manager_id} fetch failed: {http_err}")
                manager_dict[manager_id] = None  # Set as None to indicate failure
            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error occurred while fetching manager {manager_id}: {err}")
                manager_dict[manager_id] = None

        # Add manager details (or None) to the request
        request['manager_details'] = manager_dict.get(manager_id)

    return jsonify({
        'message': f'Requests from staff {employee_id} found',
        'data': employee_requests,
        'code': 200
    }), 200

@app.route("/manager/<int:manager_id>/requests", methods=["GET"])
def get_team_requests(manager_id):
    try:
         # Request data from employee microservice
        team_requests_response = requests.get(f'{REQUEST_LOG_MICROSERVICE_URL}/get_requests/manager/{manager_id}')
        team_requests_response.raise_for_status()
    except requests.exceptions.HTTPError as http_err:
        if team_requests_response.status_code == 404:
            return jsonify({
                "message": "Employee requests not found",
                "request_data": [],
                "code": 404
            }), 404
        elif team_requests_response.status_code == 500:
            return jsonify({
                "message": "Internal server error while fetching employee requests",
                "request_data": [],
                "code": 500
            }), 500
        else:
            return jsonify({
                "message": f"HTTP error occurred: {http_err}",
                "request_data": [],
                "code": team_requests_response.status_code
            }), team_requests_response.status_code
    except requests.exceptions.Timeout:
        return jsonify({
            "message": "Request to the employee microservice timed out",
            "request_data": [],
            "code": 504
        }), 504
    except requests.exceptions.RequestException as err:
        return jsonify({
            "message": f"Error occurred: {err}",
            "request_data": [],
            "code": 500
        }), 500
    
    team_requests = team_requests_response.json().get('data', [])

    staff_dict = {}

    for request in team_requests:
        staff_id = request.get('staff_id')
        if staff_id not in staff_dict:
            try:
                # Fetch manager details for each request
                staff_response = requests.get(f'{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}')
                staff_response.raise_for_status()
                staff_dict[staff_id] = staff_response.json().get('data', {})
            except requests.exceptions.HTTPError as http_err:
                # Log the error but continue processing other requests
                app.logger.error(f"Manager {staff_id} fetch failed: {http_err}")
                staff_dict[staff_id] = None  # Set as None to indicate failure
            except requests.exceptions.RequestException as err:
                app.logger.error(f"Error occurred while fetching manager {manager_id}: {err}")
                staff_dict[staff_id] = None

        request['staff_details'] = staff_dict.get(staff_id)

    return jsonify({
        'message': f'Requests from team manager {manager_id} found',
        'data': team_requests,
        'code': 200
    }), 200

@app.route("/view_request/<int:request_id>")
def view_request(request_id):
    try:
        request_response = requests.get(f'{REQUEST_LOG_MICROSERVICE_URL}/get_request/{request_id}')
        request_response.raise_for_status()
    except requests.exceptions.HTTPError as http_err:
        if request_response.status_code == 404:
            return jsonify({
                "message": "Employee requests not found",
                "request_data": [],
                "code": 404
            }), 404
        elif request_response.status_code == 500:
            return jsonify({
                "message": "Internal server error while fetching employee requests",
                "request_data": [],
                "code": 500
            }), 500
        else:
            return jsonify({
                "message": f"HTTP error occurred: {http_err}",
                "request_data": [],
                "code": request_response.status_code
            }), request_response.status_code
    
    request_data = request_response.json().get('data')

    staff_id = request_data['staff_id']
    try:
        staff_response = requests.get(f'{EMPLOYEE_MICROSERVICE_URL}/user/{staff_id}')
        staff_response.raise_for_status()
        request_data['staff_details'] = staff_response.json().get('data', {})
    except requests.exceptions.HTTPError as http_err:
        app.logger.error(f"Staff {staff_id} fetch failed: {http_err}")
    except requests.exceptions.RequestException as err:
        app.logger.error(f"Error occurred while fetching staff {staff_id}: {err}")

    manager_id = request_data['manager_id']
    try:
        staff_response = requests.get(f'{EMPLOYEE_MICROSERVICE_URL}/user/{manager_id}')
        staff_response.raise_for_status()
        request_data['manager_details'] = staff_response.json().get('data', {})
    except requests.exceptions.HTTPError as http_err:
        app.logger.error(f"Manager {staff_id} fetch failed: {http_err}")
    except requests.exceptions.RequestException as err:
        app.logger.error(f"Error occurred while fetching manager {manager_id}: {err}")

    return jsonify({
        'message': f'Request found.',
        'data': request_data,
        'code': 200
    }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5011, debug=True)
