# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Avatar(models.Model):
    id = models.TextField(primary_key=True)
    name = models.TextField()
    image_key = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True, related_name='+')

    class Meta:
        managed = False
        db_table = 'Avatar'


class Element(models.Model):
    id = models.TextField(primary_key=True)
    name = models.TextField()
    image_key = models.TextField()
    height = models.IntegerField()
    width = models.IntegerField()
    static = models.BooleanField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True, related_name='+')

    class Meta:
        managed = False
        db_table = 'Element'
        unique_together = (('image_key', 'static'),)


class Handlesequence(models.Model):
    base_name = models.TextField(primary_key=True)
    count = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'HandleSequence'


class Map(models.Model):
    id = models.TextField(primary_key=True)
    name = models.TextField()
    height = models.IntegerField()
    width = models.IntegerField()
    thumbnail_key = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True, related_name='+')

    class Meta:
        managed = False
        db_table = 'Map'


class Mapelementplacement(models.Model):
    id = models.TextField(primary_key=True)
    map = models.ForeignKey(Map, models.DO_NOTHING, blank=True, null=True, related_name='+')
    element = models.ForeignKey(Element, models.DO_NOTHING, blank=True, null=True, related_name='+')
    x = models.IntegerField()
    y = models.IntegerField()
    scale = models.FloatField()
    rotation = models.FloatField()

    class Meta:
        managed = False
        db_table = 'MapElementPlacement'


class Refreshtoken(models.Model):
    id = models.TextField(primary_key=True)
    token_hash = models.TextField(unique=True)
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True, related_name='+')
    created_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)
    last_used_at = models.DateTimeField()
    user_agent = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'RefreshToken'


class Space(models.Model):
    id = models.TextField(primary_key=True)
    name = models.TextField()
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    map = models.ForeignKey(Map, models.DO_NOTHING, blank=True, null=True, related_name='+')
    user = models.ForeignKey('User', models.DO_NOTHING, blank=True, null=True, related_name='+')

    class Meta:
        managed = False
        db_table = 'Space'


class Spaceelementplacement(models.Model):
    id = models.TextField(primary_key=True)
    space = models.ForeignKey(Space, models.DO_NOTHING, blank=True, null=True, related_name='+')
    element = models.ForeignKey(Element, models.DO_NOTHING, blank=True, null=True, related_name='+')
    x = models.IntegerField()
    y = models.IntegerField()
    scale = models.FloatField()
    rotation = models.FloatField()

    class Meta:
        managed = False
        db_table = 'SpaceElementPlacement'


class User(models.Model):
    id = models.TextField(primary_key=True)
    name = models.TextField()
    handle = models.TextField(unique=True)
    password_hash = models.TextField()
    email = models.TextField(unique=True)
    role = models.TextField()  # This field type is a guess.
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    deleted_at = models.DateTimeField(blank=True, null=True)
    avatar = models.ForeignKey(Avatar, models.DO_NOTHING, blank=True, null=True, related_name='+')

    class Meta:
        managed = False
        db_table = 'User'


class PrismaMigrations(models.Model):
    id = models.CharField(primary_key=True, max_length=36)
    checksum = models.CharField(max_length=64)
    finished_at = models.DateTimeField(blank=True, null=True)
    migration_name = models.CharField(max_length=255)
    logs = models.TextField(blank=True, null=True)
    rolled_back_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField()
    applied_steps_count = models.IntegerField()

    class Meta:
        managed = False
        db_table = '_prisma_migrations'
