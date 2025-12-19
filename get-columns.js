const MONDAY_API_TOKEN = eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU5OTY3NzY0NSwiYWFpIjoxMSwidWlkIjo5NzU1MjE2OCwiaWFkIjoiMjAyNS0xMi0xOVQxNDo1NTo1MC4zOTZaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MzI5ODM5NjcsInJnbiI6ImV1YzEifQ.g-kM15-KL8LtXmzl0cIDPSvR9JrQXPXaSTzrs7QHfIc;
const MONDAY_BOARD_ID = 5089205737;

async function getColumns() {
  const query = {
    query: `query {
      boards(ids: [${MONDAY_BOARD_ID}]) {
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
  console.log('Your columns:');
  console.log(JSON.stringify(data.data.boards[0].columns, null, 2));
}

getColumns();
