import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_email(to_email: str, subject: str, html_content: str):
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDER_EMAIL")

    if not sendgrid_api_key or not sender_email:
        print("SendGrid API Key or Sender Email not configured. Skipping email.")
        return

    message = Mail(
        from_email=sender_email,
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        print(f"Invitation email sent to {to_email}, status code: {response.status_code}")
    except Exception as e:
        print(f"Failed to send email with SendGrid: {e}") 