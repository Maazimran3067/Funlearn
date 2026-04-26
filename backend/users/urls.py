from django.urls import path
from . import views

urlpatterns = [
    path('register/',        views.register_view,        name='register'),
    path('login/',           views.login_view,           name='login'),
    path('profile/',         views.profile_view,         name='profile'),
    path('update-profile/',  views.update_profile_view,  name='update-profile'),
    path('change-password/', views.change_password_view, name='change-password'),

    path('send-otp/',        views.send_otp_view,        name='send-otp'),
    path('verify-otp/',      views.verify_otp_view,      name='verify-otp'),

    path('check-class-code/',                views.check_class_code_view, name='check-class-code'),
    path('join-class/',                      views.join_class_view,       name='join-class'),
    path('create-class/',                    views.create_class_view,     name='create-class'),
    path('my-classes/',                      views.my_classes_view,       name='my-classes'),
    path('class-detail/<str:class_code>/',   views.class_detail_view,     name='class-detail'),
    path('student-detail/',                  views.student_detail_view,   name='student-detail'),

    path('my-children/',     views.my_children_view,     name='my-children'),

    path('all-users/',       views.all_users_view,       name='all-users'),
    path('all-classes/',     views.all_classes_view,     name='all-classes'),
    path('toggle-user/',     views.toggle_user_view,     name='toggle-user'),
    path('toggle-class/',    views.toggle_class_view,    name='toggle-class'),
    path('platform-stats/',  views.platform_stats_view,  name='platform-stats'),
]