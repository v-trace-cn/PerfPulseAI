# app/core/security.py
import base64
import json

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

# 生成一对 2048 位的 RSA 密钥，启动时一次即可
_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public_key = _private_key.public_key()

def get_public_key_pem() -> str:
    """返回 PEM 格式的公钥字符串，前端用它来加密."""
    pem = _public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem.decode('utf-8')

def decrypt_rsa(encrypted_b64: str) -> dict:
    """RSA 私钥解密，返回解析后的 JSON 对象."""
    ciphertext = base64.b64decode(encrypted_b64)
    plaintext = _private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return json.loads(plaintext.decode('utf-8'))
