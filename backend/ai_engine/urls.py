# ai_engine/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('game-feedback/',   views.game_feedback_view,         name='game-feedback'),
    path('difficulty/',      views.difficulty_prediction_view, name='difficulty'),
    path('train-model/',     views.train_difficulty_model_view, name='train-model'),
    path('progress-report/', views.progress_report_view,       name='progress-report'),
    path('struggling/',      views.struggling_students_view,   name='struggling'),
]