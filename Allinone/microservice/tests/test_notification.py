import pytest
from unittest.mock import patch, Mock
import json
import os

# Mock the Sendinblue/Brevo SDK before importing the app
mock_sib = Mock()
with patch.dict('sys.modules', {'sib_api_v3_sdk': mock_sib}):
    from notification import app, engine

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

@pytest.fixture
def mock_sib_api():
    """Mock Sendinblue/Brevo API configuration"""
    with patch('notification.sib_api_v3_sdk.Configuration') as mock_config:
        with patch('notification.sib_api_v3_sdk.TransactionalEmailsApi') as mock_api:
            mock_instance = mock_api.return_value
            mock_instance.send_transac_email.return_value = {"message_id": "test123"}
            yield mock_instance

def test_request_sent_success(client, mock_sib_api):
    """Test successful notification to manager for new request"""
    data = {
        "manager_email": "wenhanchen22@gmail.com",
        "staff_id": 140002,
        "employee_name": "Susan Goh",
        "request_date": "2024-10-01",
        "timeslot": "AM",
        "reason": "Medical Appointment"
    }
    
    response = client.post('/request_sent', json=data)
    assert response.status_code == 200
    assert b"Manager email sent successfully" in response.data
    
    # Verify email content
    called_args = mock_sib_api.send_transac_email.call_args[0][0]
    assert called_args.to[0]['email'] == "wenhanchen22@gmail.com"
    assert "Susan Goh" in called_args.html_content
    assert "Medical Appointment" in called_args.html_content

def test_request_sent_missing_email(client, mock_api_instance):
    """Test request notification with missing manager email"""
    data = {
        "staff_id": 140002,
        "employee_name": "Susan Goh",
        "request_date": "2024-10-01",
        "timeslot": "AM",
        "reason": "Medical Appointment"
    }
    
    response = client.post('/request_sent', json=data)
    assert response.status_code == 400
    assert b"Manager email is missing" in response.data

def test_request_sent_api_error(client, mock_api_instance):
    """Test handling of Sendinblue API error"""
    data = {
        "manager_email": "wenhanchen22@gmail.com",
        "staff_id": 140002,
        "employee_name": "Susan Goh",
        "request_date": "2024-10-01",
        "timeslot": "AM",
        "reason": "Medical Appointment"
    }

    mock_api_instance.send_transac_email.side_effect = sib_api_v3_sdk.rest.ApiException(status=500, reason="API Error")
    
    response = client.post('/request_sent', json=data)
    assert response.status_code == 500
    assert b"Failed to send email" in response.data

def test_notify_status_update_success(client, mock_api_instance):
    """Test successful status update notification"""
    # Data matching SQL schema
    data = {
        "staff_email": "wenhan.chen.2022@scis.smu.edu.sg",
        "status": "Approved",
        "request_id": 1
    }

    mock_api_instance.send_transac_email.return_value = {"message_id": "test123"}
    
    with patch('notification.engine.connect') as mock_connect:
        mock_connection = Mock()
        mock_connect.return_value.__enter__.return_value = mock_connection
        
        response = client.post('/notify_status_update', json=data)
        assert response.status_code == 200
        assert b"Status update email sent successfully" in response.data
        
        # Verify email content
        called_args = mock_api_instance.send_transac_email.call_args[0][0]
        assert called_args.to[0]['email'] == "wenhan.chen.2022@scis.smu.edu.sg"
        assert "Approved" in called_args.html_content
        
        # Verify database logging
        mock_connection.execute.assert_called_once()

def test_notify_status_update_missing_data(client, mock_api_instance):
    """Test status update notification with missing data"""
    data = {
        "request_id": 1
    }
    
    response = client.post('/notify_status_update', json=data)
    assert response.status_code == 400
    assert b"Staff email or status is missing" in response.data

def test_notify_status_update_api_error(client, mock_api_instance):
    """Test handling of Sendinblue API error in status update"""
    data = {
        "staff_email": "wenhan.chen.2022@scis.smu.edu.sg",
        "status": "Approved",
        "request_id": 1
    }

    mock_api_instance.send_transac_email.side_effect = sib_api_v3_sdk.rest.ApiException(status=500, reason="API Error")
    
    response = client.post('/notify_status_update', json=data)
    assert response.status_code == 500
    assert b"Failed to send email" in response.data

def test_notify_status_update_db_error(client, mock_api_instance):
    """Test handling of database error in status update"""
    data = {
        "staff_email": "wenhan.chen.2022@scis.smu.edu.sg",
        "status": "Approved",
        "request_id": 1
    }

    mock_api_instance.send_transac_email.return_value = {"message_id": "test123"}
    
    with patch('notification.engine.connect') as mock_connect:
        mock_connect.side_effect = Exception("Database error")
        
        response = client.post('/notify_status_update', json=data)
        assert response.status_code == 200  # Still returns 200 as email was sent
        assert b"Status update email sent successfully" in response.data

def test_email_content_formatting(client, mock_api_instance):
    """Test proper formatting of email content"""
    # Test request notification
    request_data = {
        "manager_email": "wenhanchen22@gmail.com",
        "staff_id": 140002,
        "employee_name": "Susan Goh",
        "request_date": "2024-10-01",
        "timeslot": "AM",
        "reason": "Medical Appointment"
    }
    
    mock_api_instance.send_transac_email.return_value = {"message_id": "test123"}
    
    response = client.post('/request_sent', json=request_data)
    assert response.status_code == 200
    
    # Verify request email formatting
    request_email = mock_api_instance.send_transac_email.call_args[0][0]
    assert "<h3>New WFH Request Submitted</h3>" in request_email.html_content
    assert "Susan Goh" in request_email.html_content
    assert "Medical Appointment" in request_email.html_content

    # Test status update notification
    status_data = {
        "staff_email": "wenhan.chen.2022@scis.smu.edu.sg",
        "status": "Approved",
        "request_id": 1
    }
    
    response = client.post('/notify_status_update', json=status_data)
    assert response.status_code == 200
    
    # Verify status email formatting
    status_email = mock_api_instance.send_transac_email.call_args[0][0]
    assert "<h3>Your WFH Request Has Been Approved</h3>" in status_email.html_content
    assert "request ID 1" in status_email.html_content