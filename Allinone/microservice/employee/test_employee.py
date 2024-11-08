import unittest
from flask import json
from ..employee.employee import app, db, Employee

class TestEmployee(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment before all tests"""
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
        cls.app = app
        cls.client = app.test_client()

    def setUp(self):
        """Set up test environment before each test"""
        # Create application context
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Create all database tables
        db.create_all()
        
        # Create test employee data
        self.test_employees = [
            Employee(
                staff_id=1,
                staff_fname='John',
                staff_lname='Doe',
                dept='IT',
                position='Developer',
                country='USA',
                email='john.doe@example.com',
                reporting_manager='2',
                role=2
            ),
            Employee(
                staff_id=2,
                staff_fname='Jane',
                staff_lname='Smith',
                dept='HR',
                position='Manager',
                country='USA',
                email='jane.smith@example.com',
                reporting_manager='3',
                role=3
            )
        ]
        
        # Add test employees to database
        for employee in self.test_employees:
            db.session.add(employee)
        db.session.commit()

    def tearDown(self):
        """Clean up test environment after each test"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_employee_to_dict(self):
        """Test the to_dict method of Employee model"""
        employee = self.test_employees[0]
        expected_dict = {
            'staff_id': 1,
            'staff_fname': 'John',
            'staff_lname': 'Doe',
            'dept': 'IT',
            'position': 'Developer',
            'country': 'USA',
            'email': 'john.doe@example.com',
            'reporting_manager': '2',
            'role': 2
        }
        self.assertEqual(employee.to_dict(), expected_dict)

    def test_employee_json(self):
        """Test the json method of Employee model"""
        employee = self.test_employees[0]
        expected_json = {
            'staff_id': 1,
            'staff_fname': 'John',
            'staff_lname': 'Doe',
            'staff_dept': 'IT',
            'position': 'Developer',
            'country': 'USA',
            'email': 'john.doe@example.com',
            'reporting_manager': '2',
            'role_num': 2,
            'role': 'Staff'
        }
        self.assertEqual(employee.json(), expected_json)

    def test_all_users_success(self):
        """Test successful retrieval of all users"""
        response = self.client.get('/users')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Employees found')
        self.assertEqual(len(data['data']), 2)
        self.assertEqual(data['code'], 200)

    def test_all_users_empty_db(self):
        """Test retrieval of users with empty database"""
        # Clear the database
        db.session.query(Employee).delete()
        db.session.commit()
        
        response = self.client.get('/users')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(data['message'], 'Employees not found')
        self.assertEqual(data['code'], 404)

    def test_specific_user_success(self):
        """Test successful retrieval of specific user"""
        response = self.client.get('/user/1')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Employee found')
        self.assertEqual(data['data']['staff_id'], 1)
        self.assertEqual(data['code'], 200)

    def test_specific_user_not_found(self):
        """Test retrieval of non-existent user"""
        response = self.client.get('/user/999')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(data['message'], 'Employee not found')
        self.assertEqual(data['code'], 404)

    def test_get_manager_email_success(self):
        """Test successful retrieval of manager email"""
        response = self.client.get('/user/manager_email/2')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Manager email found')
        self.assertEqual(data['manager_email'], 'jane.smith@example.com')
        self.assertEqual(data['code'], 200)

    def test_get_manager_email_not_found(self):
        """Test retrieval of non-existent manager email"""
        response = self.client.get('/user/manager_email/999')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(data['message'], 'Manager not found')
        self.assertEqual(data['code'], 404)

    def test_get_team_by_manager_success(self):
        """Test successful retrieval of team members"""
        # Add a team member reporting to manager ID 2
        team_member = Employee(
            staff_id=3,
            staff_fname='Bob',
            staff_lname='Wilson',
            dept='IT',
            position='Developer',
            country='USA',
            email='bob.wilson@example.com',
            reporting_manager='2',
            role=2
        )
        db.session.add(team_member)
        db.session.commit()
        
        response = self.client.get('/users/team/2')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['message'], 'Team members found')
        self.assertTrue(len(data['data']) > 0)
        self.assertEqual(data['code'], 200)

    def test_get_team_by_manager_not_found(self):
        """Test retrieval of team members for non-existent manager"""
        response = self.client.get('/users/team/999')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(data['message'], 'No team members found for this manager')
        self.assertEqual(data['code'], 404)

if __name__ == '__main__':
    unittest.main()