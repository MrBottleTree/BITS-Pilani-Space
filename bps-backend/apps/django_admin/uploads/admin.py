import uuid
import os

from django import forms
from django.contrib import admin
from django.conf import settings
from django.utils.html import format_html

from core.s3 import upload_file
from uploads.models import UploadedImage


class UploadImageForm(forms.ModelForm):
    """Form shown on the Add page -- only a file input."""
    image_file = forms.FileField(label='Image file', required=True)

    class Meta:
        model = UploadedImage
        fields = []  # no model fields exposed

    def save(self, commit=True):
        uploaded = self.cleaned_data['image_file']
        ext = os.path.splitext(uploaded.name)[1].lower() or '.bin'
        key = f'uploads/{uuid.uuid4()}{ext}'

        upload_file(
            key=key,
            file_body=uploaded.read(),
            content_type=uploaded.content_type,
        )

        instance = super().save(commit=False)
        instance.s3_key = key
        instance.original_filename = uploaded.name
        instance.content_type = uploaded.content_type
        if commit:
            instance.save()
        return instance


@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):

    # ------------------------------------------------------------------
    # List view
    # ------------------------------------------------------------------
    list_display = ('original_filename', 's3_key_copyable', 'thumbnail', 'content_type', 'created_by', 'uploaded_at')
    list_display_links = ('original_filename',)
    list_per_page = 25

    def s3_key_copyable(self, obj):
        return format_html(
            '<span style="user-select:all; cursor:text; font-family:monospace; font-size:12px;">'
            '{key}</span>'
            '&nbsp;<button type="button" onclick="navigator.clipboard.writeText(\'{key}\')" '
            'style="cursor:pointer; font-size:11px; padding:2px 6px;">Copy</button>',
            key=obj.s3_key,
        )
    s3_key_copyable.short_description = 'S3 Key'

    def thumbnail(self, obj):
        if not obj.s3_key:
            return '(no image)'
        url = f'{settings.S3_ENDPOINT}/{settings.S3_BUCKET_NAME}/{obj.s3_key}'
        return format_html(
            '<img src="{}" style="max-height:60px; max-width:60px; '
            'border:1px solid #ccc; border-radius:4px;" />',
            url,
        )
    thumbnail.short_description = 'Preview'

    # ------------------------------------------------------------------
    # Add view -- upload form only
    # ------------------------------------------------------------------
    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            return UploadImageForm
        return super().get_form(request, obj, **kwargs)

    # ------------------------------------------------------------------
    # Change view -- readonly + large preview
    # ------------------------------------------------------------------
    readonly_fields = ('id', 's3_key', 'original_filename', 'content_type', 'created_by', 'uploaded_at', 'image_preview')

    def get_fields(self, request, obj=None):
        if obj is None:
            return ['image_file']
        return ['id', 's3_key', 'original_filename', 'content_type', 'created_by', 'uploaded_at', 'image_preview']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def image_preview(self, obj):
        if not obj.s3_key:
            return '(no image)'
        url = f'{settings.S3_ENDPOINT}/{settings.S3_BUCKET_NAME}/{obj.s3_key}'
        return format_html(
            '<img src="{}" style="max-height:400px; max-width:600px; '
            'border:1px solid #ccc; border-radius:4px;" />',
            url,
        )
    image_preview.short_description = 'Image Preview'

    def has_change_permission(self, request, obj=None):
        # Allow viewing but the form is all readonly anyway
        return True

    def has_delete_permission(self, request, obj=None):
        return True
