import pytest
from blockout import app, db, BlockoutDates
from datetime import datetime, date
import json

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
def sample_blockouts():
    """Create sample blockout dates matching SQL data"""
    with app.app_context():
        blockouts = [
            BlockoutDates(
                start_date=date(2024, 12, 25),
                end_date=date(2024, 12, 25),
                timeslot="FULL",
                title="Christmas",
                blockout_description="Public holiday"
            ),
            BlockoutDates(
                start_date=date(2024, 11, 11),
                end_date=date(2024, 11, 11),
                timeslot="FULL",
                title="Veterans Day",
                blockout_description="Public holiday"
            )
        ]
        for blockout in blockouts:
            db.session.add(blockout)
        db.session.commit()
        return blockouts

def test_create_blockout_success(client):
    """Test creating a new blockout date"""
    data = {
        "start_date": "2024-10-15",
        "end_date": "2024-10-15",
        "timeslot": {"anchorKey": "FULL"},
        "title": "Company Event",
        "blockout_description": "Annual company meeting"
    }
    
    response = client.post('/blockout/create_blockout', json=data)
    assert response.status_code == 200
    assert b"Blockout created" in response.data
    
    # Verify blockout was created
    with app.app_context():
        blockout = BlockoutDates.query.filter_by(title="Company Event").first()
        assert blockout is not None
        assert blockout.blockout_description == "Annual company meeting"
        assert blockout.timeslot == "FULL"

def test_create_blockout_existing_date(client, sample_blockouts):
    """Test creating a blockout on an existing date"""
    data = {
        "start_date": "2024-12-25",
        "end_date": "2024-12-25",
        "timeslot": {"anchorKey": "FULL"},
        "title": "New Event",
        "blockout_description": "Should not be created"
    }
    
    response = client.post('/blockout/create_blockout', json=data)
    assert response.status_code == 409
    assert b"Blockout already exists" in response.data

def test_get_all_blockouts(client, sample_blockouts):
    """Test retrieving all blockout dates"""
    response = client.get('/blockout/get_blockouts')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 2
    
    # Verify data matches SQL sample data
    blockouts = data['data']
    christmas = next(b for b in blockouts if b['title'] == "Christmas")
    veterans = next(b for b in blockouts if b['title'] == "Veterans Day")
    
    assert christmas['start_date'] == "2024-12-25"
    assert christmas['blockout_description'] == "Public holiday"
    assert veterans['start_date'] == "2024-11-11"
    assert veterans['timeslot'] == "FULL"

def test_get_blockout_by_date(client, sample_blockouts):
    """Test retrieving blockout by date range"""
    response = client.get('/blockout/get_blockout/date/2024-12-242024-12-26')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data']['title'] == "Christmas"

def test_get_blockout_by_date_no_blockout(client, sample_blockouts):
    """Test retrieving blockout for date range with no blockouts"""
    response = client.get('/blockout/get_blockout/date/2024-10-012024-10-02')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data'] is False

def test_fetch_blockout_by_date(client, sample_blockouts):
    """Test internal fetch_blockout_by_date function"""
    with app.app_context():
        # Test existing blockout
        blockout = BlockoutDates.query.filter_by(title="Christmas").first()
        result = blockout.fetch_blockout_by_date(date(2024, 12, 24), date(2024, 12, 26))
        assert result is not None
        assert result.title == "Christmas"
        
        # Test non-existing blockout
        result = blockout.fetch_blockout_by_date(date(2024, 10, 1), date(2024, 10, 2))
        assert result is None

def test_blockout_json_method(sample_blockouts):
    """Test BlockoutDates model json method"""
    with app.app_context():
        blockout = BlockoutDates.query.filter_by(title="Christmas").first()
        json_data = blockout.json()
        assert json_data['title'] == "Christmas"
        assert json_data['start_date'] == "2024-12-25"
        assert json_data['end_date'] == "2024-12-25"
        assert json_data['timeslot'] == "FULL"
        assert json_data['blockout_description'] == "Public holiday"

def test_create_blockout_invalid_data(client):
    """Test creating blockout with invalid data"""
    # Missing required fields
    data = {
        "start_date": "2024-10-15"
    }
    response = client.post('/blockout/create_blockout', json=data)
    assert response.status_code == 500

def test_create_blockout_invalid_date_format(client):
    """Test creating blockout with invalid date format"""
    data = {
        "start_date": "invalid-date",
        "end_date": "invalid-date",
        "timeslot": {"anchorKey": "FULL"},
        "title": "Test Event",
        "blockout_description": "Test"
    }
    response = client.post('/blockout/create_blockout', json=data)
    assert response.status_code == 500