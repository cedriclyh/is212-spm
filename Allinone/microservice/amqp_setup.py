import pika
import json
from dotenv import load_dotenv
import os

load_dotenv()

def get_amqp_connection():
    return pika.BlockingConnection(pika.ConnectionParameters(os.getenv('RABBITMQ_HOST')))

def publish_to_queue(data):
    connection = get_amqp_connection()
    channel = connection.channel()
    
    # Declare the queue
    channel.queue_declare(queue='revoke_queue', durable=True)
    
    # Publish the message to the queue
    channel.basic_publish(
        exchange='',
        routing_key='revoke_queue',
        body=json.dumps(data),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
        )
    )
    connection.close()
