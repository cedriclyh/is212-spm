# Required installations:
# pip install git+https://github.com/sendinblue/APIv3-python-library.git
# pip install python-dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from dotenv import load_dotenv
load_dotenv() 

# Setup database connection 
DATABASE_URI = "mysql+mysqlconnector://root@localhost:3306/spm_db" # For Windows

# DATABASE_URI = "mysql+mysqlconnector://root:root@localhost:3306/spm_db" # For Mac
engine = create_engine(DATABASE_URI)

# Setup Sendinblue API configuration
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = os.getenv("BREVOKEY")

# Create API instance for transactional emails
api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
app = Flask(__name__)
CORS(app)

from flasgger import Swagger

app.config["SWAGGER"] = {
    "title": "notification service microservice API",
    "version": 1.0,
    "openapi": "3.0.2",
    "description": "Allows sending of emails to vendors and owners, and updating the database with email status.",
}
swagger = Swagger(app)

# Route to send email notification to the reporting manager after a WFH request is created
@app.route("/request_sent", methods=["POST"])
def request_sent():
    try:
        # Extract request data
        data = request.json
        manager_email = data.get("manager_email")
        staff_id = data.get("staff_id")
        employee_name = data.get("employee_name")
        request_date = data.get("request_date")
        timeslot = data.get("timeslot")
        reason = data.get("reason")

        if not manager_email:
            return jsonify({"error": "Manager email is missing"}), 400
        
        # Email content to notify the manager
        sender = {"name": "Allinone", "email": "no-reply@allinone.com"}
        to = [{"email": manager_email}]
        subject = "New Work From Home Request Notification"
        html_content = f"""
        <html>
        <body>
            <h3>New WFH Request Submitted</h3>
            <p>Employee {employee_name} with ID {staff_id} has submitted a {timeslot} WFH request for {request_date}.</p>
            <p>Reason: {reason}</p>
        </body>
        </html>
        """

        # Send the email
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, html_content=html_content, sender=sender, subject=subject)
        api_response = api_instance.send_transac_email(send_smtp_email)
        print("Manager notification email sent successfully. API response:", api_response)

        # Log the notification in the database
        # try:
        #     with engine.connect() as connection:
        #         connection.execute(
        #             text("""
        #             INSERT INTO notifications_log (request_id, recipient_email, status)
        #             VALUES (:request_id, :recipient_email, 'Success')
        #             """),
        #             {"request_id": data.get("request_id"), "recipient_email": manager_email}
        #         )
        # except SQLAlchemyError as e:
        #     print(f"Failed to log notification in database: {e}")

        return jsonify({"message": "Manager email sent successfully"}), 200

    except ApiException as e:
        print(f"Exception when sending manager email: {e}")
        return jsonify({"error": "Failed to send email"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Route to send email notification to the staff after the manager approves/rejects the WFH request
@app.route("/notify_status_update", methods=["POST"])
def notify_status_update():
    try:
        # Extract request data
        data = request.json
        staff_email = data.get("staff_email")
        request_status = data.get("status")  # Approved/Rejected
        request_id = data.get("request_id")

        # Validate presence of staff_email and change in request status
        if not staff_email or not request_status:
            return jsonify({"error": "Staff email or status is missing"}), 400
        
        # Email content to notify the staff of the request status
        sender = {"name": "Allinone", "email": "no-reply@yourcompany.com"}
        to = [{"email": staff_email}]
        subject = f"Your Work From Home Request Has Been {request_status}"
        html_content = f"""
        <html>
        <body>
            <h3>Your WFH Request Has Been {request_status}</h3>
            <p>Your WFH request with request ID {request_id} has been {request_status.lower()}.</p>
        </body>
        </html>
        """

        # Send the email
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, html_content=html_content, sender=sender, subject=subject)
        api_response = api_instance.send_transac_email(send_smtp_email)
        print("Status update email sent successfully. API response:", api_response)

        # Log the notification in the database
        try:
            with engine.connect() as connection:
                connection.execute(
                    text("""
                    INSERT INTO notifications_log (request_id, recipient_email, status)
                    VALUES (:request_id, :recipient_email, :status)
                    """),
                    {"request_id": request_id, 
                     "recipient_email": staff_email, 
                     "status": request_status}
                )
        except SQLAlchemyError as e:
            print(f"Failed to log notification in database: {e}")

        return jsonify({"message": "Status update email sent successfully"}), 200

    except ApiException as e:
        print(f"Exception when sending status update email: {e}")
        return jsonify({"error": "Failed to send email"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# # Endpoint to validate and store emails (optional)
# @app.route("/api/send-email", methods=["POST"])
# def handle_email():
#     """Store an email in the cache and validate it."""
#     data = request.get_json()
#     user_email = data.get("userEmail")
#     if "@" in user_email:
#         return jsonify({"message": "Email stored"}), 200
#     else:
#         return jsonify({"error": "Invalid email"}), 400


if __name__ == "__main__":
    app.run(port=5009, debug=True)
