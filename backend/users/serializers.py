from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import get_db, create_student_profile, create_teacher_profile, create_parent_profile, create_admin_profile

User = get_user_model()

class StudentRegisterSerializer(serializers.Serializer):
    email      = serializers.EmailField()
    username   = serializers.CharField(max_length=50)
    password   = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(max_length=50)
    last_name  = serializers.CharField(max_length=50)
    age_group  = serializers.ChoiceField(choices=['3-6', '6-9', '9-12'])
    class_code = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already registered!')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is taken!')
        return value

    def validate_class_code(self, value):
        if value and value.strip():
            db  = get_db()
            cls = db.classes.find_one({'class_code': value.upper().strip()})
            if not cls:
                raise serializers.ValidationError('Class code not found! Ask your teacher or leave empty.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'], username=validated_data['username'],
            password=validated_data['password'], first_name=validated_data['first_name'],
            last_name=validated_data['last_name'], role='student',
        )
        create_student_profile(user=user, age_group=validated_data['age_group'], class_code=validated_data.get('class_code', ''))
        return user

class TeacherRegisterSerializer(serializers.Serializer):
    email       = serializers.EmailField()
    username    = serializers.CharField(max_length=50)
    password    = serializers.CharField(min_length=6, write_only=True)
    first_name  = serializers.CharField(max_length=50)
    last_name   = serializers.CharField(max_length=50)
    school_name = serializers.CharField(max_length=100)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered!')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username taken!')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'], username=validated_data['username'],
            password=validated_data['password'], first_name=validated_data['first_name'],
            last_name=validated_data['last_name'], role='teacher',
        )
        create_teacher_profile(user=user, school_name=validated_data['school_name'])
        return user

class ParentRegisterSerializer(serializers.Serializer):
    email          = serializers.EmailField()
    username       = serializers.CharField(max_length=50)
    password       = serializers.CharField(min_length=6, write_only=True)
    first_name     = serializers.CharField(max_length=50)
    last_name      = serializers.CharField(max_length=50)
    child_username = serializers.CharField(max_length=50)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered!')
        return value

    def validate_child_username(self, value):
        if not User.objects.filter(username=value, role='student').exists():
            raise serializers.ValidationError('Child username not found! Make sure your child registered first.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'], username=validated_data['username'],
            password=validated_data['password'], first_name=validated_data['first_name'],
            last_name=validated_data['last_name'], role='parent',
        )
        create_parent_profile(user=user, child_username=validated_data['child_username'])
        return user

class AdminRegisterSerializer(serializers.Serializer):
    email      = serializers.EmailField()
    username   = serializers.CharField(max_length=50)
    password   = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(max_length=50)
    last_name  = serializers.CharField(max_length=50)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered!')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username taken!')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'], username=validated_data['username'],
            password=validated_data['password'], first_name=validated_data['first_name'],
            last_name=validated_data['last_name'], role='admin', is_staff=True,
        )
        create_admin_profile(user=user)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model        = User
        fields       = ['id','email','username','role','first_name','last_name','date_joined']
        read_only_fields = fields