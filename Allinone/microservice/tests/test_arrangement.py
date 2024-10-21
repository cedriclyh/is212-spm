import pytest
from arrangement import app, db, Arrangement

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # In-memory SQLite DB
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as client:
        with app.app_context():
            db.create_all()  # Create tables in the in-memory database
        yield client


# testing /create_arrangement endpoint
def test_create_arrangement_success(client):
    # Sample data to send in POST request
    data = {
        "request_id": 1,
        "staff_id": 101,
        "arrangement_date": "2024-10-15",
        "timeslot": "10:00 AM - 12:00 PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 1

def test_create_arrangement_missing_fields(client):
    # Data missing required 'staff_id'
    data = {
        "request_id": 2,
        "arrangement_date": "2024-10-15",
        "timeslot": "10:00 AM - 12:00 PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

# testing /get_all_arrangements endpoint
def test_create_arrangement_success(client):
    # Sample data to send in POST request
    data = {
        "request_id": 1,
        "staff_id": 101,
        "arrangement_date": "2024-10-15",
        "timeslot": "10:00 AM - 12:00 PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 1

def test_create_arrangement_missing_fields(client):
    # Data missing required 'staff_id'
    data = {
        "request_id": 2,
        "arrangement_date": "2024-10-15",
        "timeslot": "10:00 AM - 12:00 PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

#testing /get_all_arrangements/<int:arrangement_id> endpoint
def test_get_arrangement(client):
    # Create a mock arrangement for testing
    arrangement = Arrangement(request_id=1, staff_id=101, arrangement_date="2024-10-15", timeslot="10:00 AM - 12:00 PM", reason="Team meeting")
    db.session.add(arrangement)
    db.session.commit()

    # Retrieve the arrangement by ID
    response = client.get('/get_arrangement/1')
    assert response.status_code == 200
    assert response.json['data']['request_id'] == 1

def test_get_arrangement_not_found(client):
    # Try to get an arrangement that doesn't exist
    response = client.get('/get_arrangement/999')
    assert response.status_code == 404
    assert response.json['message'] == 'Arrangement not found'