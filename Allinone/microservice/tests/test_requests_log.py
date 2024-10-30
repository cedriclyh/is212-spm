import pytest
from requests_log import app, db, Request, RequestDates, Employee
import json
from datetime import date

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
def sample_data():
    with app.app_context():
        # Create sample employee
        employee = Employee(
            staff_id=140002,
            staff_fname="Susan",
            staff_lname="Goh",
            department="Sales",
            position="Account Manager",
            country="Singapore",
            email="Susan.Goh@allinone.com.sg",
            reporting_manager="140894",
            role=2
        )
        db.session.add(employee)

        # Create sample requests
        requests = [
            Request(
                staff_id=140002,
                manager_id=140894,
                request_date=date(2024, 10, 1),
                arrangement_date="2024-10-15",
                timeslot="AM",
                reason="Medical Appointment",
                remark="",
                is_recurring=False,
                recurring_day="",
                start_date="",
                end_date="",
                status="Pending"
            ),
            Request(
                staff_id=140002,
                manager_id=140894,
                request_date=date(2024, 10, 1),
                arrangement_date="",
                timeslot="FULL",
                reason="Weekly Team Meeting",
                remark="",
                is_recurring=True,
                recurring_day="Monday",
                start_date="2024-11-01",
                end_date="2024-12-31",
                status="Pending"
            )
        ]
        
        for req in requests:
            db.session.add(req)
        db.session.commit()

        # Add recurring dates for the second request
        recurring_dates = [
            RequestDates(request_id=2, arrangement_date=date(2024, 11, 4)),
            RequestDates(request_id=2, arrangement_date=date(2024, 11, 11)),
            RequestDates(request_id=2, arrangement_date=date(2024, 11, 18))
        ]
        
        for date_entry in recurring_dates:
            db.session.add(date_entry)
        
        db.session.commit()
        return {'employee': employee, 'requests': requests}

def test_create_single_request(client):
    """Test creating a single date request"""
    data = {
        "staff_id": 140002,
        "manager_id": 140894,
        "request_date": "2024-10-01",
        "arrangement_date": ["2024-10-15"],
        "timeslot": "AM",
        "reason": "Medical Appointment",
        "status": "Pending",
        "remark": "",
        "recurring_day": None,
        "start_date": None,
        "end_date": None,
        "is_recurring": False
    }

    response = client.post('/create_request', json=data)
    assert response.status_code == 201
    assert b"Request created" in response.data

def test_create_recurring_request(client):
    """Test creating a recurring request"""
    data = {
        "staff_id": 140002,
        "manager_id": 140894,
        "request_date": "2024-10-01",
        "arrangement_date": ["2024-11-04", "2024-11-11", "2024-11-18"],
        "timeslot": "FULL",
        "reason": "Weekly Team Meeting",
        "status": "Pending",
        "remark": "",
        "recurring_day": "Monday",
        "start_date": "2024-11-01",
        "end_date": "2024-12-31",
        "is_recurring": True
    }

    response = client.post('/create_request', json=data)
    assert response.status_code == 201
    
    # Verify request dates were created
    with app.app_context():
        request_dates = RequestDates.query.all()
        assert len(request_dates) == 3

def test_get_all_requests(client, sample_data):
    """Test retrieving all requests"""
    response = client.get('/get_all_requests')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 2
    
    # Verify recurring dates are included
    recurring_request = [r for r in data['data'] if r['is_recurring']][0]
    assert len(recurring_request['arrangement_dates']) == 3

def test_get_specific_request(client, sample_data):
    """Test retrieving a specific request"""
    response = client.get('/get_request/1')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data']['staff_id'] == 140002
    assert data['data']['timeslot'] == "AM"

def test_get_requests_by_staff(client, sample_data):
    """Test retrieving requests by staff ID"""
    response = client.get('/get_requests/staff/140002')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 2

def test_get_requests_by_manager(client, sample_data):
    """Test retrieving requests by manager ID"""
    response = client.get('/get_requests/manager/140894')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 2

def test_update_request(client, sample_data):
    """Test updating a request status"""
    data = {
        "status": "Approved"
    }
    response = client.put('/update_request/1', json=data)
    assert response.status_code == 200
    
    # Verify status was updated
    updated_response = client.get('/get_request/1')
    assert json.loads(updated_response.data)['data']['status'] == "Approved"

def test_error_handling(client):
    """Test error handling for various scenarios"""
    # Test invalid request ID
    response = client.get('/get_request/999')
    assert response.status_code == 404
    
    # Test invalid staff ID
    response = client.get('/get_requests/staff/999')
    assert response.status_code == 404
    
    # Test invalid manager ID
    response = client.get('/get_requests/manager/999')
    assert response.status_code == 404
    
    # Test invalid update
    response = client.put('/update_request/999', json={"status": "Approved"})
    assert response.status_code == 404