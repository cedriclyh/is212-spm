import pytest
from manage_blockout.manage_blockout import app, db, BlockoutDates, Arrangement, Employee
from datetime import date
import json
from unittest.mock import patch

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
def sample_data():
    """Create sample data matching SQL schema"""
    with app.app_context():
        # Create employees
        employees = [
            Employee(
                staff_id=140002,
                staff_fname="Susan",
                staff_lname="Goh",
                dept="Sales",
                position="Account Manager",
                country="Singapore",
                email="Susan.Goh@allinone.com.sg",
                reporting_manager=140894,
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
                reporting_manager=140894,
                role=2
            )
        ]
        
        # Create request logs
        request_logs = [
            RequestLog(
                request_id=1,
                staff_id=140002,
                manager_id=140894,
                request_date=date(2024, 9, 29),
                arrangement_date=date(2024, 10, 1),
                timeslot="AM",
                status="Approved",
                reason="Medical Appointment",
                remark="",
                is_recurring=False
            ),
            RequestLog(
                request_id=2,
                staff_id=140003,
                manager_id=140894,
                request_date=date(2024, 9, 29),
                arrangement_date=date(2024, 10, 1),
                timeslot="PM",
                status="Approved",
                reason="Lazy",
                remark="",
                is_recurring=False
            )
        ]
        
        # Create arrangements
        arrangements = [
            Arrangement(
                request_id=1,
                arrangement_id=1,
                staff_id=140002,
                arrangement_date=date(2024, 10, 1),
                timeslot="AM",
                reason="Medical Appointment"
            ),
            Arrangement(
                request_id=2,
                arrangement_id=1,
                staff_id=140003,
                arrangement_date=date(2024, 10, 1),
                timeslot="PM",
                reason="Lazy"
            )
        ]

        # Create request dates
        request_dates = [
            RequestDates(
                id=1,
                request_id=1,
                arrangement_date=date(2024, 10, 1)
            ),
            RequestDates(
                id=2,
                request_id=2,
                arrangement_date=date(2024, 10, 1)
            )
        ]

        for emp in employees:
            db.session.add(emp)
        for log in request_logs:
            db.session.add(log)
        for arr in arrangements:
            db.session.add(arr)
        for req_date in request_dates:
            db.session.add(req_date)
        db.session.commit()
        
        return {
            "employees": employees,
            "request_logs": request_logs,
            "arrangements": arrangements,
            "request_dates": request_dates
        }

def test_manage_blockout_success(client, sample_data):
    """Test successful blockout creation"""
    with patch('requests.post') as mock_post:
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
        
        # Verify blockout was created
        with app.app_context():
            blockout = BlockoutDates.query.first()
            assert blockout.title == "Department Meeting"
            assert blockout.timeslot == "FULL"
            
            # Verify affected arrangements were deleted
            arrangements = Arrangement.query.all()
            assert len(arrangements) == 0

def test_manage_blockout_with_specific_timeslot(client, sample_data):
    """Test blockout creation for a specific timeslot (AM or PM)"""
    with patch('requests.post') as mock_post:
        mock_post.return_value.status_code = 200
        
        data = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-01",
            "timeslot": {"anchorKey": "AM"},
            "title": "Morning Training",
            "blockout_description": "Team training session"
        }
        
        response = client.post('/manage_blockout', json=data)
        assert response.status_code == 200
        assert b"Blockout created successfully" in response.data
        
        # Verify blockout was created correctly
        with app.app_context():
            blockout = BlockoutDates.query.first()
            assert blockout.title == "Morning Training"
            assert blockout.timeslot == "AM"
            
            # Verify only AM arrangements were affected
            arrangements = Arrangement.query.all()
            assert len(arrangements) == 1  # Only PM arrangement should remain
            assert arrangements[0].timeslot == "PM"  # Verify remaining arrangement is PM
            assert arrangements[0].staff_id == 140003  # Verify it's the correct arrangement

            # Verify request dates remained unchanged
            request_dates = RequestDates.query.all()
            assert len(request_dates) == 2  # Request dates should not be affected