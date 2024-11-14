import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // get leaderboard
    try {
      const { data, error } = await supabase
        .from('wwpm')
        .select('*')
        .order('score', { ascending: false })
        .limit(20);

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      console.error('error fetching scores:', error);
      res.status(500).json({ error: 'error fetching scores' });
    }
  } else if (req.method === 'POST') {
    // add high score
    const { username, score } = req.body;

    if (!username || !score) {
      return res.status(400).json({ error: 'username and score are required' });
    }

    try {
      const { data, error } = await supabase
        .from('wwpm')
        .insert([{ username, score }]);

      if (error) throw error;

      res.status(200).json({ message: 'score added successfully', data });
    } catch (error) {
      console.error('error adding score:', error);
      res.status(500).json({ error: 'error adding score' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
