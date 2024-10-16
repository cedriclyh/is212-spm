from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# URL endpoints for the existing microservices
EMPLOYEE_MICROSERVICE_URL = "http://localhost:5002"
REQUEST_LOG_MICROSERVICE_URL = "http://localhost:5003"

# Get requests with complete details - for employee request table
@app.route('/employees/<int:employee_id>/requests', methods=['GET'])
def get_employee_requests(employee_id):
    try:
        # Request data from employee microservice
        employee_requests_response = requests.get(f'{REQUEST_LOG_MICROSERVICE_URL}/requests/staff/{employee_id}')
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
