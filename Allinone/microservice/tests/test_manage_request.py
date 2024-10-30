import pytest
from manage_request import app, db, count_wfh, past_wfh
from employee import Employee
from arrangement import Arrangement
from requests_log import Request
import json
from unittest.mock import patch, Mock
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
        with app.app_context():
            db.drop_all()

@pytest.fixture
def mock_requests(mocker):
    # Mock all external service calls
    mock_get = mocker.patch('requests.get')
    mock_post = mocker.patch('requests.post')
    mock_put = mocker.patch('requests.put')
    return mock_get, mock_post, mock_put

@pytest.fixture
def sample_data():
    with app.app_context():
        # Create sample employees
        employee1 = Employee(
            staff_id=101,
            staff_fname="John",
            staff_lname="Doe",
            dept="Engineering",
            position="Engineer",
            country="Singapore",
            email="john@example.com",
            reporting_manager="201",
            role=2
        )
        
        employee2 = Employee(
            staff_id=102,
            staff_fname="Jane",
            staff_lname="Smith",
            dept="Engineering",
            position="Engineer",
            country="Singapore",
            email="jane@example.com",
            reporting_manager="201",
            role=2
        )

        arrangement = Arrangement(
            request_id=1,
            staff_id=101,
            arrangement_date="2024-10-15",
            timeslot="AM",
            reason="Meeting"
        )

        db.session.add(employee1)
        db.session.add(employee2)
        db.session.add(arrangement)
        db.session.commit()

def test_count_wfh(client, sample_data):
    with app.app_context():
        am_count, pm_count = count_wfh("201", "2024-10-15")
        assert am_count == 1
        assert pm_count == 0

def test_past_wfh(client, sample_data):
    with app.app_context():
        assert past_wfh(101, "2024-10-15") == True
        assert past_wfh(102, "2024-10-15") == False

def test_manage_request_approve_success(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    
    # Mock responses for external services
    mock_get.side_effect = [
        # Request log response
        Mock(status_code=200, json=lambda: {
            "data": {
                "request_id": 1,
                "staff_id": 101,
                "arrangement_date": "2024-10-15",
                "timeslot": "AM",
                "reason": "Meeting"
            }
        }),
        # Employee response
        Mock(status_code=200, json=lambda: {
            "data": {
                "email": "john@example.com",
                "dept": "Engineering",
                "reporting_manager": "201"
            }
        }),
        # Team response
        Mock(status_code=200, json=lambda: {
            "data": [{"staff_id": 101}, {"staff_id": 102}]
        })
    ]

    mock_put.return_value = Mock(status_code=200)
    mock_post.side_effect = [
        Mock(status_code=201),  # Arrangement creation
        Mock(status_code=200)   # Notification
    ]

    data = {
        "request_id": 1,
        "status": "Approved",
        "remarks": "Approved"
    }

    response = client.put('/manage_request', json=data)
    assert response.status_code == 200
    assert b"Request Approved successfully" in response.data

def test_manage_request_reject(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    
    mock_get.side_effect = [
        Mock(status_code=200, json=lambda: {
            "data": {
                "request_id": 1,
                "staff_id": 101,
                "arrangement_date": "2024-10-15",
                "timeslot": "AM",
                "reason": "Meeting"
            }
        }),
        Mock(status_code=200, json=lambda: {
            "data": {
                "email": "john@example.com"
            }
        })
    ]

    mock_put.return_value = Mock(status_code=200)
    mock_post.return_value = Mock(status_code=200)

    data = {
        "request_id": 1,
        "status": "Rejected",
        "remarks": "Rejected"
    }

    response = client.put('/manage_request', json=data)
    assert response.status_code == 200
    assert b"Request Rejected successfully" in response.data

def test_manage_request_threshold_exceeded(client, mock_requests, sample_data):
    mock_get, mock_post, mock_put = mock_requests
    
    mock_get.side_effect = [
        Mock(status_code=200, json=lambda: {
            "data": {
                "request_id": 2,
                "staff_id": 102,
                "arrangement_date": "2024-10-15",
                "timeslot": "AM",
                "reason": "Meeting"
            }
        }),
        Mock(status_code=200, json=lambda: {
            "data": {
                "email": "jane@example.com",
                "dept": "Engineering",
                "reporting_manager": "201"
            }
        }),
        Mock(status_code=200, json=lambda: {
            "data": [{"staff_id": 101}, {"staff_id": 102}]  # 2 team members
        })
    ]

    data = {
        "request_id": 2,
        "status": "Approved",
        "remarks": "Approved"
    }

    response = client.put('/manage_request', json=data)
    assert response.status_code == 403
    assert b"exceed the 50% WFH threshold" in response.data

def test_cancel_request_success(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    
    mock_get.return_value = Mock(status_code=200, json=lambda: {
        "data": {
            "request_id": 1,
            "status": "Approved",
            "staff_email": "john@example.com",
            "staff_id": 101
        }
    })

    mock_put.return_value = Mock(status_code=200)

    data = {
        "request_id": 1
    }

    response = client.put('/cancel_request', json=data)
    assert response.status_code == 200
    assert b"Request successfully cancelled" in response.data

def test_auto_reject_pending_requests():
    with app.app_context():
        # Create an old pending request
        old_date = datetime.now(timezone.utc) - relativedelta(months=3)
        request = Request(
            staff_id=101,
            manager_id=201,
            request_date=old_date,
            arrangement_date="2024-10-15",
            timeslot="AM",
            reason="Test",
            remark="",
            is_recurring=False,
            recurring_day=None,
            start_date=None,
            end_date=None,
            status="Pending"
        )
        db.session.add(request)
        db.session.commit()

        # Run auto-reject
        from manage_request import auto_reject_pending_requests
        auto_reject_pending_requests()

        # Verify request was rejected
        updated_request = Request.query.filter_by(request_id=request.request_id).first()
        assert updated_request.status == "Rejected"

# Error case tests
def test_manage_request_invalid_data(client):
    response = client.put('/manage_request', json={})
    assert response.status_code == 400

def test_manage_request_request_not_found(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    mock_get.return_value = Mock(status_code=404)
    
    data = {
        "request_id": 999,
        "status": "Approved",
        "remarks": "Approved"
    }
    
    response = client.put('/manage_request', json=data)
    assert response.status_code == 404

def test_manage_request_employee_not_found(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    mock_get.side_effect = [
        Mock(status_code=200, json=lambda: {
            "data": {
                "request_id": 1,
                "staff_id": 999
            }
        }),
        Mock(status_code=404)
    ]
    
    data = {
        "request_id": 1,
        "status": "Approved",
        "remarks": "Approved"
    }
    
    response = client.put('/manage_request', json=data)
    assert response.status_code == 404

def test_cancel_request_invalid_status(client, mock_requests):
    mock_get, mock_post, mock_put = mock_requests
    mock_get.return_value = Mock(status_code=200, json=lambda: {
        "data": {
            "request_id": 1,
            "status": "Rejected"
        }
    })
    
    data = {"request_id": 1}
    response = client.put('/cancel_request', json=data)
    assert response.status_code == 403