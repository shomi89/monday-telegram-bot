export default async function handler(req, res) {
  // Verify cron secret
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET || '';
  
  if (authHeader !== `Bearer ${cronSecret}` && req.query.secret !== cronSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const MONDAY_BOARD_ID = process.env.MONDAY_BOARD_ID;

  try {
    // Get items from Monday.com created in the last 6 minutes
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    
    const mondayQuery = {
      query: `query {
        boards(ids: [${MONDAY_BOARD_ID}]) {
          items_page(limit: 10) {
            items {
              id
              name
              created_at
            }
          }
        }
      }`
    };

    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': MONDAY_API_TOKEN
      },
      body: JSON.stringify(mondayQuery)
    });

    const mondayData = await mondayResponse.json();
    
    if (mondayData.errors) {
      console.error('Monday API Error:', mondayData.errors);
      return res.status(500).json({ error: 'Monday API error', details: mondayData.errors });
    }

    const items = mondayData.data?.boards?.[0]?.items_page?.items || [];
    const newItems = items.filter(item => new Date(item.created_at) > new Date(sixMinutesAgo));

    // Send Telegram notification for each new item
    for (const item of newItems) {
      const message = `🆕 New item added to Monday.com!\n\n📋 Name: ${item.name}\n🆔 ID: ${item.id}\n⏰ Created: ${new Date(item.created_at).toLocaleString()}`;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Checked for new items. Found ${newItems.length} new items.`,
      newItems: newItems.length 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
