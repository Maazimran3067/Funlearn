from users.models import get_db
from datetime import datetime


def get_all_games():
    """Return all games. Seeds defaults if DB is empty."""
    db    = get_db()
    games = list(db.games.find({}, {'_id': 0}))

    if not games:
        default_games = [
            {'game_id':'alphabet','name':'Alphabet Adventure','emoji':'🔤','age_group':'3-6', 'active':True,'description':'Say the alphabet letters aloud!'},
            {'game_id':'colors',  'name':'Color Explorer',    'emoji':'🎨','age_group':'3-6', 'active':True,'description':'Say the color name aloud!'},
            {'game_id':'shapes',  'name':'Shape Sorter',      'emoji':'🔵','age_group':'3-6', 'active':True,'description':'Name the shapes correctly!'},
            {'game_id':'animals', 'name':'Animal Kingdom',    'emoji':'🐾','age_group':'6-9', 'active':True,'description':'Identify animals and their sounds!'},
            {'game_id':'counting','name':'Counting Stars',    'emoji':'⭐','age_group':'6-9', 'active':True,'description':'Count stars before time runs out!'},
            {'game_id':'words',   'name':'Word Builder',      'emoji':'📝','age_group':'6-9', 'active':True,'description':'Build words from scrambled letters!'},
            {'game_id':'math',    'name':'Math Challenge',    'emoji':'➕','age_group':'9-12','active':True,'description':'Solve maths problems against the clock!'},
            {'game_id':'spelling','name':'Spell It Right',    'emoji':'✏️','age_group':'9-12','active':True,'description':'Spell difficult words from memory!'},
            {'game_id':'memory',  'name':'Memory Flip',       'emoji':'🃏','age_group':'9-12','active':True,'description':'Match all card pairs before time runs out!'},
        ]
        db.games.insert_many(default_games)
        return default_games

    return games


def save_game_score(student_id, game_id, score, max_score, time_taken, difficulty_level, ai_data=None):
    """Save a game score and update student profile stars."""
    db         = get_db()
    percentage = round((score / max_score) * 100, 1) if max_score > 0 else 0
    percentage = min(100.0, percentage)
    stars      = 3 if percentage >= 80 else 2 if percentage >= 50 else 1 if percentage >= 30 else 0

    db.game_scores.insert_one({
        'student_id':       student_id,
        'game_id':          game_id,
        'score':            score,
        'max_score':        max_score,
        'percentage':       percentage,
        'stars':            stars,
        'time_taken':       time_taken,
        'difficulty_level': difficulty_level,
        'ai_data':          ai_data or {},
        'played_at':        datetime.utcnow(),
    })

    db.student_profiles.update_one(
        {'user_id': student_id},
        {'$inc': {'total_stars': stars}, '$set': {'last_played': datetime.utcnow()}}
    )

    try:
        from gamification.models import check_and_award_badges
        check_and_award_badges(student_id)
    except Exception:
        pass

    return {'percentage': percentage, 'stars': stars}


def get_student_scores(student_id, limit=100):
    """Return most recent scores for a student."""
    db = get_db()
    scores = list(
        db.game_scores.find(
            {'student_id': student_id},
            {'_id': 0}
        ).sort('played_at', -1).limit(limit)
    )
    for s in scores:
        s['percentage'] = min(100, s.get('percentage', 0))
        if 'played_at' in s and hasattr(s['played_at'], 'isoformat'):
            s['played_at'] = s['played_at'].isoformat()
    return scores


def save_stage_progress(student_id, game_id, unlocked_stages):
    """Save unlocked stages — only ever expands, never shrinks."""
    db       = get_db()
    existing = db.stage_progress.find_one({'student_id': student_id, 'game_id': game_id})

    if existing:
        merged = list(set(existing.get('unlocked_stages', [0]) + unlocked_stages))
        merged.sort()
        db.stage_progress.update_one(
            {'student_id': student_id, 'game_id': game_id},
            {'$set': {'unlocked_stages': merged, 'updated_at': datetime.utcnow()}}
        )
        return merged
    else:
        stages = sorted(list(set(unlocked_stages)))
        db.stage_progress.insert_one({
            'student_id':      student_id,
            'game_id':         game_id,
            'unlocked_stages': stages,
            'updated_at':      datetime.utcnow(),
        })
        return stages


def get_stage_progress(student_id, game_id):
    """Return unlocked stages for a student-game pair."""
    db     = get_db()
    record = db.stage_progress.find_one(
        {'student_id': student_id, 'game_id': game_id},
        {'_id': 0}
    )
    if record:
        return sorted(record.get('unlocked_stages', [0]))
    return [0]