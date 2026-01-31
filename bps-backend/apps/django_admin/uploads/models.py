import uuid
from django.conf import settings
from django.db import models


class UploadedImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    s3_key = models.CharField(max_length=512, unique=True, editable=False)
    original_filename = models.CharField(max_length=255, editable=False)
    content_type = models.CharField(max_length=100, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        editable=False,
        related_name='+',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_uploaded_image'
        managed = True
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename
