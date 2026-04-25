import pymongo
import random
import string
import datetime
import os
from django.contrib.auth.models import AbstractUser
# Standard Django fields or logic use kar rahe hain
from django.db import models
from django.conf import settings

def get_db():
    """MongoDB connection setup."""
    mongo_uri = os.getenv('MONGODB_URI', getattr(settings, 'MONGODB_URI', 'mongodb://localhost:27017/'))
    db_name   = os.getenv('MONGODB_DB_NAME', getattr(settings, 'MONGODB_DB_NAME', 'funlearn_db'))
    client    = pymongo.MongoClient(mongo_uri)
    return client[db_name]

# Iska naam humne wapas "User" rakha hai aapki request par
class User(AbstractUser):
    """Extended Django user with role field."""
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('parent',  'Parent'),
        ('admin',   'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Naye frontend ke liye email ko unique hona zaroori hai
    email = models.EmailField(unique=True)

    class Meta:
        db_table = 'auth_user'

    def __str__(self):
        return f"{self.username} ({self.role})"

def generate_class_code(first_name):
    prefix = (first_name or 'CLASS').upper()[:6]
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f'{prefix}-{suffix}'

def create_student_profile(user, age_group, class_code=''):
    db = get_db()
    profile = {
        'user_id':       str(user.id),
        'username':      user.username,
        'first_name':    user.first_name,
        'last_name':     user.last_name,
        'age_group':     age_group,
        'class_code':    class_code.upper().strip() if class_code else '',
        'current_level': 1,
        'total_stars':   0,
        'completed_lessons': [],
        'created_at':    datetime.datetime.utcnow(),
    }
    db.student_profiles.insert_one(profile)

    if class_code:
        db.classes.update_one(
            {'class_code': class_code.upper().strip()},
            {'$addToSet': {'student_ids': str(user.id)}, '$inc': {'student_count': 1}}
        )
    return profile

def create_teacher_profile(user, school_name):
    db = get_db()
    profile = {
        'user_id':     str(user.id),
        'username':    user.username,
        'first_name':  user.first_name,
        'last_name':   user.last_name,
        'school_name': school_name,
        'class_code':  "", 
        'created_at':  datetime.datetime.utcnow(),
    }
    db.teacher_profiles.insert_one(profile)
    return profile

def create_parent_profile(user, child_username):
    db = get_db()
    profile = {
        'user_id':        str(user.id),
        'username':       user.username,
        'first_name':     user.first_name,
        'last_name':      user.last_name,
        'children':       [child_username],
        'created_at':     datetime.datetime.utcnow(),
    }
    db.parent_profiles.insert_one(profile)
    return profile

def create_admin_profile(user):
    db = get_db()
    profile = {
        'user_id':     str(user.id),
        'username':    user.username,
        'first_name':  user.first_name,
        'last_name':   user.last_name,
        'role':        'superadmin',
        'created_at':  datetime.datetime.utcnow(),
    }
    db.admin_profiles.insert_one(profile)
    return profile