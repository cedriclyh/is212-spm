import pytest
from employee import app, db, Employee
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
def sample_employees():
    with app.app_context():
        employees = [
            Employee(
                staff_id=140894,
                staff_fname="Rahim",
                staff_lname="Khalid",
                dept="Sales",
                position="Sales Manager",
                country="Singapore",
                email="Rahim.Khalid@allinone.com.sg",
                reporting_manager="140001",
                role=3
            ),
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
        
        for emp in employees:
            db.session.add(emp)
        db.session.commit()
        return employees

def test_get_all_users(client, sample_employees):
    """Test retrieving all employees"""
    response = client.get('/users')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 3
    assert data['message'] == "Employees found"

def test_get_all_users_empty(client):
    """Test retrieving employees when database is empty"""
    response = client.get('/users')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "Employees not found"

def test_get_specific_user(client, sample_employees):
    """Test retrieving a specific employee"""
    response = client.get('/user/140894')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['data']['staff_id'] == 140894
    assert data['data']['staff_fname'] == "Rahim"
    assert data['data']['staff_lname'] == "Khalid"
    assert data['data']['dept'] == "Sales"
    assert data['data']['email'] == "Rahim.Khalid@allinone.com.sg"

def test_get_specific_user_not_found(client, sample_employees):
    """Test retrieving a non-existent employee"""
    response = client.get('/user/999999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "Employee not found"

def test_get_manager_email(client, sample_employees):
    """Test retrieving manager's email"""
    response = client.get('/user/manager_email/140894')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['manager_email'] == "Rahim.Khalid@allinone.com.sg"
    assert data['message'] == "Manager email found"

def test_get_manager_email_not_found(client, sample_employees):
    """Test retrieving email for non-existent manager"""
    response = client.get('/user/manager_email/999999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "Manager not found"

def test_get_team_by_manager(client, sample_employees):
    """Test retrieving all team members under a manager"""
    response = client.get('/users/team/140894')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['data']) == 2  # Two employees report to manager 140894
    assert data['team_count'] == 2
    assert data['message'] == "Team members found"
    
    # Verify team members
    team_ids = [emp['staff_id'] for emp in data['data']]
    assert 140002 in team_ids
    assert 140003 in team_ids

def test_get_team_by_manager_no_team(client, sample_employees):
    """Test retrieving team members for a manager with no direct reports"""
    response = client.get('/users/team/140002')  # Employee with no direct reports
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "No team members found for this manager"

def test_get_team_by_manager_not_found(client, sample_employees):
    """Test retrieving team members for non-existent manager"""
    response = client.get('/users/team/999999')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "No team members found for this manager"

def test_employee_json_method(sample_employees):
    """Test the Employee model's json method"""
    with app.app_context():
        # Test manager role
        manager = Employee.query.filter_by(staff_id=140894).first()
        manager_json = manager.json()
        assert manager_json['role'] == 'Manager'
        assert manager_json['staff_id'] == 140894
        assert manager_json['staff_fname'] == 'Rahim'
        
        # Test staff role
        staff = Employee.query.filter_by(staff_id=140002).first()
        staff_json = staff.json()
        assert staff_json['role'] == 'Staff'
        assert staff_json['staff_id'] == 140002
        assert staff_json['staff_fname'] == 'Susan'

def test_employee_to_dict_method(sample_employees):
    """Test the Employee model's to_dict method"""
    with app.app_context():
        employee = Employee.query.filter_by(staff_id=140894).first()
        emp_dict = employee.to_dict()
        assert emp_dict['staff_id'] == 140894
        assert emp_dict['staff_fname'] == 'Rahim'
        assert emp_dict['staff_lname'] == 'Khalid'
        assert emp_dict['dept'] == 'Sales'
        assert emp_dict['position'] == 'Sales Manager'
        assert emp_dict['country'] == 'Singapore'
        assert emp_dict['email'] == 'Rahim.Khalid@allinone.com.sg'
        assert emp_dict['reporting_manager'] == '140001'
        assert emp_dict['role'] == 3

def test_database_error_handling(client, mocker):
    """Test database error handling"""
    mocker.patch('employee.db.session.query', side_effect=Exception("Database error"))
    
    # Test error handling in get all users
    response = client.get('/users')
    assert response.status_code == 404
    
    # Test error handling in get specific user
    response = client.get('/user/140894')
    assert response.status_code == 404
    
    # Test error handling in get manager email
    response = client.get('/user/manager_email/140894')
    assert response.status_code == 500
    
    # Test error handling in get team members
    response = client.get('/users/team/140894')
    assert response.status_code == 500