# ai_engine/views.py
# ALL AI features — 100% free, no external API needed
# Uses: Scikit-learn, NumPy, and smart Python logic

import json
import numpy as np
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import get_db
from datetime import datetime


# ------------------------------------------------------------------
# SMART FEEDBACK GENERATOR
# This generates personalized feedback using Python logic.
# It reads the actual wrong answers and creates specific messages.
# For your FYP this is called "Rule-Based AI" or
# "Knowledge-Based System" — a classic AI technique.
# ------------------------------------------------------------------
def generate_smart_feedback(name, game_id, percentage, ai_data, age_group):
    """
    Generates personalized feedback based on actual performance data.
    Uses if-else logic with specific data to create unique messages
    for each student — not generic templates.
    """

    # Base performance message
    if percentage >= 90:
        base = f"🏆 Outstanding work, {name}! You scored {percentage}% — absolutely brilliant!"
    elif percentage >= 80:
        base = f"🌟 Excellent job, {name}! {percentage}% is a fantastic score!"
    elif percentage >= 70:
        base = f"👍 Really good effort, {name}! {percentage}% shows you are learning well!"
    elif percentage >= 60:
        base = f"💪 Good try, {name}! You scored {percentage}% — keep practising!"
    elif percentage >= 50:
        base = f"📚 Keep going, {name}! {percentage}% — you are halfway there!"
    else:
        base = f"🚀 Don't give up, {name}! {percentage}% — every expert starts as a beginner!"

    # Game specific insight using actual wrong answer data
    specific = ""

    if game_id == 'alphabet' and 'wrong_letters' in ai_data:
        wrong = ai_data['wrong_letters']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            count   = wrong[hardest]
            specific = f" The letter '{hardest}' was tricky for you ({count} time{'s' if count > 1 else ''}) — try writing it 5 times tonight!"
        else:
            specific = " You got all letters right — amazing alphabet skills! 🔤"

    elif game_id == 'colors' and 'wrong_colors' in ai_data:
        wrong = ai_data['wrong_colors']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            specific = f" The color {hardest} was tricky — look for {hardest} objects around your house to practise! 🎨"
        else:
            specific = " Perfect color knowledge! 🌈"

    elif game_id == 'shapes' and 'wrong_shapes' in ai_data:
        wrong = ai_data['wrong_shapes']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            specific = f" Try drawing a {hardest} shape to remember it better! 🔵"

    elif game_id == 'animals' and 'wrong_animals' in ai_data:
        wrong = ai_data['wrong_animals']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            specific = f" Look up the {hardest} in a book or video to learn more about it! 🐘"

    elif game_id == 'counting' and 'final_difficulty' in ai_data:
        level = ai_data['final_difficulty']
        if level >= 4:
            specific = " You reached advanced counting! Try counting backwards next! ⭐"
        elif level >= 2:
            specific = " Your counting is improving — try counting objects around the house! 🌟"
        else:
            specific = " Keep practising counting — use your fingers to help! ✋"

    elif game_id == 'words':
        specific = " Try making sentences with the words you learned today! 📝"

    elif game_id == 'math' and 'weak_operations' in ai_data:
        wrong = ai_data['weak_operations']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            op_names = {'+': 'addition', '-': 'subtraction', '×': 'multiplication'}
            op_name  = op_names.get(hardest, hardest)
            specific = f" Practise your {op_name} tables — write them out 3 times! ➕"

    elif game_id == 'spelling' and 'wrong_words' in ai_data:
        wrong = ai_data['wrong_words']
        if wrong:
            hardest = max(wrong, key=wrong.get)
            specific = f" Write the word '{hardest}' in a sentence to remember its spelling! ✏️"

    elif game_id == 'memory':
        if 'moves_taken' in ai_data:
            moves = ai_data['moves_taken']
            if moves < 15:
                specific = " Incredible memory — you used very few moves! 🧠"
            else:
                specific = " Try to remember where cards are after you flip them! 🃏"

    # Age group encouragement
    if age_group == '3-5':
        end = " You are doing amazing for your age! Keep it up! 🌈"
    elif age_group == '6-8':
        end = " You are becoming a real learning champion! 🚀"
    else:
        end = " Excellent academic effort — your hard work will pay off! 🎓"

    return base + specific + end


# ------------------------------------------------------------------
# ENDPOINT 1 — SMART GAME FEEDBACK
# URL: POST /api/ai/game-feedback/
# Called after every game ends to give personalized feedback
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def game_feedback_view(request):
    """
    Generates personalized feedback for a student after a game.
    Uses our smart feedback generator — no external API needed.
    This is Rule-Based AI / Knowledge-Based System.
    """
    game_id    = request.data.get('game_id',    '')
    score      = request.data.get('score',      0)
    max_score  = request.data.get('max_score',  10)
    percentage = request.data.get('percentage', 0)
    ai_data    = request.data.get('ai_data',    {})
    age_group  = request.data.get('age_group',  '6-8')
    first_name = request.user.first_name or 'Student'

    # Generate smart personalized feedback
    feedback_text = generate_smart_feedback(
        first_name, game_id, percentage, ai_data, age_group
    )

    # Save feedback to MongoDB so teachers can review it
    db = get_db()
    db.ai_feedback.insert_one({
        'student_id': str(request.user.id),
        'game_id':    game_id,
        'feedback':   feedback_text,
        'score':      score,
        'percentage': percentage,
        'ai_data':    ai_data,
        'created_at': datetime.utcnow(),
    })

    return Response({
        'feedback': feedback_text,
        'source':   'rule_based_ai'
    })


# ------------------------------------------------------------------
# ENDPOINT 2 — DIFFICULTY PREDICTION
# URL: GET /api/ai/difficulty/?game_id=alphabet
# Uses our trained Decision Tree OR rule-based fallback
# ------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def difficulty_prediction_view(request):
    """
    Predicts optimal difficulty level for a student on a game.
    Uses scikit-learn Decision Tree if trained, else rule-based logic.
    Both are valid AI approaches for an FYP.
    """
    game_id = request.query_params.get('game_id', 'alphabet')
    db      = get_db()

    # Get student's score history for this game
    scores = list(
        db.game_scores.find(
            {
                'student_id': str(request.user.id),
                'game_id':    game_id
            },
            {'_id': 0, 'percentage': 1, 'difficulty_level': 1}
        ).sort('played_at', -1).limit(10)
    )

    # Not enough data — start at level 1
    if len(scores) < 2:
        return Response({
            'difficulty': 1,
            'reason':     'Welcome! Starting at beginner level.',
            'avg_score':  0
        })

    # Calculate features
    percentages  = [s['percentage'] for s in scores]
    avg_score    = float(np.mean(percentages))
    last_score   = float(percentages[0])
    games_played = len(scores)
    trend        = float(percentages[0] - percentages[-1])

    # Try trained model first
    predicted = predict_with_model(avg_score, last_score, games_played, trend)

    return Response({
        'difficulty': predicted,
        'avg_score':  round(avg_score, 1),
        'last_score': last_score,
        'reason':     f"Based on your {games_played} games — average {avg_score:.0f}%"
    })


def predict_with_model(avg_score, last_score, games_played, trend):
    """Try trained model first, then rule-based fallback."""
    import os
    model_path = os.path.join(os.path.dirname(__file__), 'difficulty_model.pkl')

    try:
        import joblib
        if os.path.exists(model_path):
            model    = joblib.load(model_path)
            features = np.array([[avg_score, last_score, games_played, trend]])
            return int(model.predict(features)[0])
    except Exception:
        pass

    # Rule-based fallback — Zone of Proximal Development theory
    if avg_score >= 85 and last_score >= 80:
        return 5
    elif avg_score >= 70:
        return 4
    elif avg_score >= 55:
        return 3
    elif avg_score >= 40:
        return 2
    else:
        return 1


# ------------------------------------------------------------------
# ENDPOINT 3 — TRAIN THE DECISION TREE MODEL
# URL: POST /api/ai/train-model/
# Admin trains model on student data — THIS IS OUR OWN AI MODEL
# ------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_difficulty_model_view(request):
    """
    Trains a Decision Tree Classifier on student performance data.
    This creates our CUSTOM AI model trained on our own students.
    Admin runs this from the dashboard after enough data is collected.
    """
    if request.user.role != 'admin':
        return Response({'error': 'Admin access only.'}, status=403)

    try:
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
        import joblib
        import os

        db         = get_db()
        all_scores = list(db.game_scores.find(
            {},
            {'_id': 0, 'student_id': 1, 'game_id': 1,
             'percentage': 1, 'difficulty_level': 1}
        ))

        if len(all_scores) < 10:
            return Response({
                'message': f'Need at least 10 records. Have {len(all_scores)} so far. Keep playing!',
                'status':  'not_enough_data'
            })

        # Build feature matrix from student data
        X, y        = [], []
        student_ids = set(s['student_id'] for s in all_scores)

        for sid in student_ids:
            s_scores = [s for s in all_scores if s['student_id'] == sid]
            game_ids = set(s['game_id'] for s in s_scores)

            for gid in game_ids:
                g_scores = [s for s in s_scores if s['game_id'] == gid]
                if len(g_scores) < 2:
                    continue

                percs = [s['percentage'] for s in g_scores]
                avg   = float(np.mean(percs))
                last  = float(percs[-1])
                gp    = len(g_scores)
                tr    = float(percs[-1] - percs[0])

                # Label based on educational thresholds
                if avg >= 85:   label = 5
                elif avg >= 70: label = 4
                elif avg >= 55: label = 3
                elif avg >= 40: label = 2
                else:           label = 1

                X.append([avg, last, gp, tr])
                y.append(label)

        if len(X) < 5:
            return Response({
                'message': 'Not enough varied data yet.',
                'status':  'not_enough_data'
            })

        X_arr = np.array(X)
        y_arr = np.array(y)

        # Train Decision Tree
        X_train, X_test, y_train, y_test = train_test_split(
            X_arr, y_arr, test_size=0.2, random_state=42
        )

        model = DecisionTreeClassifier(max_depth=5, random_state=42)
        model.fit(X_train, y_train)

        accuracy = float(accuracy_score(y_test, model.predict(X_test)))

        # Save model
        model_path = os.path.join(os.path.dirname(__file__), 'difficulty_model.pkl')
        joblib.dump(model, model_path)

        # Log to MongoDB
        db.ai_models.insert_one({
            'model_name':    'difficulty_predictor_v1',
            'algorithm':     'Decision Tree Classifier',
            'accuracy':      accuracy,
            'training_size': len(X),
            'features':      ['avg_score', 'last_score', 'games_played', 'trend'],
            'trained_at':    datetime.utcnow(),
            'trained_by':    str(request.user.id),
        })

        return Response({
            'message':       'AI model trained successfully!',
            'algorithm':     'Decision Tree Classifier',
            'accuracy':      f"{accuracy * 100:.1f}%",
            'training_size': len(X),
            'status':        'success'
        })

    except ImportError:
        return Response({
            'error':  'Run: pip install scikit-learn joblib',
            'status': 'error'
        })
    except Exception as e:
        return Response({'error': str(e), 'status': 'error'})


# ------------------------------------------------------------------
# ENDPOINT 4 — PROGRESS REPORT for Parents and Teachers
# URL: GET /api/ai/progress-report/?student_id=XXX
# Generates a professional report using Learning Analytics
# ------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def progress_report_view(request):
    """
    Generates a detailed AI progress report using Learning Analytics.
    Analyzes trends, strengths, weaknesses from MongoDB data.
    This is the Learning Analytics AI technique.
    """
    # Support lookup by username (for parent dashboard) or student_id
    username   = request.query_params.get('username', '').strip()
    student_id = request.query_params.get('student_id', '').strip()
    if username:
        from django.contrib.auth import get_user_model
        Usr = get_user_model()
        try:
            child = Usr.objects.get(username__iexact=username, role='student')
            student_id = str(child.id)
        except Usr.DoesNotExist:
            return Response({'report': 'Student not found.', 'game_averages': {}})
    if not student_id:
        student_id = str(request.user.id)
    db      = get_db()
    profile = db.student_profiles.find_one(
        {'user_id': student_id}, {'_id': 0}
    )
    scores = list(
        db.game_scores.find(
            {'student_id': student_id}, {'_id': 0}
        ).sort('played_at', -1).limit(30)
    )

    if not profile or not scores:
        return Response({
            'report':        'Not enough data yet. Keep playing games!',
            'game_averages': {}
        })

    name      = profile.get('first_name', 'Student')
    age_group = profile.get('age_group',  '6-8')

    # Calculate game averages
    game_data = {}
    for s in scores:
        g = s['game_id']
        if g not in game_data:
            game_data[g] = []
        game_data[g].append(s['percentage'])

    game_averages = {
        g: round(sum(v) / len(v), 1)
        for g, v in game_data.items()
    }

    overall_avg  = round(sum(s['percentage'] for s in scores) / len(scores), 1)
    best_game    = max(game_averages, key=game_averages.get) if game_averages else None
    worst_game   = min(game_averages, key=game_averages.get) if game_averages else None

    # Weekly trend analysis
    week1 = [s['percentage'] for s in scores[:7]]
    week2 = [s['percentage'] for s in scores[7:14]]
    if week1 and week2:
        week1_avg    = sum(week1) / len(week1)
        week2_avg    = sum(week2) / len(week2)
        improvement  = round(week1_avg - week2_avg, 1)
        trend_text   = (
            f"improving by {improvement}% this week" if improvement > 0
            else f"needs more practice (down {abs(improvement)}% this week)"
        )
    else:
        trend_text = "just getting started"

    # Build the report
    report = f"""
{name} (Age Group {age_group}) — AI Learning Report

Overall Performance: {name} has played {len(scores)} games with an overall average of {overall_avg}%. They are {trend_text}.

Strengths: {name} performs best in {best_game} with an average of {game_averages.get(best_game, 0)}%. This shows strong understanding in this area.

Area for Improvement: {name} should focus more on {worst_game} (average {game_averages.get(worst_game, 0)}%). Additional practice here will significantly boost their overall performance.

Stars Earned: {profile.get('total_stars', 0)} total stars | Level: {profile.get('current_level', 1)}

Recommendation: Encourage {name} to play {worst_game} for 10 minutes daily. Celebrate their progress in {best_game} to keep motivation high!
""".strip()

    return Response({
        'report':        report,
        'game_averages': game_averages,
        'overall_avg':   overall_avg,
        'improvement':   trend_text,
    })


# ------------------------------------------------------------------
# ENDPOINT 5 — STRUGGLING STUDENTS ANALYSIS
# URL: GET /api/ai/struggling/?class_code=XXX
# AI scans class and flags students who need help
# ------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def struggling_students_view(request):
    """
    Scans all students in a class and uses anomaly detection
    to flag students whose performance is significantly below average.
    This is Anomaly Detection — a real AI/ML technique.
    """
    if request.user.role not in ['teacher', 'admin']:
        return Response({'error': 'Teachers only.'}, status=403)

    class_code = request.query_params.get('class_code', '')
    db         = get_db()

    # Get all students in this class
    students = list(db.student_profiles.find(
        {'class_code': class_code}, {'_id': 0}
    ))

    if not students:
        return Response({'struggling': [], 'class_avg': 0})

    # Calculate performance for each student
    student_stats = []
    for s in students:
        scores = list(db.game_scores.find(
            {'student_id': s['user_id']},
            {'_id': 0, 'percentage': 1, 'game_id': 1}
        ).limit(20))

        if not scores:
            continue

        avg   = sum(sc['percentage'] for sc in scores) / len(scores)
        games = len(scores)
        student_stats.append({
            'user_id':    s['user_id'],
            'first_name': s.get('first_name', ''),
            'last_name':  s.get('last_name', ''),
            'avg_score':  round(avg, 1),
            'games':      games,
        })

    if not student_stats:
        return Response({'struggling': [], 'class_avg': 0})

    # Calculate class average and standard deviation
    all_avgs   = [s['avg_score'] for s in student_stats]
    class_avg  = float(np.mean(all_avgs))
    class_std  = float(np.std(all_avgs)) if len(all_avgs) > 1 else 10

    # Flag students more than 1 standard deviation below average
    # This is statistical anomaly detection
    threshold   = class_avg - class_std
    struggling  = [
        s for s in student_stats
        if s['avg_score'] < threshold or s['avg_score'] < 40
    ]

    return Response({
        'struggling':  struggling,
        'class_avg':   round(class_avg, 1),
        'threshold':   round(threshold, 1),
        'total':       len(student_stats),
        'method':      'Statistical anomaly detection (1 SD below mean)'
    })