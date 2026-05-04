from datetime import datetime
from users.models import get_db


def get_all_games():
    return [
        # ── Age 3–6 ──────────────────────────────────
        {"game_id": "colors",       "name": "Color Explorer",    "active": True,  "age_group": "3-6"},
        {"game_id": "shapes",       "name": "Shape Sorter",      "active": True,  "age_group": "3-6"},
        {"game_id": "alphabet",     "name": "Alphabet Adventure","active": True,  "age_group": "3-6"},
        {"game_id": "numbers",      "name": "Number Buddy",      "active": True,  "age_group": "3-6"},
        {"game_id": "animalsounds", "name": "Animal Sounds",     "active": True,  "age_group": "3-6"},
        # ── Age 6–9 ──────────────────────────────────
        {"game_id": "animals",      "name": "Animal Kingdom",    "active": True,  "age_group": "6-9"},
        {"game_id": "counting",     "name": "Counting Stars",    "active": True,  "age_group": "6-9"},
        {"game_id": "words",        "name": "Word Builder",      "active": True,  "age_group": "6-9"},
        {"game_id": "sentences",    "name": "Sentence Maker",    "active": True,  "age_group": "6-9"},
        {"game_id": "patterns",     "name": "Pattern Quest",     "active": True,  "age_group": "6-9"},
        # ── Age 9–12 ─────────────────────────────────
        {"game_id": "math",         "name": "Math Challenge",    "active": True,  "age_group": "9-12"},
        {"game_id": "spelling",     "name": "Spell It Right",    "active": True,  "age_group": "9-12"},
        {"game_id": "memory",       "name": "Memory Flip",       "active": True,  "age_group": "9-12"},
        {"game_id": "logicgrid",    "name": "Logic Grid",        "active": True,  "age_group": "9-12"},
        {"game_id": "speedeq",      "name": "Speed Equations",   "active": True,  "age_group": "9-12"},
    ]


def seed_games():
    db = get_db()
    games_col = db["games"]
    for game in get_all_games():
        existing = games_col.find_one({"game_id": game["game_id"]})
        if not existing:
            games_col.insert_one(game)


def get_active_games():
    db = get_db()
    games = list(db["games"].find({"active": True}, {"_id": 0}))
    if not games:
        seed_games()
        games = list(db["games"].find({"active": True}, {"_id": 0}))
    return games


def get_all_games_admin():
    db = get_db()
    games = list(db["games"].find({}, {"_id": 0}))
    if not games:
        seed_games()
        games = list(db["games"].find({}, {"_id": 0}))
    return games


def toggle_game_active(game_id, active):
    db = get_db()
    db["games"].update_one(
        {"game_id": game_id},
        {"$set": {"active": active}},
        upsert=True
    )


def save_game_score(student_id, game_id, score, max_score, percentage,
                    stars, difficulty_level=1, time_taken=0):
    db = get_db()
    db["game_scores"].insert_one({
        "student_id":       str(student_id),
        "game_id":          game_id,
        "score":            score,
        "max_score":        max_score,
        "percentage":       min(100.0, float(percentage)),
        "stars":            stars,
        "difficulty_level": difficulty_level,
        "time_taken":       time_taken,
        "played_at":        datetime.utcnow().isoformat(),
    })


def get_student_scores(student_id, limit=50):
    db = get_db()
    return list(
        db["game_scores"]
        .find({"student_id": str(student_id)}, {"_id": 0})
        .sort("played_at", -1)
        .limit(limit)
    )


def get_stage_progress(student_id, game_id):
    db = get_db()
    doc = db["stage_progress"].find_one(
        {"student_id": str(student_id), "game_id": game_id},
        {"_id": 0}
    )
    return doc.get("unlocked_stages", [0]) if doc else [0]


def save_stage_progress(student_id, game_id, newly_unlocked_stages):
    db = get_db()
    existing = get_stage_progress(student_id, game_id)
    merged = sorted(list(set(existing + newly_unlocked_stages)))
    db["stage_progress"].update_one(
        {"student_id": str(student_id), "game_id": game_id},
        {"$set": {"unlocked_stages": merged, "updated_at": datetime.utcnow().isoformat()}},
        upsert=True
    )
    return merged


def get_active_students_today(class_student_ids):
    db = get_db()
    today = datetime.utcnow().strftime("%Y-%m-%d")
    active_ids = db["game_scores"].distinct(
        "student_id",
        {
            "student_id": {"$in": [str(sid) for sid in class_student_ids]},
            "played_at":  {"$gte": today}
        }
    )
    return active_ids