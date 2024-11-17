import { useState, useEffect, useRef } from 'react';
import Tesseract from 'tesseract.js';

type LeaderboardScoreType = {
  id: number;
  username: string;
  score: number;
};

type Stroke = { x: number; y: number }[];

const App: React.FC = () => {
  const [highScores, setHighScores] = useState<LeaderboardScoreType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const wordStr = 'the quick brown fox jumped over the lazy dog';
  const words = wordStr.split(' ');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const addScoreToLeaderboard = async () => {
    let username;
    while (!username || username.length !== 3) {
      username = prompt(
        'enter your 3-letter username for the public leaderboard'
      );
      if (!username || username.length !== 3) {
        alert('username must be exactly 3 letters');
      }
    }

    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, score: wpm }),
    });

    if (response.ok) {
      fetchHighScores();
    } else {
      console.error('error adding score');
    }
  };

  useEffect(() => {
    if (currentWordIndex === 0 && startTime === null) {
      setStartTime(Date.now());
    }
  }, [currentWordIndex, startTime]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const startX = e.nativeEvent.offsetX;
    const startY = e.nativeEvent.offsetY;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    setIsDrawing(true);
    setStrokes((prevStrokes) => [...prevStrokes, [{ x: startX, y: startY }]]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokes((prevStrokes) => {
      const updatedStrokes = [...prevStrokes];
      updatedStrokes[updatedStrokes.length - 1].push({ x, y });
      return updatedStrokes;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    recognizeText();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const startX = touch.clientX - rect.left;
    const startY = touch.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    setIsDrawing(true);
    setStrokes((prevStrokes) => [...prevStrokes, [{ x: startX, y: startY }]]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    setStrokes((prevStrokes) => {
      const updatedStrokes = [...prevStrokes];
      updatedStrokes[updatedStrokes.length - 1].push({ x, y });
      return updatedStrokes;
    });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent page scrolling
    setIsDrawing(false);
    recognizeText();
  };

  const recognizeText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        Tesseract.recognize(blob, 'eng', {
          logger: () => {},
          // presets: 'fast',
        }).then(({ data: { text } }) => {
          const cleanedText = text.trim().toLowerCase();
          setRecognizedText(cleanedText);
          checkWordMatch(cleanedText);
        });
      }
    });
  };

  const checkWordMatch = (text: string) => {
    const targetWord = words[currentWordIndex];
    if (text === targetWord) {
      proceedToNextWord();
    }
  };

  const proceedToNextWord = () => {
    setCurrentWordIndex((prevIndex) => prevIndex + 1);
    clearCanvas();
    if (currentWordIndex + 1 === words.length) {
      calculateOverallWPM();
    }
  };

  const calculateOverallWPM = () => {
    if (!startTime) return;

    const totalTimeInMinutes = (Date.now() - startTime) / 1000 / 60;
    const wordsPerMinute = Math.round(words.length / totalTimeInMinutes);

    setWpm(wordsPerMinute);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setRecognizedText('');
    setStrokes([]);
  };

  const undoLastStroke = () => {
    setStrokes((prevStrokes) => {
      const updatedStrokes = [...prevStrokes];
      updatedStrokes.pop();
      redrawCanvas(updatedStrokes);
      return updatedStrokes;
    });
  };

  const redrawCanvas = (strokesToDraw: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesToDraw.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  };

  return (
    <div>
      <h1>WWPM</h1>
      <div>
        <p>
          Draw the word: <strong>{words[currentWordIndex]}</strong>
        </p>
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          style={{ border: '1px solid black' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <p>Recognized Text: {recognizedText}</p>
        <h3>
          Progress: {currentWordIndex}/{words.length}
        </h3>
        {currentWordIndex === words.length && <h2>Your WWPM: {wpm}</h2>}
        <div style={{ marginTop: '10px' }}>
          <button onClick={undoLastStroke} disabled={strokes.length === 0}>
            Undo Last Stroke
          </button>
          <button onClick={clearCanvas} style={{ marginLeft: '5px' }}>
            Clear
          </button>
          {currentWordIndex === words.length && (
            <button
              onClick={addScoreToLeaderboard}
              style={{ marginLeft: '5px' }}
            >
              Add to Leaderboard
            </button>
          )}
        </div>
      </div>
      <div>
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
    </div>
  );
};

export default App;
