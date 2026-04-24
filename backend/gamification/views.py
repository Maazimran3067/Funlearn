# gamification/views.py
# API views for badges and gamification features.

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import get_student_badges
from users.models import get_db


# ------------------------------------------------------------------
# GET MY BADGES
# Endpoint: GET /api/gamification/my-badges/
# Returns all badges the logged in student has earned.
# ------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_badges_view(request):
    """Get all badges for the logged in student."""
    badges = get_student_badges(request.user.id)
    return Response({
        'badges': badges,
        'total_badges': len(badges)
    })


# ------------------------------------------------------------------
# GET LEADERBOARD
# Endpoint: GET /api/gamification/leaderboard/
# Returns top 10 students by total stars.
# ------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_view(request):
    """Get top 10 students ranked by total stars."""
    db = get_db()

    # Find top 10 students sorted by total_stars descending
    top_students = list(
        db.student_profiles.find(
            {},
            {'_id': 0, 'first_name': 1, 'last_name': 1, 'total_stars': 1}
        )
        .sort('total_stars', -1)  # -1 = highest first
        .limit(10)
    )

    return Response({
        'leaderboard': top_students
    })