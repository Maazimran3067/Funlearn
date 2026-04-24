# gamification/models.py
# This handles badges — checking if a student earned one
# and saving it to MongoDB.

from users.models import get_db
from datetime import datetime


# ------------------------------------------------------------------
# BADGE RULES
# This list defines all possible badges in FunLearn AI.
# Each badge has:
#   - id: unique name
#   - name: display name shown to the kid
#   - icon: emoji shown on screen
#   - description: what they did to earn it
#   - check: a function that returns True if they earned it
# ------------------------------------------------------------------
BADGE_RULES = [
    {
        'id': 'first_game',
        'name': 'First Game!',
        'icon': '🎮',
        'description': 'Played your very first game',
        # They earn this after playing just 1 game
        'check': lambda scores: len(scores) >= 1,
    },
    {
        'id': 'ten_games',
        'name': 'Game Explorer',
        'icon': '🚀',
        'description': 'Played 10 games',
        'check': lambda scores: len(scores) >= 10,
    },
    {
        'id': 'high_scorer',
        'name': 'Star Player',
        'icon': '⭐',
        'description': 'Scored above 80% in any game',
        # Check if any single score is above 80%
        'check': lambda scores: any(s['percentage'] >= 80 for s in scores),
    },
    {
        'id': 'perfect_score',
        'name': 'Perfect!',
        'icon': '💯',
        'description': 'Got a perfect 100% score',
        'check': lambda scores: any(s['percentage'] == 100 for s in scores),
    },
    {
        'id': 'five_stars',
        'name': 'Star Collector',
        'icon': '🌟',
        'description': 'Collected 5 total stars',
        # This checks total stars from profile, handled separately
        'check': lambda scores: False,  # Handled in check_and_award_badges
    },
]


def check_and_award_badges(student_id):
    """
    Check if a student has earned any new badges.
    This runs every time a student submits a score.
    Returns a list of any NEW badges they just earned.
    """
    db = get_db()
    new_badges = []

    # Get all of this student's scores from MongoDB
    all_scores = list(db.game_scores.find(
        {'student_id': str(student_id)}
    ))

    # Get their current profile (for total stars check)
    profile = db.student_profiles.find_one(
        {'user_id': str(student_id)}
    )

    # Get list of badge IDs they already have
    # So we don't award the same badge twice
    existing_badges = db.badges.find(
        {'student_id': str(student_id)}
    )
    already_earned = set(b['badge_id'] for b in existing_badges)

    # Check each badge rule
    for badge in BADGE_RULES:
        # Skip if they already have this badge
        if badge['id'] in already_earned:
            continue

        # Special check for star collector badge
        if badge['id'] == 'five_stars':
            if profile and profile.get('total_stars', 0) >= 5:
                earned = True
            else:
                earned = False
        else:
            # Run the badge's check function
            earned = badge['check'](all_scores)

        if earned:
            # Save the new badge to MongoDB
            db.badges.insert_one({
                'student_id': str(student_id),
                'badge_id': badge['id'],
                'badge_name': badge['name'],
                'badge_icon': badge['icon'],
                'description': badge['description'],
                'earned_at': datetime.utcnow(),
            })

            # Add to our return list so frontend can show animation
            new_badges.append({
                'badge_id': badge['id'],
                'badge_name': badge['name'],
                'badge_icon': badge['icon'],
                'description': badge['description'],
            })

    return new_badges


def get_student_badges(student_id):
    """Get all badges earned by a student."""
    db = get_db()
    badges = []
    for badge in db.badges.find({'student_id': str(student_id)}):
        badge['_id'] = str(badge['_id'])
        badge['earned_at'] = str(badge['earned_at'])
        badges.append(badge)
    return badges