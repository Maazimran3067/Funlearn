# gamification/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # GET /api/gamification/my-badges/ → See my badges
    path('my-badges/', views.my_badges_view, name='my-badges'),

    # GET /api/gamification/leaderboard/ → See top students
    path('leaderboard/', views.leaderboard_view, name='leaderboard'),
]