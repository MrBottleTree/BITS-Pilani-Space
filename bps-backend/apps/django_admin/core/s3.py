import boto3
from botocore.config import Config
from django.conf import settings


def get_s3_client():
    return boto3.client(
        's3',
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        endpoint_url=settings.S3_ENDPOINT,
        config=Config(s3={'addressing_style': 'path'}),
    )


def upload_file(key: str, file_body: bytes, content_type: str):
    client = get_s3_client()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=file_body,
        ContentType=content_type,
    )


def delete_file(key: str):
    client = get_s3_client()
    client.delete_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
    )
