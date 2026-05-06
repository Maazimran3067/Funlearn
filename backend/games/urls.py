from django.urls import path
from . import views

urlpatterns = [
    path('',                views.games_list_view,         name='games-list'),
    path('submit-score/',   views.submit_score_view,       name='submit-score'),
    path('my-scores/',      views.my_scores_view,          name='my-scores'),
    path('stage-progress/', views.get_stage_progress_view, name='get-stage-progress'),
    path('save-stage/',     views.save_stage_progress_view,name='save-stage'),
    path('all/',            views.all_games_admin_view,    name='all-games-admin'),
    path('toggle/',         views.toggle_game_view,        name='toggle-game'),
    path('active-today/',   views.active_today_view,       name='active-today'),
]