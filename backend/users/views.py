from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.http import JsonResponse
from django.conf import settings
from .models import (
    get_db,
    create_student_profile,
    create_teacher_profile,
    create_parent_profile,
    create_admin_profile,
)
from .serializers import (
    StudentRegisterSerializer,
    TeacherRegisterSerializer,
    ParentRegisterSerializer,
    AdminRegisterSerializer,
)
from datetime import datetime
import random
import string
import traceback
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    role = request.data.get('role', '').strip()
    serializer_map = {
        'student': StudentRegisterSerializer,
        'teacher': TeacherRegisterSerializer,
        'parent':  ParentRegisterSerializer,
        'admin':   AdminRegisterSerializer,
    }
    Serializer = serializer_map.get(role)
    if not Serializer:
        return Response({'error': 'Invalid role.'}, status=400)

    serializer = Serializer(data=request.data)
    if serializer.is_valid():
        user  = serializer.save()
        db    = get_db()
        extra = {}
        if role == 'teacher':
            tp = db.teacher_profiles.find_one({'user_id': str(user.id)}, {'_id': 0})
            if tp:
                extra = {'class_code': tp.get('class_code', '')}
        return Response({'message': f'{role.capitalize()} registered successfully!', 'user_id': user.id, **extra}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp_view(request):
    email = request.data.get('email', '').strip().lower()
    role  = request.data.get('role',  '').strip()

    if not email:
        return Response({'error': 'Email is required.'}, status=400)
    if role not in ['teacher', 'parent', 'admin']:
        return Response({'error': 'OTP is only for teacher, parent and admin.'}, status=400)
    if User.objects.filter(email__iexact=email).exists():
        return Response({'error': 'This email is already registered. Please login instead.'}, status=400)

    otp_code = str(random.randint(100000, 999999))
    db = get_db()
    db.otp_codes.delete_many({'email': email, 'role': role})
    db.otp_codes.insert_one({
        'email':      email,
        'role':       role,
        'code':       otp_code,
        'verified':   False,
        'created_at': datetime.utcnow(),
    })

    def _try_send(port, use_tls, use_ssl):
        """Attempt to send OTP email on given port/protocol."""
        from django.core.mail import get_connection
        conn = get_connection(
            backend='users.email_backend.RobustSMTPEmailBackend',
            host=settings.EMAIL_HOST,
            port=port,
            username=settings.EMAIL_HOST_USER,
            password=settings.EMAIL_HOST_PASSWORD,
            use_tls=use_tls,
            use_ssl=use_ssl,
            timeout=3,
            fail_silently=False,
        )
        send_mail(
            subject        = 'FunLearn AI — Your Verification Code',
            message        = (
                f'Hello!\n\nYour FunLearn AI verification code is:\n\n'
                f'  {otp_code}\n\n'
                f'This code expires in 10 minutes.\n'
                f'Do not share this code with anyone.\n\n'
                f'— FunLearn AI Team'
            ),
            from_email     = settings.EMAIL_HOST_USER,
            recipient_list = [email],
            fail_silently  = False,
            connection     = conn,
        )

    attempts = [
        (587, True,  False),   # Port 587 STARTTLS  (primary)
        (465, False, True),    # Port 465 SSL       (fallback 1)
        (2525, True, False),   # Port 2525 STARTTLS (fallback 2, works on some clouds)
    ]

    last_error = None
    for port, use_tls, use_ssl in attempts:
        try:
            logger.info(f'[OTP] Trying port {port} for {email}')
            _try_send(port, use_tls, use_ssl)
            logger.info(f'[OTP] Email sent successfully to {email} via port {port}')
            return Response({'message': f'Verification code sent to {email}. Check your inbox and spam folder.'})
        except Exception as e:
            tb = traceback.format_exc()
            logger.warning(f'[OTP] Port {port} failed for {email}: {e}\n{tb}')
            last_error = e

    # All ports failed
    logger.error(f'[OTP] All SMTP ports failed for {email}. Last error: {last_error}')
    
    # Fallback for Render Free Tier (Demo Mode)
    # Since free tier blocks SMTP, we return the OTP in the response to unblock the FYP presentation
    return Response({
        'message': f'DEMO MODE: Email sending is blocked by server. Your verification code is: {otp_code}',
        'demo_otp': otp_code
    }, status=200)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    email    = request.data.get('email',    '').strip().lower()
    role     = request.data.get('role',     '').strip()
    otp_code = request.data.get('otp_code', '').strip()

    if not email or not role or not otp_code:
        return Response({'error': 'Email, role and otp_code are required.'}, status=400)

    db  = get_db()
    otp = db.otp_codes.find_one({'email': email, 'role': role})
    if not otp:
        return Response({'error': 'Code not found. Please request a new verification code.'}, status=400)
    if str(otp.get('code', '')) != str(otp_code):
        return Response({'error': 'Wrong code. Please check your email and try again.'}, status=400)

    return Response({'message': 'Code verified! Please complete your registration.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email    = request.data.get('email',    '').strip().lower()
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    role     = request.data.get('role',     '').strip()

    if not password:
        return Response({'error': 'Password is required.'}, status=400)

    user_obj = None

    if username:
        try:
            user_obj = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this username.'}, status=400)
    elif email:
        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=400)
    else:
        return Response({'error': 'Please provide username or email.'}, status=400)

    if not user_obj.is_active:
        return Response({'error': 'Your account has been deactivated. Contact admin.'}, status=403)

    auth_user = authenticate(request, username=user_obj.username, password=password)
    if not auth_user:
        return Response({'error': 'Wrong password. Please try again.'}, status=400)

    if role and auth_user.role != role:
        return Response({'error': f'This is a "{auth_user.role}" account, not "{role}". Select the correct role.'}, status=400)

    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(auth_user)
    db      = get_db()
    profile = {}

    if auth_user.role == 'student':
        raw = db.student_profiles.find_one({'user_id': str(auth_user.id)}, {'_id': 0})
        if raw:
            age = raw.get('age_group', '6-9')
            raw['age_group'] = {'3-5': '3-6', '6-8': '6-9'}.get(age, age)
            profile = raw
    elif auth_user.role == 'teacher':
        profile = db.teacher_profiles.find_one({'user_id': str(auth_user.id)}, {'_id': 0}) or {}
    elif auth_user.role == 'parent':
        profile = db.parent_profiles.find_one({'user_id': str(auth_user.id)}, {'_id': 0}) or {}

    for key, val in list(profile.items()):
        if hasattr(val, 'isoformat'):
            profile[key] = val.isoformat()

    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id':         auth_user.id,
            'email':      auth_user.email,
            'username':   auth_user.username,
            'first_name': auth_user.first_name,
            'last_name':  auth_user.last_name,
            'role':       auth_user.role,
            'profile':    profile,
        },
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    db   = get_db()
    profile = {}
    if user.role == 'student':
        raw = db.student_profiles.find_one({'user_id': str(user.id)}, {'_id': 0})
        if raw:
            age = raw.get('age_group', '6-9')
            raw['age_group'] = {'3-5': '3-6', '6-8': '6-9'}.get(age, age)
            profile = raw
    elif user.role == 'teacher':
        profile = db.teacher_profiles.find_one({'user_id': str(user.id)}, {'_id': 0}) or {}
    elif user.role == 'parent':
        profile = db.parent_profiles.find_one({'user_id': str(user.id)}, {'_id': 0}) or {}
    for key, val in list(profile.items()):
        if hasattr(val, 'isoformat'):
            profile[key] = val.isoformat()
    return Response({
        'id': user.id, 'email': user.email, 'username': user.username,
        'first_name': user.first_name, 'last_name': user.last_name,
        'role': user.role, 'profile': profile,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    user = request.user
    if 'first_name' in request.data: user.first_name = request.data['first_name']
    if 'last_name'  in request.data: user.last_name  = request.data['last_name']
    user.save()
    return Response({'message': 'Profile updated!'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    if not authenticate(username=user.username, password=request.data.get('old_password', '')):
        return Response({'error': 'Wrong current password!'}, status=400)
    user.set_password(request.data.get('new_password', ''))
    user.save()
    return Response({'message': 'Password changed!'})


@api_view(['GET'])
@permission_classes([AllowAny])
def check_class_code_view(request):
    code = request.query_params.get('code', '').upper().strip()
    db   = get_db()
    cls  = db.classes.find_one({'class_code': code}, {'_id': 0})
    if cls:
        return Response({'valid': True, 'message': f'✅ Class "{cls.get("class_name","")}" found!', 'class_name': cls.get('class_name','')})
    return Response({'valid': False, 'message': '❌ Class code not found.'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_class_view(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can join classes.'}, status=400)
    code = request.data.get('class_code', '').upper().strip()
    db   = get_db()
    if not db.classes.find_one({'class_code': code}):
        return Response({'error': 'Class code not found!'}, status=404)
    db.student_profiles.update_one({'user_id': str(request.user.id)}, {'$set': {'class_code': code}})
    db.classes.update_one({'class_code': code}, {'$addToSet': {'student_ids': str(request.user.id)}, '$inc': {'student_count': 1}})
    return Response({'message': f'Joined class {code}!'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_class_view(request):
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can create classes.'}, status=400)
    class_name = request.data.get('class_name', '').strip()
    if not class_name:
        return Response({'error': 'Class name is required.'}, status=400)
    db         = get_db()
    suffix     = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    prefix     = (request.user.first_name or 'CLASS').upper()[:6]
    class_code = f'{prefix}-{suffix}'
    new_class  = {
        'class_name': class_name, 'class_code': class_code,
        'teacher_id': str(request.user.id),
        'teacher_name': f'{request.user.first_name} {request.user.last_name}',
        'student_ids': [], 'student_count': 0,
        'created_at': datetime.utcnow(), 'active': True,
    }
    db.classes.insert_one(new_class)
    new_class.pop('_id', None)
    new_class['created_at'] = new_class['created_at'].isoformat()
    return Response({'message': 'Class created!', 'class': new_class}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_classes_view(request):
    if request.user.role != 'teacher':
        return Response({'error': 'Teachers only.'}, status=400)
    db      = get_db()
    classes = list(db.classes.find({'teacher_id': str(request.user.id)}, {'_id': 0}))
    for cls in classes:
        if 'created_at' in cls and hasattr(cls['created_at'], 'isoformat'):
            cls['created_at'] = cls['created_at'].isoformat()
    return Response({'classes': classes})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def class_detail_view(request, class_code):
    db  = get_db()
    cls = db.classes.find_one({'class_code': class_code}, {'_id': 0})
    if not cls:
        return Response({'error': 'Class not found.'}, status=404)
    student_ids = cls.get('student_ids', [])
    students    = []
    for sid in student_ids:
        try:
            u       = User.objects.get(id=int(sid))
            profile = db.student_profiles.find_one({'user_id': sid}, {'_id': 0}) or {}
            scores  = list(db.game_scores.find({'student_id': sid}, {'_id': 0, 'percentage': 1}).limit(50))
            avg     = round(sum(min(100, s.get('percentage', 0)) for s in scores) / len(scores), 1) if scores else 0
            age     = profile.get('age_group', '6-9')
            age     = {'3-5': '3-6', '6-8': '6-9'}.get(age, age)
            students.append({
                'user_id': sid, 'first_name': u.first_name, 'last_name': u.last_name,
                'age_group': age, 'current_level': profile.get('current_level', 1),
                'total_stars': profile.get('total_stars', 0), 'avg_score': avg,
            })
        except (User.DoesNotExist, ValueError):
            pass
    if 'created_at' in cls and hasattr(cls['created_at'], 'isoformat'):
        cls['created_at'] = cls['created_at'].isoformat()
    return Response({'class': cls, 'students': students})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_detail_view(request):
    student_id = request.query_params.get('student_id', '').strip()
    if not student_id:
        return Response({'error': 'student_id required.'}, status=400)
    db = get_db()
    try:
        u = User.objects.get(id=int(student_id))
    except (User.DoesNotExist, ValueError):
        return Response({'error': 'Student not found.'}, status=404)
    profile = db.student_profiles.find_one({'user_id': student_id}, {'_id': 0}) or {}
    scores  = list(db.game_scores.find({'student_id': student_id}, {'_id': 0}).sort('played_at', -1).limit(100))
    badges  = list(db.badges.find({'student_id': student_id}, {'_id': 0}))
    for s in scores:
        s['percentage'] = min(100, s.get('percentage', 0))
        if 'played_at' in s and hasattr(s['played_at'], 'isoformat'):
            s['played_at'] = s['played_at'].isoformat()
    game_avgs = {}
    for s in scores:
        gid = s.get('game_id', '')
        game_avgs.setdefault(gid, []).append(s['percentage'])
    game_averages = {g: round(sum(v)/len(v)) for g, v in game_avgs.items()}
    overall_avg   = round(sum(s['percentage'] for s in scores)/len(scores)) if scores else 0
    for key, val in list(profile.items()):
        if hasattr(val, 'isoformat'): profile[key] = val.isoformat()
    return Response({
        'user_id': student_id, 'first_name': u.first_name, 'last_name': u.last_name,
        'profile': profile, 'total_games': len(scores), 'overall_avg': overall_avg,
        'game_averages': game_averages, 'recent_scores': scores[:10], 'badges': badges, 'scores': scores,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_children_view(request):
    if request.user.role != 'parent':
        return Response({'error': 'Parents only.'}, status=400)
    db     = get_db()
    parent = db.parent_profiles.find_one({'user_id': str(request.user.id)}, {'_id': 0})
    if not parent:
        return Response({'children': []})
    children_usernames = parent.get('children', [])
    if isinstance(children_usernames, str):
        children_usernames = [children_usernames]
    children = []
    for uname in children_usernames:
        try:
            child   = User.objects.get(username=uname, role='student')
            sid     = str(child.id)
            profile = db.student_profiles.find_one({'user_id': sid}, {'_id': 0}) or {}
            scores  = list(db.game_scores.find({'student_id': sid}, {'_id': 0}).sort('played_at', -1).limit(50))
            badges  = list(db.badges.find({'student_id': sid}, {'_id': 0}))
            for s in scores:
                s['percentage'] = min(100, s.get('percentage', 0))
                if 'played_at' in s and hasattr(s['played_at'], 'isoformat'):
                    s['played_at'] = s['played_at'].isoformat()
            age = profile.get('age_group', '6-9')
            profile['age_group']  = {'3-5': '3-6', '6-8': '6-9'}.get(age, age)
            profile['user_id']    = sid
            profile['first_name'] = child.first_name
            profile['last_name']  = child.last_name
            for key, val in list(profile.items()):
                if hasattr(val, 'isoformat'): profile[key] = val.isoformat()
            children.append({'profile': profile, 'scores': scores, 'badges': badges})
        except User.DoesNotExist:
            pass
    return Response({'children': children})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_users_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    db    = get_db()
    users = []
    for u in User.objects.all().order_by('-date_joined'):
        profile = {}
        if u.role == 'student':
            raw = db.student_profiles.find_one({'user_id': str(u.id)}, {'_id': 0}) or {}
            age = raw.get('age_group', '6-9')
            raw['age_group'] = {'3-5': '3-6', '6-8': '6-9'}.get(age, age)
            profile = raw
        elif u.role == 'teacher':
            profile = db.teacher_profiles.find_one({'user_id': str(u.id)}, {'_id': 0}) or {}
        elif u.role == 'parent':
            profile = db.parent_profiles.find_one({'user_id': str(u.id)}, {'_id': 0}) or {}
        for key, val in list(profile.items()):
            if hasattr(val, 'isoformat'): profile[key] = val.isoformat()
        users.append({
            'id': u.id, 'email': u.email, 'username': u.username,
            'first_name': u.first_name, 'last_name': u.last_name,
            'role': u.role, 'is_active': u.is_active,
            'date_joined': u.date_joined.isoformat(), 'profile': profile,
        })
    return Response({'users': users})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_classes_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    db      = get_db()
    classes = list(db.classes.find({}, {'_id': 0}))
    for cls in classes:
        if 'created_at' in cls and hasattr(cls['created_at'], 'isoformat'):
            cls['created_at'] = cls['created_at'].isoformat()
    return Response({'classes': classes})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    user_id = request.data.get('user_id')
    active  = request.data.get('active', True)
    try:
        target = User.objects.get(id=user_id)
        target.is_active = active
        target.save()
        return Response({'user_id': user_id, 'is_active': active, 'message': f'User {"activated" if active else "deactivated"}!'})
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_class_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    class_code = request.data.get('class_code', '').strip()
    active     = request.data.get('active', True)
    db  = get_db()
    if not db.classes.find_one({'class_code': class_code}):
        return Response({'error': 'Class not found.'}, status=404)
    db.classes.update_one({'class_code': class_code}, {'$set': {'active': active}})
    return Response({'class_code': class_code, 'active': active, 'message': f'Class {"activated" if active else "deactivated"}!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def platform_stats_view(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    db    = get_db()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_students = User.objects.filter(role='student', is_active=True).count()
    total_teachers = User.objects.filter(role='teacher', is_active=True).count()
    total_parents  = User.objects.filter(role='parent',  is_active=True).count()
    total_admins   = User.objects.filter(role='admin',   is_active=True).count()
    active_users   = User.objects.filter(is_active=True).count()
    games_today    = db.game_scores.count_documents({'played_at': {'$gte': today}})
    total_badges   = db.badges.count_documents({})
    total_classes  = db.classes.count_documents({})
    today_scores   = list(db.game_scores.find(
        {'played_at': {'$gte': today}},
        {'_id': 0, 'student_id': 1, 'game_id': 1, 'percentage': 1, 'played_at': 1}
    ).limit(200))
    for s in today_scores:
        s['percentage'] = min(100, s.get('percentage', 0))
        if 'played_at' in s and hasattr(s['played_at'], 'isoformat'):
            s['played_at'] = s['played_at'].isoformat()
    return Response({
        'total_students': total_students, 'total_teachers': total_teachers,
        'total_parents': total_parents,   'total_admins': total_admins,
        'active_users': active_users,     'games_today': games_today,
        'total_badges': total_badges,     'total_classes': total_classes,
        'today_scores': today_scores,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return JsonResponse({"status": "ok", "message": "FunLearn AI backend is running"})