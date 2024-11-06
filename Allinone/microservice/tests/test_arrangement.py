import pytest, os
from arrangement.arrangement import app, db, Arrangement

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

@pytest.fixture
def mock_employee_request_response():
    """Mock response for employee requests matching SQL data"""
    return {
        'data': [
            {
                'request_id': 1,
                'arrangement_id': 1,
                'staff_id': 140002,
                'manager_id': 140894,
                'request_date': '2024-09-29',
                'arrangement_date': '2024-10-01',
                'timeslot': 'AM',
                'status': 'Approved',
                'reason': 'Medical Appointment',
                'remark': '',
                'recurring_day': None,
                'start_date': None,
                'end_date': None,
                'is_recurring': False
            },
            {
                'request_id': 17,
                'arrangement_id': 1,
                'staff_id': 140002,
                'manager_id': 140894,
                'request_date': '2024-10-28',
                'arrangement_date': '2024-11-01',
                'timeslot': 'AM',
                'status': 'Approved',
                'reason': '',
                'remark': '',
                'recurring_day': None,
                'start_date': None,
                'end_date': None,
                'is_recurring': False
            }
        ],
        'message': 'Requests found'
    }

def sample_arrangement():
    """Create sample arrangement matching SQL data"""
    with app.app_context():
        arrangement = Arrangement(
            request_id=1,
            arrangement_id=1,  # Added missing parameter
            staff_id=140002,
            arrangement_date="2024-10-01",
            timeslot="AM",
            reason="Medical Appointment"
        )
        db.session.add(arrangement)
        db.session.commit()
        return arrangement

def test_create_arrangement_success(client):
    """Test creating arrangement with data matching SQL schema"""
    data = {
        "request_id": 20,  # New unique ID
        "arrangement_id": 1,  # Added required field
        "staff_id": 140002,  # Existing staff ID from Employee table
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",  # One of: "AM", "PM", "FULL"
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 20

def test_create_arrangement_missing_fields(client):
    """Test creating arrangement with missing required fields"""
    data = {
        "request_id": 21,
        "arrangement_id": 1,
        "arrangement_date": "2024-10-15",
        "timeslot": "PM",
        "reason": "Team meeting"
        # Missing staff_id which is NOT NULL in schema
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

def test_get_arrangement(client, sample_arrangement):
    """Test retrieving arrangement matching SQL data"""
    response = client.get('/get_arrangement/1/1')  # Added arrangement_id parameter
    assert response.status_code == 200
    data = response.json['data']
    assert data['request_id'] == 1
    assert data['arrangement_id'] == 1
    assert data['staff_id'] == 140002
    assert data['arrangement_date'] == "2024-10-01"
    assert data['timeslot'] == "AM"
    assert data['reason'] == "Medical Appointment"

def test_get_all_arrangements(client):
    """Test fetching all arrangements with SQL sample data"""
    with app.app_context():
        arrangements = [
            Arrangement(
                request_id=1,
                arrangement_id=1,  # Added missing parameter
                staff_id=140002,
                arrangement_date="2024-10-01",
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=2,
                arrangement_id=1,  # Added missing parameter
                staff_id=140003,
                arrangement_date="2024-10-01",
                timeslot="PM",
                reason="Lazy"
            )
        ]
        for arr in arrangements:
            db.session.add(arr)
        db.session.commit()

    response = client.get('/get_all_arrangements')
    assert response.status_code == 200
    data = response.json['data']
    assert len(data) == 2
    # Verify data matches SQL samples
    assert data[0]['staff_id'] == 140002
    assert data[1]['staff_id'] == 140003

def test_get_arrangements_by_staff_id(client):
    """Test retrieving arrangements by staff ID using SQL data"""
    with app.app_context():
        arrangements = [
            Arrangement(
                request_id=1,
                arrangement_id=1,  # Added missing parameter
                staff_id=140002,
                arrangement_date="2024-10-01",
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=17,
                arrangement_id=1,  # Added missing parameter
                staff_id=140002,
                arrangement_date="2024-11-01",
                timeslot="AM",
                reason=""
            )
        ]
        for arr in arrangements:
            db.session.add(arr)
        db.session.commit()

    response = client.get('/get_arrangement/staff/140002')
    assert response.status_code == 200
    data = response.json['data']
    assert len(data) == 2
    assert all(arr['staff_id'] == 140002 for arr in data)

def test_delete_arrangements(client):
    """Test deleting arrangements"""
    
    response = client.delete('/withdraw_arrangement/17/1')  # Updated to include arrangement_id
    assert response.status_code == 200
    assert response.json['message'] == 'Arrangements deleted successfully'
    
    # Verify arrangement was deleted
    with app.app_context():
        arrangement = Arrangement.query.get((17, 1))  # Updated to check composite primary key
        assert arrangement is None

def test_delete_arrangements_not_found(client):
    """Test deleting non-existent arrangements"""
    
    response = client.delete('/withdraw_arrangement/999/999')
    assert response.status_code == 200
    assert response.json['message'] == 'No matching arrangements found to delete'

def test_create_arrangement_duplicate_request_id(client, sample_arrangement):
    """Test creating arrangement with duplicate request_id and arrangement_id"""
    data = {
        "request_id": 1,  # Already exists
        "arrangement_id": 1,  # Already exists
        "staff_id": 140002,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 500