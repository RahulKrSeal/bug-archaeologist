import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_verification_email(
    recipient_email: str,
    verification_link: str,
):
    """
    Send an email containing the verification link.

    At this point the User account does NOT exist yet.
    The user is only verifying ownership of the email address.
    """

    message = EmailMessage()

    # -----------------------------------------------------
    # Email information
    # -----------------------------------------------------

    message["Subject"] = (
        "Bug Archaeologist - Verify Your Email"
    )

    message["From"] = settings.SMTP_USERNAME

    message["To"] = recipient_email

    # -----------------------------------------------------
    # Email body
    # -----------------------------------------------------

    message.set_content(
        f"""
Hello,

You requested to create an account with Bug Archaeologist.

Before creating your account, please verify that
you own this email address.

Click the verification link below:

{verification_link}

This verification link expires in 30 minutes.

After verification, return to the Bug Archaeologist
Sign Up page and complete your account creation.

If you did not request this verification, you can
safely ignore this email.

Regards,
Bug Archaeologist
"""
    )

    # -----------------------------------------------------
    # Connect to Gmail SMTP
    # -----------------------------------------------------

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT,
        timeout=30,
    ) as smtp:

        # Useful during development/testing.
        # It shows SMTP communication in the terminal.
        smtp.set_debuglevel(1)

        # Start TLS encryption.
        smtp.starttls()

        # Authenticate with Gmail.
        #
        # SMTP_PASSWORD must be the Gmail App Password,
        # NOT your normal Gmail password.
        smtp.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
        )

        # Send the email.
        smtp.send_message(message)