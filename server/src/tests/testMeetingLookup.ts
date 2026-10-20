async function run() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'david.provider@example.com', password: 'Password123!' })
  });
  const { token } = await loginRes.json() as any;
  console.log('Token ok:', !!token);

  const bookingsRes = await fetch('http://localhost:5000/api/bookings?role=provider', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { bookings } = await bookingsRes.json() as any;
  console.log('Provider bookings count:', bookings?.length);

  if (bookings && bookings.length > 0) {
    const b = bookings[0];
    console.log('Testing reference lookup for:', b.bookingReference);

    const detailRes = await fetch(`http://localhost:5000/api/bookings/${b.bookingReference.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const detail = await detailRes.json() as any;
    console.log('Lookup by lowercase ref status:', detailRes.status, 'success:', detail.success, 'title:', detail.booking?.skillListing?.title);
  }
}

run().catch(console.error);
