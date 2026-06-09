import fetch from 'node-fetch';

async function testApi() {
  try {
    const payload = {
      fullName: "",
      idPhotoUrl: "",
      visitorPhotoUrl: "",
      destinationIds: ["1"], // we will fetch a real ID below
      reason: "Meeting",
      rfidUid: "1088722835"
    };

    // First fetch a valid destination ID from the API
    const destRes = await fetch("http://localhost:3000/api/destinations");
    if (destRes.ok) {
      const destinations = await destRes.json() as any[];
      if (destinations.length > 0) {
        payload.destinationIds = [destinations[0].id];
        console.log("Using destination ID from API:", payload.destinationIds[0]);
      }
    } else {
      console.log("Failed to fetch destinations from API. Status:", destRes.status);
    }

    console.log("Sending POST payload:", payload);
    const res = await fetch("http://localhost:3000/api/receptionist/visits/manual-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", res.status);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (error) {
    console.error("Fetch request failed:", error);
  }
}

testApi();
