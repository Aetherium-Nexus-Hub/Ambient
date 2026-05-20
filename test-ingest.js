// test-ingest.js
// Run via terminal: node test-ingest.js

async function testAudioIngestion() {
  const endpoint = 'http://localhost:3000/api/audio/ingest';
  
  // Replace 'observx' if your actual SoundCloud handle differs
  const targetTrackUrl = 'https://soundcloud.com/observx/ambient-ambient'; 

  console.log(`[Test] Initiating ingestion request for: ${targetTrackUrl}`);
  console.log(`[Test] Sovereignty Status: APPROVED\n`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetTrackUrl,
        // The gate key: toggle this to 'PENDING' to test your 403 fallback
        signatureStatus: 'APPROVED' 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Test Failed] Status ${response.status}:`, data);
      return;
    }

    console.log('✅ [Test Success] Metadata & Streams Extracted:\n');
    console.log(`Title: ${data.title}`);
    console.log(`URN: ${data.track_urn}`);
    console.log(`BPM: ${data.bpm || 'Not set on SoundCloud'}`);
    console.log(`Key: ${data.key_signature || 'Not set on SoundCloud'}`);
    
    // Log the first available stream URL structure
    const streamKeys = Object.keys(data.streams);
    if (streamKeys.length > 0) {
      console.log(`\nAvailable Stream Endpoints Discovered: ${streamKeys.length}`);
      console.log(`Sample Stream Payload:`, data.streams);
    } else {
      console.log(`\nNo streams returned. Check track privacy settings.`);
    }

  } catch (error) {
    console.error('[Test Error] Execution failed:', error.message);
  }
}

testAudioIngestion();
