import pytest, os
from arrangement import app, db, Arrangement
from blockout import BlockoutDates

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DB_URL', 'sqlite:///:memory:')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Create tables before running the tests
        yield client
        with app.app_context():
            db.drop_all()  # Clean up the tables after the tests

# Test creating an arrangement with correct data
def test_create_arrangement_success(client):
    data = {
        "request_id": 1,
        "staff_id": 101,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 1

# Test creating an arrangement with missing fields
def test_create_arrangement_missing_fields(client):
    data = {
        "request_id": 2,
        "arrangement_date": "2024-10-15",
        "timeslot": "PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

# Test retrieving an arrangement by request_id
def test_get_arrangement(client):
    with app.app_context():  # Use app context for database operations
        arrangement = Arrangement(
            request_id=1,
            staff_id=140002,
            arrangement_date="2024-10-01",
            timeslot="AM",
            reason="Medical Appointment"
        )
        db.session.add(arrangement)
        db.session.commit()

        arrangement_from_db = Arrangement.query.filter_by(request_id=1).first()


    response = client.get('/get_arrangement/1')  # Using request_id instead of arrangement_id
    assert response.status_code == 200
    assert response.json['data']['request_id'] == arrangement_from_db.request_id
    assert response.json['data']['staff_id'] == arrangement_from_db.staff_id
    assert response.json['data']['arrangement_date'] == str(arrangement_from_db.arrangement_date)
    assert response.json['data']['timeslot'] == arrangement_from_db.timeslot
    assert response.json['data']['reason'] == arrangement_from_db.reason

# Test retrieving an arrangement that does not exist
def test_get_arrangement_not_found(client):
    response = client.get('/get_arrangement/999')  # Using request_id instead of arrangement_id
    assert response.status_code == 404
    assert response.json['message'] == 'Arrangement not found'

# Test creating an arrangement with correct data
def test_create_arrangement_success(client):
    data = {
        "request_id": 1,
        "staff_id": 101,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 1

# Test creating an arrangement with missing fields
def test_create_arrangement_missing_fields(client):
    data = {
        "request_id": 2,
        "arrangement_date": "2024-10-15",
        "timeslot": "PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

# Test failed arrangement creation due to exception
def test_create_arrangement_failure(client, mocker):
    mocker.patch('arrangement.db.session.commit', side_effect=Exception("Database error"))
    data = {
        "request_id": 1,
        "staff_id": 101,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 500
    assert response.json['message'] == 'Failed to create arrangement'

# Test fetching all arrangements
def test_get_all_arrangements(client):
    with app.app_context():
        arrangement1 = Arrangement(
            request_id=1, staff_id=101, arrangement_date="2024-10-15", timeslot="AM", reason="Team meeting"
        )
        arrangement2 = Arrangement(
            request_id=2, staff_id=102, arrangement_date="2024-10-16", timeslot="PM", reason="Workshop"
        )
        db.session.add(arrangement1)
        db.session.add(arrangement2)
        db.session.commit()

    response = client.get('/get_all_arrangements')
    assert response.status_code == 200
    assert len(response.json['data']) == 2


# Test retrieving an arrangement that does not exist
def test_get_arrangement_not_found(client):
    response = client.get('/get_arrangement/999')
    assert response.status_code == 404
    assert response.json['message'] == 'Arrangement not found'

# Test retrieving arrangements by staff ID
def test_get_arrangements_by_staff_id(client):
    with app.app_context():
        arrangement = Arrangement(
            request_id=1, staff_id=101, arrangement_date="2024-10-15", timeslot="AM", reason="Team meeting"
        )
        db.session.add(arrangement)
        db.session.commit()

    response = client.get('/get_arrangement/staff/101')
    assert response.status_code == 200
    assert len(response.json['data']) == 1

# Test deleting arrangements
def test_delete_arrangements(client):
    with app.app_context():
        arrangement = Arrangement(
            request_id=1, staff_id=101, arrangement_date="2024-10-15", timeslot="AM", reason="Team meeting"
        )
        db.session.add(arrangement)
        db.session.commit()

    data = {
        "arrangement_ids": [1]
    }
    response = client.delete('/delete_arrangements', json=data)
    assert response.status_code == 200
    assert response.json['message'] == 'Arrangements deleted successfully'

# Test deleting arrangements that don't exist
def test_delete_arrangements_not_found(client):
    data = {
        "arrangement_ids": [999]
    }
    response = client.delete('/delete_arrangements', json=data)
    assert response.status_code == 200
    assert response.json['message'] == 'No matching arrangements found to delete'

# Test creating and fetching blockout dates
def test_create_blockout(client):
    data = {
        "start_date": "2024-10-01",
        "end_date": "2024-10-05",
        "timeslot": "AM",
        "title": "Maintenance",
        "blockout_description": "System maintenance"
    }
    response = client.post('/create_blockout', json=data)
    assert response.status_code == 200
    assert response.json['message'] == 'Blockout created for Maintenance from 2024-10-01 and 2024-10-05'

def test_get_blockouts(client):
    with app.app_context():
        blockout = BlockoutDates(
            start_date="2024-10-01", end_date="2024-10-05", timeslot="AM", title="Maintenance", blockout_description="System maintenance"
        )
        db.session.add(blockout)
        db.session.commit()

    response = client.get('/get_blockouts')
    assert response.status_code == 200
    assert len(response.json['data']) > 0
