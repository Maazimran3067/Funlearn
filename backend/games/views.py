from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    get_all_games,
    save_game_score,
    get_student_scores,
    save_stage_progress,
    get_stage_progress,
)
from users.models import get_db
from datetime import datetime


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def games_list_view(request):
    """Return only active games."""
    games = [g for g in get_all_games() if g.get('active', True)]
    return Response({'games': games})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_score_view(request):
    """Save a game score."""
    result = save_game_score(
        str(request.user.id),
        request.data.get('game_id', ''),
        request.data.get('score', 0),
        request.data.get('max_score', 10),
        request.data.get('time_taken', 0),
        request.data.get('difficulty_level', 1),
        request.data.get('ai_data', {}),
    )
    return Response({'message': 'Score saved!', **result})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_scores_view(request):
    """Return all scores for logged-in student."""
    return Response({'scores': get_student_scores(str(request.user.id))})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stage_progress_view(request):
    """Get unlocked stages for a game."""
    game_id = request.query_params.get('game_id', '').strip()
    if not game_id:
        return Response({'error': 'game_id is required.'}, status=400)
    stages = get_stage_progress(str(request.user.id), game_id)
    return Response({'game_id': game_id, 'unlocked_stages': stages})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_stage_progress_view(request):
    """Save unlocked stages — backend merges, never shrinks."""
    game_id         = request.data.get('game_id', '').strip()
    unlocked_stages = request.data.get('unlocked_stages', [0])
    if not game_id:
        return Response({'error': 'game_id is required.'}, status=400)
    merged = save_stage_progress(str(request.user.id), game_id, unlocked_stages)
    return Response({'message': 'Stage progress saved!', 'unlocked_stages': merged})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_games_admin_view(request):
    """All games including inactive — admin only."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)
    return Response({'games': get_all_games()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_game_view(request):
    """Toggle a game active/inactive — admin only."""
    if request.user.role != 'admin':
        return Response({'error': 'Admin only.'}, status=403)

    game_id = request.data.get('game_id', '').strip()
    if not game_id:
        return Response({'error': 'game_id is required.'}, status=400)

    db   = get_db()
    game = db.games.find_one({'game_id': game_id})

    if not game:
        db.games.insert_one({'game_id': game_id, 'active': False})
        return Response({'game_id': game_id, 'active': False})

    new_status = not game.get('active', True)
    db.games.update_one({'game_id': game_id}, {'$set': {'active': new_status}})
    return Response({'game_id': game_id, 'active': new_status})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_today_view(request):
    """Count and list students in a class who played today."""
    class_code = request.query_params.get('class_code', '').strip()
    if not class_code:
        return Response({'active_today': 0, 'active_student_ids': []})

    db    = get_db()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    students    = list(db.student_profiles.find({'class_code': class_code}, {'_id': 0, 'user_id': 1}))
    student_ids = [s['user_id'] for s in students]

    if not student_ids:
        return Response({'active_today': 0, 'active_student_ids': []})

    active_ids = db.game_scores.distinct(
        'student_id',
        {'student_id': {'$in': student_ids}, 'played_at': {'$gte': today}}
    )

    return Response({
        'active_today':       len(active_ids),
        'active_student_ids': list(active_ids),
    })