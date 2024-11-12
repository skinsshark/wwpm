// pages/api/high-scores.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
}
