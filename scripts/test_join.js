(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: '1ACF4817' }),
    })
    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:', text)
  } catch (e) {
    console.error('Fetch error:', e)
  }
})()
