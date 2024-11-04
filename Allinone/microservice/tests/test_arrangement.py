import pytest, os
from arrangement import app, db, Arrangement

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
def sample_arrangement():
    """Create sample arrangement matching SQL data"""
    with app.app_context():
        arrangement = Arrangement(
            request_id=1,
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
    response = client.get('/get_arrangement/1')
    assert response.status_code == 200
    data = response.json['data']
    assert data['request_id'] == 1
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
                staff_id=140002,
                arrangement_date="2024-10-01",
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=2,
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
                staff_id=140002,
                arrangement_date="2024-10-01",
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=17,
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

def test_delete_arrangements(client, sample_arrangement):
    """Test deleting arrangements"""
    data = {
        "arrangement_ids": [1]
    }
    response = client.delete('/delete_arrangements', json=data)
    assert response.status_code == 200
    assert response.json['message'] == 'Arrangements deleted successfully'
    
    # Verify arrangement was deleted
    with app.app_context():
        arrangement = Arrangement.query.get(1)
        assert arrangement is None

def test_delete_arrangements_not_found(client):
    """Test deleting non-existent arrangements"""
    data = {
        "arrangement_ids": [999]  # Non-existent ID
    }
    response = client.delete('/delete_arrangements', json=data)
    assert response.status_code == 200
    assert response.json['message'] == 'No matching arrangements found to delete'

def test_create_arrangement_duplicate_request_id(client, sample_arrangement):
    """Test creating arrangement with duplicate request_id"""
    data = {
        "request_id": 1,  # Already exists
        "staff_id": 140002,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 500