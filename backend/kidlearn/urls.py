from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('api/users/',        include('users.urls')),
    path('api/games/',        include('games.urls')),
    path('api/gamification/', include('gamification.urls')),
    path('api/ai/',           include('ai_engine.urls')),
]