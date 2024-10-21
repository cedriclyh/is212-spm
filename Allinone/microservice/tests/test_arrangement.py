import pytest, os
from arrangement import app, db, Arrangement

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

# # Test retrieving an arrangement by request_id
# def test_get_arrangement(client):
#     with app.app_context():  # Use app context for database operations
#         arrangement = Arrangement(
#             request_id=1,
#             staff_id=140002,
#             arrangement_date="2024-10-01",
#             timeslot="AM",
#             reason="Medical Appointment"
#         )
#         db.session.add(arrangement)
#         db.session.commit()

#     response = client.get('/get_arrangement/1')  # Using request_id instead of arrangement_id
#     assert response.status_code == 200
#     assert response.json['data']['request_id'] == arrangement.request_id
#     assert response.json['data']['staff_id'] == arrangement.staff_id
#     assert response.json['data']['arrangement_date'] == str(arrangement.arrangement_date)
#     assert response.json['data']['timeslot'] == arrangement.timeslot
#     assert response.json['data']['reason'] == arrangement.reason

# # Test retrieving an arrangement that does not exist
# def test_get_arrangement_not_found(client):
#     response = client.get('/get_arrangement/999')  # Using request_id instead of arrangement_id
#     assert response.status_code == 404
#     assert response.json['message'] == 'Arrangement not found'
