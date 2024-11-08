import pytest
from ..arrangement.arrangement import app, db, Arrangement

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

def sample_arrangement():
    """Create sample arrangement matching SQL data"""
    with app.app_context():
        arrangement = Arrangement(
            request_id=1,
            arrangement_id=1,
            staff_id=140002,
            arrangement_date="2024-10-01",
            timeslot="AM",
            reason="Medical Appointment"
        )
        db.session.add(arrangement)
        db.session.commit()
        return arrangement

def test_create_arrangement_success(client):
    data = {
        "request_id": 20,
        "staff_id": 140002,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 201
    assert response.json['message'] == 'Arrangement created successfully'
    assert response.json['data']['request_id'] == 20

def test_create_arrangement_missing_fields(client):
    data = {
        "request_id": 21,
        "arrangement_date": "2024-10-15",
        "timeslot": "PM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 400
    assert response.json['message'] == 'Missing required fields'

def test_get_arrangement(client):
    sample_arrangement()
    response = client.get('/get_arrangement/1/1')
    assert response.status_code == 200
    data = response.json['data']
    assert data['request_id'] == 1
    assert data['arrangement_id'] == 1
    assert data['staff_id'] == 140002
    assert data['arrangement_date'] == "2024-10-01"
    assert data['timeslot'] == "AM"
    assert data['reason'] == "Medical Appointment"

def test_get_arrangements_by_staff_id(client):
    with app.app_context():
        arrangements = [
            Arrangement(
                request_id=1,
                arrangement_id=1,
                staff_id=140002,
                arrangement_date="2024-10-01",
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=17,
                arrangement_id=1,
                staff_id=140002,
                arrangement_date="2024-11-01",
                timeslot="AM",
                reason=""
            )
        ]
        db.session.add_all(arrangements)
        db.session.commit()

    response = client.get('/get_arrangement/staff/140002')
    assert response.status_code == 200
    data = response.json['data']
    assert len(data) == 2
    assert all(arr['staff_id'] == 140002 for arr in data)

def test_delete_arrangement(client):
    sample_arrangement()
    response = client.delete('/withdraw_arrangement/1/1')
    assert response.status_code == 200
    assert response.json['message'] == 'Arrangement withdrawn successfully'
    
    with app.app_context():
        arrangement = Arrangement.query.get((1, 1))
        assert arrangement is None

def test_delete_arrangement_not_found(client):
    response = client.delete('/withdraw_arrangement/999/999')
    assert response.status_code == 404
    assert response.json['message'] == 'Arrangement not found'

def test_create_arrangement_duplicate_request_id(client):
    sample_arrangement()
    data = {
        "request_id": 1,
        "staff_id": 140002,
        "arrangement_date": "2024-10-15",
        "timeslot": "AM",
        "reason": "Team meeting"
    }
    response = client.post('/create_arrangement', json=data)
    assert response.status_code == 409
    assert response.json['message'] == 'Arrangement already exists for this date and timeslot'
