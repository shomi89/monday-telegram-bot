export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    // Handle callback queries (button clicks)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const data = callbackQuery.data;
      const messageId = callbackQuery.message.message_id;
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const userName = callbackQuery.from.first_name;

      // Parse the vote
      const [action, voteType, itemId] = data.split('_');

      if (action === 'vote') {
        let voteText = '';
        let emoji = '';
        
        if (voteType === 'reachout') {
          voteText = 'Reach out';
          emoji = '📞';
        } else if (voteType === 'pass') {
          voteText = 'Pass';
          emoji = '❌';
        } else if (voteType === 'already') {
          voteText = 'Already Reached Out';
          emoji = '✅';
        }

        // Answer the callback query (removes loading state)
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: `You voted: ${emoji} ${voteText}`,
            show_alert: false
          })
        });

        // Log the vote (you can see this in Vercel logs)
        console.log(`Vote recorded: User ${userName} (${userId}) voted "${voteText}" for item ${itemId}`);
      }
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }
}
