import pika
import json
import requests
from datetime import datetime
from arrangement import Arrangement, delete_arrangements, app, db
from employee import Employee
from dotenv import load_dotenv
import os


load_dotenv()

# Connect to RabbitMQ
connection = pika.BlockingConnection(pika.ConnectionParameters(os.getenv('RABBITMQ_HOST')))
channel = connection.channel()

# Declare the queue
channel.queue_declare(queue='revoke_queue', durable=True)

def process_revoke_task(ch, method, properties, body):
    data = json.loads(body)
    staff_id = data['staff_id']
    revoke_dates = [datetime.strptime(date, '%Y-%m-%d').date() for date in data['revoke_dates']]
    staff_email = data['staff_email']
    manager_email = data['manager_email']

    with app.app_context():
        # 2. Delete arrangements
        arrangements_to_delete = Arrangement.query.filter(
            Arrangement.staff_id==staff_id,
            Arrangement.arrangement_date.in_(revoke_dates)
        ).all()
        
        request_ids = [arrangement.request_id for arrangement in arrangements_to_delete]

        print("All arrangements successfully deleted")
        # Delete arrangements in the database
        delete_response, delete_status_code = delete_arrangements(request_ids)
        if delete_status_code != 200:
            print(f"Failed to delete arrangements for staff_id {staff_id}")
            return delete_response
        
        # 3. Update statuses
        print("Updating request statuses...")
        for request_id in request_ids:
            print(f"Updating status for Request ID {request_id}")
            update_request_data = {
                "request_id": request_id,
                "status": "Withdrawn",
                "disable_notification": True
            }
            
            update_request_response = requests.put(f"{os.getenv('MANAGE_REQUEST_URL')}/manage_request", json=update_request_data)
            print(update_request_response.json())
            if update_request_response.status_code != 200:
                print(f"Failed to update request status for Request ID {request_id}")
                return update_request_response
            
        print("All request statuses successfully updated.")

        # Send notification email
        print("Preparing to send emails...")

        revoke_notification_data = { 
            "staff_email": staff_email,
            "manager_email": manager_email,
            "request_ids": request_ids
        }
        
        print("Sending emails...")
        notification_response = requests.post(f"{os.getenv('NOTIFICATION_URL')}/notify_revoke_arrangements", json=revoke_notification_data)
        print(notification_response.json())

        if notification_response.status_code != 200:
            print(f"Failed to send email.")
            return notification_response

    print(f"Completed processing revocation task for staff_id {staff_id}")
    ch.basic_ack(delivery_tag=method.delivery_tag)
    
    print()
    print('Worker is waiting for messages...')

def consume_message(ch, method, properties, body):
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Set up consumer
channel.basic_consume(queue='revoke_queue', on_message_callback=process_revoke_task)
# channel.basic_consume(queue='revoke_queue', on_message_callback=consume_message)

print('Worker is waiting for messages...')
channel.start_consuming()
