export default async function handler(req, res) {
  const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
  const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

  try {
    const query = {
      query: `query {
        boards(ids: [${MONDAY_BOARD_ID}]) {
          name
          columns {
            id
            title
            type
          }
        }
      }`
    };

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_TOKEN
      },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    
    return res.status(200).json({
      boardName: data.data.boards[0].name,
      columns: data.data.boards[0].columns
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## Then:

1. Push this to GitHub
2. Wait for Vercel to deploy (30 seconds)
3. Visit this URL in your browser:
```
   https://monday-telegram-7vthzj6um-shomis-projects-72e3d859.vercel.app/api/get-columns
