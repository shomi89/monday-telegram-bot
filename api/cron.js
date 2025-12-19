// api/cron.js
export default async function handler(req, res) {
  // Verify this is a cron request (Vercel cron jobs send this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const mondayToken = process.env.MONDAY_API_TOKEN;
    const boardId = process.env.MONDAY_BOARD_ID;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Get items from Monday.com created in the last 10 minutes
    // (checking 10 minutes to avoid missing items if cron is delayed)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const query = `
      query {
        boards(ids: [${boardId}]) {
          items_page(limit: 10, query_params: {order_by: {column_id: "creation_log", direction: desc}}) {
            items {
              id
              name
              created_at
            }
          }
        }
      }
    `;

    // Query Monday.com
    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': mondayToken,
        'API-Version': '2024-10'
      },
      body: JSON.stringify({ query })
    });

    const mondayData = await mondayResponse.json();

    if (mondayData.errors) {
      console.error('Monday API Error:', mondayData.errors);
      return res.status(500).json({ error: 'Monday API error', details: mondayData.errors });
    }

    const items = mondayData.data?.boards?.[0]?.items_page?.items || [];
    
    // Filter items created in the last 6 minutes (with 1 minute buffer)
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    const newItems = items.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt > sixMinutesAgo;
    });

    console.log(`Found ${newItems.length} new items`);

    // Send Telegram notification for each new item
    for (const item of newItems) {
      const message = `🔔 *New Item Added to Monday.com*\n\n` +
                     `📝 Item: ${item.name}\n` +
                     `🔗 [View Item](https://milosm2306s-team.monday.com/boards/${boardId}/pulses/${item.id})\n` +
                     `🕒 Created: ${new Date(item.created_at).toLocaleString()}`;
      
      const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      
      await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        })
      });
      
      console.log(`Notification sent for item: ${item.name}`);
    }

    return res.status(200).json({ 
      success: true, 
      itemsChecked: items.length,
      newItemsFound: newItems.length 
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
