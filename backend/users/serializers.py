import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import (
    get_db,
    create_student_profile,
    create_teacher_profile,
    create_parent_profile,
    create_admin_profile,
)

User = get_user_model()


def validate_password_strength(password):
    if len(password) < 8:
        raise serializers.ValidationError('Password must be at least 8 characters long.')
    if not re.search(r'[0-9]', password):
        raise serializers.ValidationError('Password must contain at least one number.')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+]', password):
        raise serializers.ValidationError('Password must contain at least one special character like ! @ # $ %')
    return password


def verify_otp_code(email, role, otp_code):
    db  = get_db()
    otp = db.otp_codes.find_one({'email': email.lower(), 'role': role})
    if not otp:
        return 'Verification code not found. Please request a new one.'
    if str(otp.get('code', '')) != str(otp_code).strip():
        return 'Wrong verification code. Please try again.'
    db.otp_codes.update_one(
        {'email': email.lower(), 'role': role},
        {'$set': {'verified': True}}
    )
    return None


# ── STUDENT — username only, NO email ────────────────────────────

class StudentRegisterSerializer(serializers.Serializer):
    username         = serializers.CharField(max_length=50)
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    first_name       = serializers.CharField(max_length=50)
    last_name        = serializers.CharField(max_length=50)
    age_group        = serializers.ChoiceField(choices=['3-6', '6-9', '9-12'])
    class_code       = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError('Username must be at least 3 characters.')
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError('Username can only have letters, numbers and underscores. No spaces.')
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken. Please choose another.')
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        # Students have no real email — create internal fake one
        fake_email = f"{validated_data['username'].lower()}_{User.objects.count()}@student.funlearn.internal"
        user = User.objects.create_user(
            email      = fake_email,
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            role       = 'student',
        )
        create_student_profile(
            user       = user,
            age_group  = validated_data['age_group'],
            class_code = validated_data.get('class_code', ''),
        )
        return user


# ── TEACHER — email + OTP ────────────────────────────────────────

class TeacherRegisterSerializer(serializers.Serializer):
    email            = serializers.EmailField()
    username         = serializers.CharField(max_length=50)
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    first_name       = serializers.CharField(max_length=50)
    last_name        = serializers.CharField(max_length=50)
    school_name      = serializers.CharField(max_length=100)
    otp_code         = serializers.CharField(max_length=6)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered. Please login instead.')
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError('Username can only have letters, numbers and underscores.')
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        error = verify_otp_code(data['email'], 'teacher', data['otp_code'])
        if error:
            raise serializers.ValidationError({'otp_code': error})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('otp_code')
        user = User.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            role       = 'teacher',
        )
        create_teacher_profile(user=user, school_name=validated_data['school_name'])
        return user


# ── PARENT — email + OTP ─────────────────────────────────────────

class ParentRegisterSerializer(serializers.Serializer):
    email            = serializers.EmailField()
    username         = serializers.CharField(max_length=50)
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    first_name       = serializers.CharField(max_length=50)
    last_name        = serializers.CharField(max_length=50)
    child_username   = serializers.CharField(max_length=50)
    otp_code         = serializers.CharField(max_length=6)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered. Please login instead.')
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_child_username(self, value):
        if not User.objects.filter(username__iexact=value, role='student').exists():
            raise serializers.ValidationError(
                'Child username not found. Make sure your child registered first as a student.'
            )
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        error = verify_otp_code(data['email'], 'parent', data['otp_code'])
        if error:
            raise serializers.ValidationError({'otp_code': error})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data.pop('otp_code')
        user = User.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            role       = 'parent',
        )
        create_parent_profile(user=user, child_username=validated_data['child_username'])
        return user


# ── ADMIN — email + OTP + secret key ─────────────────────────────

class AdminRegisterSerializer(serializers.Serializer):
    email            = serializers.EmailField()
    username         = serializers.CharField(max_length=50)
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)
    first_name       = serializers.CharField(max_length=50)
    last_name        = serializers.CharField(max_length=50)
    admin_secret_key = serializers.CharField(max_length=100)
    otp_code         = serializers.CharField(max_length=6)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_admin_secret_key(self, value):
        if value.strip() != settings.ADMIN_SECRET_KEY:
            raise serializers.ValidationError(
                'Invalid admin secret key. Contact the system administrator.'
            )
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        error = verify_otp_code(data['email'], 'admin', data['otp_code'])
        if error:
            raise serializers.ValidationError({'otp_code': error})
        return data

    def create(self, validated_data):
        for field in ['confirm_password', 'otp_code', 'admin_secret_key']:
            validated_data.pop(field)
        user = User.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data['last_name'],
            role       = 'admin',
            is_staff   = True,
        )
        create_admin_profile(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model            = User
        fields           = ['id', 'email', 'username', 'role', 'first_name', 'last_name', 'date_joined']
        read_only_fields = fields