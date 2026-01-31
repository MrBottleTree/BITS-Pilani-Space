import uuid
from django import forms
from core.s3 import upload_file


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
            fields = '__all__'

        def save(self, commit=True):
            instance = super().save(commit=False)
            uploaded = self.cleaned_data.get('image_upload')
            if uploaded:
                ext = uploaded.name.rsplit('.', 1)[-1] if '.' in uploaded.name else 'bin'
                key = f'{model_class.__name__.lower()}s/{uuid.uuid4()}.{ext}'
                upload_file(key, uploaded.read(), uploaded.content_type or 'application/octet-stream')
                setattr(instance, key_field, key)
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
