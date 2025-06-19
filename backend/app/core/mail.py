from fastapi_mail import FastMail, ConnectionConfig, MessageSchema
from app.core.config import Settings

conf = ConnectionConfig(
    MAIL_USERNAME=Settings.MAIL_USERNAME,
    MAIL_PASSWORD=Settings.MAIL_PASSWORD,
    MAIL_FROM=Settings.MAIL_FROM,
    MAIL_PORT=Settings.MAIL_PORT,
    MAIL_SERVER=Settings.MAIL_SERVER,
    MAIL_TLS=Settings.MAIL_TLS,
    MAIL_SSL=Settings.MAIL_SSL,
    USE_CREDENTIALS=Settings.USE_CREDENTIALS,
    VALIDATE_CERTS=Settings.VALIDATE_CERTS,
)

fastmail = FastMail(conf)

async def send_email(subject: str, recipients: list, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype="html" # 可以是 "plain" 或 "html"
    )
    try:
        await fastmail.send_message(message)
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print(f"邮件发送失败: {e}")
        return {"status": "error", "message": f"Failed to send email: {e}"} 