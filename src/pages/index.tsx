import { useState, useEffect } from 'react';

type LeaderboardScoreType = {
  id: number;
  username: string;
  score: number;
};

const App = () => {
  const [highScores, setHighScores] = useState<LeaderboardScoreType[]>([]);

  // top 20 scores
  const fetchHighScores = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data: LeaderboardScoreType[] = await response.json();
      setHighScores(data);
    } catch (error) {
      console.error('error fetching high scores:', error);
    }
  };

  useEffect(() => {
    fetchHighScores();
  }, []);

  return (
    <div>
      <h1>WWPM</h1>
      {highScores.length > 0 && (
        <>
          <h2>High Scores</h2>
          <ul>
            {highScores.map((entry: LeaderboardScoreType) => (
              <li key={entry.id}>
                {entry.username}: {entry.score}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default App;
