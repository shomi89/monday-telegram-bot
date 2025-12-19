// api/webhook.js
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    
    // Extract information from Monday.com webhook
    const event = webhookData.event;
    
    // Check if this is a new item creation event
    if (event && event.type === 'create_pulse') {
      const itemName = event.pulseName || 'New Item';
      const boardName = event.boardName || 'Your Board';
      const itemId = event.pulseId;
      const boardId = process.env.MONDAY_BOARD_ID;
      
      // Create the item URL
      const itemUrl = `https://milosm2306s-team.monday.com/boards/${boardId}/pulses/${itemId}`;
      
      // Create message for Telegram
      const message = `🔔 *New Item Added to Monday.com*\n\n` +
                     `📋 Board: ${boardName}\n` +
                     `📝 Item: ${itemName}\n` +
                     `🔗 [View Item](${itemUrl})`;
      
      // Send to Telegram
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
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
      
      console.log('Notification sent successfully');
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
