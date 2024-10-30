import pytest
from manage_blockout import app, db, BlockoutDates, Arrangement, Employee
from datetime import date
import json
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['TESTING'] = True # make sure testing set to true to allow usage of sqlite

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.session.remove()
            db.drop_all()

@pytest.fixture
def sample_data():
    """Create sample data matching SQL schema"""
    with app.app_context():
        # Create employees from SQL data
        employees = [
            Employee(
                staff_id=140002,
                staff_fname="Susan",
                staff_lname="Goh",
                dept="Sales",
                position="Account Manager",
                country="Singapore",
                email="Susan.Goh@allinone.com.sg",
                reporting_manager="140894",
                role=2
            ),
            Employee(
                staff_id=140003,
                staff_fname="Janice",
                staff_lname="Chan",
                dept="Sales",
                position="Account Manager",
                country="Singapore",
                email="Janice.Chan@allinone.com.sg",
                reporting_manager="140894",
                role=2
            )
        ]
        
        # Create arrangements from SQL data
        arrangements = [
            Arrangement(
                request_id=1,
                staff_id=140002,
                arrangement_date=date(2024, 10, 1),
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=2,
                staff_id=140003,
                arrangement_date=date(2024, 10, 1),
                timeslot="PM",
                reason="Lazy"
            )
        ]

        for emp in employees:
            db.session.add(emp)
        for arr in arrangements:
            db.session.add(arr)
        db.session.commit()
        
        return {"employees": employees, "arrangements": arrangements}

def test_manage_blockout_success(client, sample_data):
    """Test successful blockout creation"""
    with patch('requests.post') as mock_post:
        # Mock the employee response
        mock_post.return_value.status_code = 200
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "FULL"},
            "title": "Department Meeting",
            "blockout_description": "Mandatory meeting"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 200
        assert b"Blockout created successfully" in response.data
        
        # Verify arrangements were deleted
        with app.app_context():
            arrangements = Arrangement.query.all()
            assert len(arrangements) == 0

def test_manage_blockout_partial_timeslot(client, sample_data):
    """Test blockout creation for specific timeslot"""
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "AM"},
            "title": "Morning Meeting",
            "blockout_description": "Team sync"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 200
        
        # Verify only AM arrangement was deleted
        with app.app_context():
            arrangements = Arrangement.query.all()
            assert len(arrangements) == 1
            assert arrangements[0].timeslot == "PM"

def test_manage_blockout_employee_not_found(client, sample_data):
    """Test blockout creation when employee fetch fails"""
    with patch('requests.get') as mock_get:
        mock_get.return_value.status_code = 404
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "FULL"},
            "title": "Test Meeting",
            "blockout_description": "Test"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 404
        assert b"Failed to fetch employee details" in response.data

def test_manage_blockout_creation_error(client, sample_data):
    """Test error handling when blockout creation fails"""
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 500
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "FULL"},
            "title": "Test Meeting",
            "blockout_description": "Test"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 500

def test_manage_blockout_no_arrangements(client, sample_data):
    """Test blockout creation when no arrangements exist"""
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        
        # Clear existing arrangements
        with app.app_context():
            db.session.query(Arrangement).delete()
            db.session.commit()
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "FULL"},
            "title": "Test Meeting",
            "blockout_description": "Test"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 200

def test_manage_blockout_invalid_data(client):
    """Test blockout creation with invalid data"""
    data = {
        "start_date": "invalid-date",
        "timeslot": {"anchorKey": "FULL"}
    }
    
    response = client.post('/manage_blockout', json=data)
    assert response.status_code == 500