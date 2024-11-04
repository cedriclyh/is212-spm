import pytest
from get_request import app
import json
from unittest.mock import patch
import requests

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

@pytest.fixture
def mock_employee_request_response():
    """Mock response for employee requests matching SQL data"""
    return {
        'data': [
            {
                'request_id': 1,
                'staff_id': 140002,
                'manager_id': 140894,
                'arrangement_date': '2024-10-01',
                'timeslot': 'AM',
                'status': 'Approved',
                'reason': 'Medical Appointment',
                'remark': ''
            },
            {
                'request_id': 17,
                'staff_id': 140002,
                'manager_id': 140894,
                'arrangement_date': '2024-11-01',
                'timeslot': 'AM',
                'status': 'Approved',
                'reason': '',
                'remark': ''
            }
        ],
        'message': 'Requests found'
    }

@pytest.fixture
def mock_manager_response():
    """Mock response for manager details matching SQL data"""
    return {
        'data': {
            'staff_id': 140894,
            'staff_fname': 'Rahim',
            'staff_lname': 'Khalid',
            'dept': 'Sales',
            'position': 'Sales Manager',
            'email': 'Rahim.Khalid@allinone.com.sg'
        }
    }

def test_get_employee_requests_success(client, mock_employee_request_response, mock_manager_response):
    """Test successful retrieval of employee requests"""
    with patch('requests.get') as mock_get:
        # Mock the responses
        mock_get.side_effect = [
            type('Response', (), {
                'status_code': 200,
                'json': lambda: mock_employee_request_response,
                'raise_for_status': lambda: None
            }),
            type('Response', (), {
                'status_code': 200,
                'json': lambda: mock_manager_response,
                'raise_for_status': lambda: None
            })
        ]

        response = client.get('/employees/140002/requests')
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response data matches SQL sample data
        requests = data['data']
        assert len(requests) == 2
        assert requests[0]['request_id'] == 1
        assert requests[0]['manager_details']['staff_fname'] == 'Rahim'
        assert requests[1]['request_id'] == 17

def test_get_employee_requests_not_found(client):
    """Test retrieving requests for non-existent employee"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 404
        mock_get.return_value.raise_for_status = lambda: None
        
        response = client.get('/employees/999999/requests')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data['message'] == "Employee requests not found"

def test_get_team_requests_success(client):
    """Test successful retrieval of team requests"""
    team_requests_response = {
        'data': [
            {
                'request_id': 1,
                'staff_id': 140002,
                'manager_id': 140894,
                'arrangement_date': '2024-10-01',
                'timeslot': 'AM',
                'status': 'Approved',
                'reason': 'Medical Appointment'
            },
            {
                'request_id': 2,
                'staff_id': 140003,
                'manager_id': 140894,
                'arrangement_date': '2024-10-01',
                'timeslot': 'PM',
                'status': 'Approved',
                'reason': 'Lazy'
            }
        ]
    }

    staff_response = {
        'data': {
            'staff_id': 140002,
            'staff_fname': 'Susan',
            'staff_lname': 'Goh',
            'dept': 'Sales',
            'email': 'Susan.Goh@allinone.com.sg'
        }
    }

    with patch('requests.get') as mock_get:
        mock_get.side_effect = [
            type('Response', (), {
                'status_code': 200,
                'json': lambda: team_requests_response,
                'raise_for_status': lambda: None
            }),
            type('Response', (), {
                'status_code': 200,
                'json': lambda: staff_response,
                'raise_for_status': lambda: None
            }),
            type('Response', (), {
                'status_code': 200,
                'json': lambda: staff_response,
                'raise_for_status': lambda: None
            })
        ]

        response = client.get('/manager/140894/requests')
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Verify response data matches SQL sample data
        requests = data['data']
        assert len(requests) == 2
        assert requests[0]['request_id'] == 1
        assert requests[0]['staff_details']['staff_fname'] == 'Susan'

def test_get_team_requests_not_found(client):
    """Test retrieving team requests for non-existent manager"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 404
        mock_get.return_value.raise_for_status = lambda: None
        
        response = client.get('/manager/999999/requests')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data['message'] == "Employee requests not found"

def test_request_timeout(client):
    """Test handling of request timeouts"""
    with patch('requests.get') as mock_get:
        mock_get.side_effect = requests.exceptions.Timeout
        
        response = client.get('/employees/140002/requests')
        assert response.status_code == 504
        data = json.loads(response.data)
        assert "timed out" in data['message']

def test_request_connection_error(client):
    """Test handling of connection errors"""
    with patch('requests.get') as mock_get:
        mock_get.side_effect = requests.exceptions.ConnectionError
        
        response = client.get('/employees/140002/requests')
        assert response.status_code == 500
        data = json.loads(response.data)
        assert "Error occurred" in data['message']

def test_invalid_json_response(client):
    """Test handling of invalid JSON responses"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.json.side_effect = ValueError
        mock_get.return_value.status_code = 200
        
        response = client.get('/employees/140002/requests')
        assert response.status_code == 500
        data = json.loads(response.data)
        # assert 'Error occurred' in data['message']  # Verify the error message