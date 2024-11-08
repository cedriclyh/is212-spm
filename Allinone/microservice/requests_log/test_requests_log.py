import unittest
from flask import json
from datetime import date
import pytest
from ..requests_log.requests_log import app, db, Employee, Request, RequestDates

class RequestApiTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test"""
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['TESTING'] = True
        self.app = app
        self.client = self.app.test_client()
        
        # Create application context
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Create all database tables
        db.create_all()
        
        # Add test employee
        self.employee = Employee(
            staff_id=1,
            staff_fname="John",
            staff_lname="Doe",
            department="IT",
            position="Developer",
            country="USA",
            email="johndoe@example.com",
            reporting_manager="Manager Name",
            role=1
        )
        db.session.add(self.employee)
        db.session.commit()

    def tearDown(self):
        """Clean up test environment after each test"""
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def create_test_request(self):
        """Helper method to create a test request"""
        data = {
            "staff_id": 1,
            "manager_id": 2,
            "request_date": str(date.today()),
            "timeslot": "1",
            "reason": "Need to work from home",
            "remark": "",
            "is_recurring": False,
            "arrangement_date": str(date.today())
        }
        return self.client.post('/create_request', 
                              data=json.dumps(data), 
                              content_type='application/json')

    def test_create_request(self):
        """Test creating a new request"""
        response = self.create_test_request()
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request created')
        self.assertEqual(response_data['data']['staff_id'], 1)
        self.assertEqual(response_data['data']['timeslot'], "1")
        self.assertEqual(response_data['data']['status'], "Pending")

    def test_create_recurring_request(self):
        """Test creating a recurring request"""
        data = {
            "staff_id": 1,
            "manager_id": 2,
            "request_date": str(date.today()),
            "timeslot": "1",
            "reason": "Recurring WFH",
            "remark": "",
            "is_recurring": True,
            "recurring_day": "Monday",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "arrangement_dates": [str(date.today())]
        }
        response = self.client.post('/create_request', 
                                  data=json.dumps(data), 
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.data)
        self.assertTrue(response_data['data']['is_recurring'])
        self.assertEqual(response_data['data']['recurring_day'], "Monday")

    def test_get_all_requests(self):
        """Test retrieving all requests"""
        # Create a test request first
        self.create_test_request()
        
        response = self.client.get('/get_all_requests')
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'All requests')
        self.assertTrue(len(response_data['data']) > 0)
        self.assertEqual(response_data['code'], 200)

    def test_get_specific_request(self):
        """Test retrieving a specific request"""
        # Create a test request first
        self.create_test_request()
        
        response = self.client.get('/get_request/1')
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request found')
        self.assertEqual(response_data['data']['staff_id'], 1)
        self.assertEqual(response_data['data']['status'], "Pending")

    def test_get_specific_request_not_found(self):
        """Test retrieving a non-existent request"""
        response = self.client.get('/get_request/999')
        self.assertEqual(response.status_code, 404)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request not found')

    def test_update_request_status(self):
        """Test updating the status of a request"""
        # Create a test request first
        self.create_test_request()
        
        data = {"status": "Approved"}
        response = self.client.patch('/update_request/1', 
                                   data=json.dumps(data), 
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request updated')
        self.assertEqual(response_data['data']['status'], 'Approved')

    def test_update_request_status_not_found(self):
        """Test updating the status of a non-existent request"""
        data = {"status": "Approved"}
        response = self.client.patch('/update_request/999', 
                                   data=json.dumps(data), 
                                   content_type='application/json')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request not found')

    def test_edit_request(self):
        """Test editing an existing request"""
        # Create a test request first
        self.create_test_request()
        
        data = {
            "timeslot": "2",
            "reason": "Updated reason",
            "is_recurring": True,
            "recurring_day": "Monday",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "arrangement_dates": [str(date.today())]
        }
        response = self.client.put('/edit_request/1', 
                                 data=json.dumps(data), 
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request updated successfully')
        self.assertEqual(response_data['data']['timeslot'], "2")
        self.assertEqual(response_data['data']['reason'], "Updated reason")
        self.assertTrue(response_data['data']['is_recurring'])

    def test_edit_request_not_found(self):
        """Test editing a non-existent request"""
        data = {
            "timeslot": "2",
            "reason": "Updated reason",
            "is_recurring": True,
            "recurring_day": "Monday",
            "start_date": str(date.today()),
            "end_date": str(date.today())
        }
        response = self.client.put('/edit_request/999', 
                                 data=json.dumps(data), 
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 404)
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Request not found')

    def test_get_requests_by_staff_id(self):
        """Test retrieving requests by staff ID"""
        # Create a test request first
        self.create_test_request()
        
        response = self.client.get('/get_requests/staff/1')
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Requests from staff 1 found')
        self.assertTrue(len(response_data['data']) > 0)

    def test_get_requests_by_manager_id(self):
        """Test retrieving requests by manager ID"""
        # Create a test request first
        self.create_test_request()
        
        response = self.client.get('/get_requests/manager/2')
        self.assertEqual(response.status_code, 200)
        
        response_data = json.loads(response.data)
        self.assertEqual(response_data['message'], 'Requests for manager 2 found')
        self.assertTrue(len(response_data['data']) > 0)

if __name__ == '__main__':
    unittest.main()