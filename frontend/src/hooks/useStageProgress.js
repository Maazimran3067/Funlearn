// useStageProgress.js
// This hook loads stage progress from backend on mount
// and saves it back whenever stages are unlocked.
// This makes unlocks PERMANENT — persisted in MongoDB.

import { useState, useEffect, useCallback } from 'react';
import { getStageProgress, saveStageProgress } from '../services/api';

export default function useStageProgress(gameId) {
  const [unlockedStages, setUnlockedStages] = useState([0]);
  const [loaded,         setLoaded]         = useState(false);

  // Load from backend on mount
  useEffect(() => {
    if (!gameId) return;
    getStageProgress(gameId)
      .then(res => {
        const stages = res.data.unlocked_stages || [0];
        setUnlockedStages(stages);
      })
      .catch(() => setUnlockedStages([0]))
      .finally(() => setLoaded(true));
  }, [gameId]);

  // Call this when a stage is passed — it merges with existing
  const unlockStage = useCallback((newStageIndex) => {
    setUnlockedStages(prev => {
      const merged = [...new Set([...prev, newStageIndex])].sort((a, b) => a - b);
      // Save to backend — backend also merges, never shrinks
      saveStageProgress(gameId, merged).catch(() => {});
      return merged;
    });
  }, [gameId]);

  return { unlockedStages, unlockStage, loaded };
}