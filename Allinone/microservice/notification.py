# pip install first or it wont work
# pip install git+https://github.com/sendinblue/APIv3-python-library.git
from __future__ import print_function
from flask import Flask, request, jsonify
from flask_cors import CORS

# import requests
# from your_notification_service_module.notification_service import NotificationService


# import
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
# import notikey

# SQL import so that we can update the database everytime an email is sent/ received
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# configure database connection
DATABASE_URI = "mysql+mysqlconnector://root@localhost:3306/spm_db"
email_cache = {}

engine = create_engine(DATABASE_URI)

# initializing the Sendinblue configuration
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key["api-key"] = (
    ".env filepath"
)

# creating one instance of the TransactionalEmailsApi
api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
    sib_api_v3_sdk.ApiClient(configuration)
)

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


# EMAIL for creation of sucessful arrangement request made
@app.route("/successful_arrangement", methods=["POST"])
# notification_response = requests.post(f"{NOTIFICATION_MICROSERVICE_URL}/sucessful_arrangement", json={
#                     "staff_id": staff_id,
#                     "requested_day": data.get("requested_day"),
#                     "timeslot": data.get("timeslot"),
#                     "reason": data.get("reason"),
#                     "message": f"Your WFH request for {data.get('requested_day')} has been successfully created"
#                 })
def owner_notif():
    """
    Sends a notification email to the employee after successful arrangement request made.
    ---
    tags:
      - Notifications
    requestBody:
        description: Details of the low stock item and recipient's email.
        required: true
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        staff_id:
                            type: integer
                            description: The ID of the staff member.
                        requested_day:
                            type: string
                            description: The day the WFH request was made for.
                        timeslot:
                            type: string
                            description: The timeslot for the WFH request.
                        reason:
                            type: string
                            description: The reason for the WFH request.
                        owner_email:
                            type: string
                            description: The email address of the recipient (owner).
                    required:
                        - staff_id
                        - requested_day
                        - timeslot
                        - reason
                        - owner_email
    responses:
        200:
            description: Email sent successfully.
            content:
            application/json:
                schema:
                type: object
                properties:
                    message:
                    type: string
                    description: Email sent successfully.
        500:
            description: Failed to send the email.
        """

    data = request.get_json()

    # Extract data from request
    staff_id = data.get("staff_id")
    requested_day = data.get("requested_day")
    timeslot = data.get("timeslot")
    reason = data.get("reason")
    owner_email = data.get("owner_email")
    
    # email parameters
    subject = f"WFH Request for {requested_day} successfully created"
    sender = {"name": "Your Store Name", "email": "your.email@example.com"}
    to = [{"name": "Store Owner", "email": owner_email}]

    # html content of email
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Low Stock Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">

        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <h1 style="color: #333;">WFH Request for {requested_day} successfully created</h1>
        </div>

        <div style="padding: 20px;">
            <p>Hello,</p>
            <p>This is a notification to inform you that your request for your WFH arrangement has been successfully created.</p>
            <p>Details are as followd:</p>
            <p><strong>Staff ID:</strong> {staff_id}</p>
            <p><strong>Requested Day:</strong> {requested_day}</p>
            <p><strong>Timeslot:</strong> {timeslot}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <br>
            <p>Best regards,</p>
            <p>Your Store Name</p>
        </div>

    </body>
    </html>
    """

    # Creating a SendSmtpEmail object
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to, html_content=html_content, sender=sender, subject=subject
    )

    # Send the email
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Email sent successfully. API response: {api_response}")
        return jsonify({"message": "Email sent successfully."}), 200
    except ApiException as e:
        print(f"Exception when calling SMTPApi->send_transac_email: {e}\n")
        return jsonify({"message": "Failed to send the email."}), 500

#example of a vendor notification function, includes sql update and error handling
# @app.route("/invoice_request", methods=["POST"])
# # Vendor Quotation
# def invoice_request():
#     """
#     Sends an invoice email for an item request and inserts invoice details into the database.
#     ---
#     tags:
#       - Invoice Requests
#     requestBody:
#         required: true
#         content:
#             application/json:
#                 schema:
#                     type: object
#                     required:
#                         - item_name
#                         - qty
#                         - vendor_name
#                         - Quotation_id
#                         - total_price
#                     properties:
#                         item_name:
#                             type: string
#                             description: The name of the item.
#                         qty:
#                             type: integer
#                             description: The quantity of the item ordered.
#                         vendor_name:
#                             type: string
#                             description: The name of the vendor.
#                         Quotation_id:
#                             type: integer
#                             description: The unique identifier for the quotation.
#                         total_price:
#                             type: number
#                             format: float
#                             description: The total price of the items ordered.
#     responses:
#       200:
#         description: Email sent successfully and invoice details inserted into database.
#         content:
#           application/json:
#             schema:
#               type: object
#               properties:
#                 email_status:
#                   type: string
#                   description: Email status (Sent/Failed).
#       500:
#         description: Failed to send email or insert invoice details into the database.
#     """
#     data = request.json
#     item_name = data["item_name"]
#     qty = data["qty"]
#     vendor_name = data["vendor_name"]
#     Quotation_id = data["Quotation_id"]
#     total_price = data["total_price"]

#     # email parameters
#     to = [{"email": valid_email}]

#     # Email parameters
#     subject = f"Invoice for {item_name}"
#     sender = {"email": valid_email}

#     # html content of email
#     html_content = f"""
#     <!DOCTYPE html>
#     <html lang="en">
#     <head>
#         <meta charset="UTF-8">
#         <meta name="viewport" content="width=device-width, initial-scale=1.0">
#         <title>Invoice ID {Quotation_id}</title>
#     </head>
#     <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">

#         <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
#             <h1 style="color: #333;">Invoice for {item_name} of Invoice ID {Quotation_id} </h1>
#         </div>

#         <div style="padding: 20px; background-color: #FDF8FE;">
#             <p>Dear User,</p>

#             <p>Below is the Invoice for {item_name} of Invoice ID {Quotation_id}:</p>

#             <p><strong>Vendor Name:</strong> {vendor_name}</p>
#             <p><strong>Invoice ID:</strong> {Quotation_id}</p>
#             <p><strong>Product:</strong> {item_name}</p>
#             <p><strong>Quantity Ordered:</strong> {qty}</p>
#             <p><strong>Total cost:</strong> ${total_price}</p>
#             <br>

#             <p>Best regards,</p>
#             <p>ESD Bistro Automated Service</p>
#         </div>

#         <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
#             <p style="color: #777; font-size: 12px;">This is an automated notification.</p>
#         </div>

#     </body>
#     </html>
#     """

#     # creating a SendSmtpEmail object
#     send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
#         to=to, html_content=html_content, sender=sender, subject=subject
#     )

#     # send da mail
#     try:
#         api_response = api_instance.send_transac_email(send_smtp_email)
#         print("Email sent successfully. API response:", api_response)
#         email_status = "Sent"
#     except ApiException as e:
#         print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
#         email_status = "Failed"

#     # Inserting invoice details into the database
#     try:
#         # Explicitly manage transaction
#         with engine.begin() as connection:  # This will begin a transaction
#             sql = text(
#                 """
#                 INSERT INTO invoice (QuotationID, VendorName, ItemName, Quantity, TotalCost, EmailStatus, Timestamp) 
#                 VALUES (:Quotation_ID, :vendor_name, :item_name, :Quantity, :total_cost, :email_status, NOW())
#             """
#             )
#             connection.execute(
#                 sql,
#                 {
#                     "Quotation_ID": Quotation_id,
#                     "vendor_name": vendor_name,
#                     "item_name": item_name,
#                     "Quantity": qty,
#                     "total_cost": total_price,
#                     "email_status": email_status,
#                 },
#             )
#             # The transaction is automatically committed here if no exceptions occurred
#             print("Successfully inserted")
#     except SQLAlchemyError as e:
#         print(f"Database error occurred: {e}")
#         # Transaction is automatically rolled back if an exception occurs

#     return email_status


@app.route("/error_email", methods=["POST"])
def error_email():
    """
    Sends an email notification about an error detected in the system.
    ---
    tags:
      - Error Notifications
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    type: object
                    required:
                        - error_message
                        - endpoint
                        - status_code
                        - timestamp
                        - owner_email
                    properties:
                        error_message:
                            type: string
                            description: A message describing the error that occurred.
                        endpoint:
                            type: string
                            description: The endpoint where the error was detected.
                        status_code:
                            type: integer
                            description: The HTTP status code associated with the error.
                        timestamp:
                            type: string
                            description: The timestamp when the error was detected.
                        owner_email:
                            type: string
                            description: The email address to which the error notification should be sent.
    responses:
      200:
        description: Error notification email sent successfully.
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  description: Error data received successfully.
      500:
        description: Failed to process the request or send the email notification.
    """
    print("error_email initialized")
    try:
        data = request.get_json()
        errormessage = data.get("error_message", "No error message provided")
        endpoint = data.get("endpoint", "No endpoint provided")
        statuscode = data.get("status_code")
        timestamp = data.get("timestamp")
        owner_email = data.get("owner_email")
        print("owneremail= ", owner_email)

        # email parameters
        subject = f"Error Detected as of {timestamp}"
        sender = {
            "name": "Notification Service",
            "email": "wenhan.chen.2022@scis.smu.edu.sg",
        }
        to = [{"email": owner_email}]

        # html content of email
        html_content = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error Detected</title>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">

            <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                <h1 style="color: #cd0000;">Error Detected</h1>
            </div>

            <div style="padding: 20px; background-color: #FDF8FE;">
                <p>Hello gaymos,</p>

                <p>This is a notification to inform you that an error has occured as of {timestamp}. Details are as follows:</p>

                <p><strong>Endpoint:</strong> {endpoint}</p>
                <p><strong>Error Message:</strong> {errormessage}</p>
                <p><strong>Status Code:</strong> {statuscode}</p>

                <p>We reccommend that you contact our support provider to rectify the error.</p>

                <p>Good luck !</p>

                <p>Best regards,</p>
                <p>ESD Bistro Automated Service</p>
            </div>

            <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                <p style="color: #777; font-size: 12px;">This is an automated notification. Please do not reply to this email.</p>
            </div>

        </body>
        </html>
        """

        # creating a SendSmtpEmail object
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=to, html_content=html_content, sender=sender, subject=subject
        )

        # send da mail
        try:
            # Send the transactional email
            api_response = api_instance.send_transac_email(send_smtp_email)
            print("Error Email sent successfully. API response:", api_response)
        except ApiException as e:
            print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)
        return jsonify({"message": "Error data received successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/send-email", methods=["POST"])
def handle_email():
    """
    Store an email in the cache
    ---
    responses:
        200:
            description: Return the email stored in cache.
        404:
            description: Return invalid email error message.
    """
    data = request.get_json()
    user_email = data.get("userEmail")
    global valid_email
    valid_email = validate_and_cache_email(user_email)
    if valid_email:
        return jsonify({"message": "Email stored"}), 200
    else:
        return jsonify({"error": "Invalid email"}), 400


def validate_and_cache_email(user_email):
    # Logic to validate and cache the email
    if user_email and "@" in user_email:
        email_cache["user_email"] = user_email
        print("VALIDATE = ", email_cache)
        return user_email
    else:
        return None


if __name__ == "__main__":
    app.run(port=5009, debug=True)
