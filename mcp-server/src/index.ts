import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3001;

// Configuration Supabase
const SUPABASE_PROJECT_REF = 'vvmkbpkoccxpmfpxhacv';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bWticGtvY2N4cG1mcHhoYWN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc3NjYxMSwiZXhwIjoyMDcwMzUyNjExfQ.6FGd9yPjegn9RUIclQS96ehfiF83CM-oZsmOBugGi90';

app.get('/mcp', (req: Request, res: Response) => {
  res.json({ message: 'MCP Server is running!' });
});

// Endpoint pour lister les tables Supabase
app.get('/tables', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erreur lors de la récupération des tables:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tables' });
  }
});

// Endpoint pour récupérer le schéma de la base
app.get('/schema', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });
    
    const schema = await response.text();
    res.json({ schema });
  } catch (error) {
    console.error('Erreur lors de la récupération du schéma:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du schéma' });
  }
});

app.listen(port, () => {
  console.log(`MCP server listening on port ${port}`);
});
