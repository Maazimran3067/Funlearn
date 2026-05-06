from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def ping(request):
    return JsonResponse({"status": "awake"})

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('ping/',             ping),
    path('api/users/',        include('users.urls')),
    path('api/games/',        include('games.urls')),
    path('api/gamification/', include('gamification.urls')),
    path('api/ai/',           include('ai_engine.urls')),
]