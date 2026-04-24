# games/serializers.py
# Serializers validate incoming data from the API requests.

from rest_framework import serializers


# ------------------------------------------------------------------
# SCORE SUBMIT SERIALIZER
# Validates the data when a student submits a score.
# All fields are required.
# ------------------------------------------------------------------
class ScoreSubmitSerializer(serializers.Serializer):

    # The ID of the game they just played
    game_id = serializers.CharField(max_length=100)

    # Their actual score (e.g. 8 out of 10)
    score = serializers.IntegerField(min_value=0)

    # The maximum possible score for this game
    max_score = serializers.IntegerField(min_value=1)

    # How long they took in seconds
    time_taken = serializers.IntegerField(min_value=0)

    # Difficulty level 1-5
    difficulty_level = serializers.IntegerField(min_value=1, max_value=5)