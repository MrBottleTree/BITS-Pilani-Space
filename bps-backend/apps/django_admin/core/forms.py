import uuid
from django import forms
from django.utils import timezone
from core.s3 import upload_file, delete_file


def _build_image_form(model_class, key_field: str, upload_label: str):
    """Factory that returns a ModelForm subclass with an image upload field."""

    class ImageUploadForm(forms.ModelForm):
        image_upload = forms.FileField(
            required=False,
            label=upload_label,
            help_text='Select a file to upload to S3. Leave empty to keep the current value.',
        )

        class Meta:
            model = model_class
            exclude = ['id', 'created_at', 'updated_at']

        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            if key_field in self.fields:
                self.fields[key_field].required = False
                self.fields[key_field].help_text = (
                    'Auto-filled when uploading an image. Can also be set manually.'
                )

        def clean(self):
            cleaned = super().clean()
            uploaded = cleaned.get('image_upload')
            key_value = cleaned.get(key_field)
            existing_key = getattr(self.instance, key_field, None)
            if not uploaded and not key_value and not existing_key:
                raise forms.ValidationError(
                    f'Either upload an image or provide a value for {key_field}.'
                )
            return cleaned

        def save(self, commit=True):
            instance = super().save(commit=False)

            if not instance.pk:
                instance.pk = str(uuid.uuid4())

            now = timezone.now()
            if not instance.created_at:
                instance.created_at = now
            instance.updated_at = now

            uploaded = self.cleaned_data.get('image_upload')
            if uploaded:
                old_key = getattr(instance, key_field, None)

                ext = uploaded.name.rsplit('.', 1)[-1] if '.' in uploaded.name else 'bin'
                key = f'{model_class.__name__.lower()}s/{uuid.uuid4()}.{ext}'
                upload_file(key, uploaded.read(), uploaded.content_type or 'application/octet-stream')
                setattr(instance, key_field, key)

                if old_key and old_key != key:
                    try:
                        delete_file(old_key)
                    except Exception:
                        pass

            if commit:
                instance.save()
            return instance

    return ImageUploadForm


def get_avatar_form(model_class):
    return _build_image_form(model_class, 'image_key', 'Upload avatar image')


def get_element_form(model_class):
    return _build_image_form(model_class, 'image_key', 'Upload element image')


def get_map_form(model_class):
    return _build_image_form(model_class, 'thumbnail_key', 'Upload map thumbnail')
