import express from 'express';

const router = express.Router();

router.post('/ingest', async (req, res) => {
  try {
    const { url, signatureStatus } = req.body;

    // 1. Human Sovereignty Gate
    if (signatureStatus !== 'APPROVED') {
      console.warn('[Audio Ingestion] Blocked: Sovereignty Gate check failed.');
      return res.status(403).json({ state: 'PENDING_SIGNATURE' });
    }

    if (!url) {
      console.error('[Audio Ingestion] Error: No URL provided.');
      return res.status(400).json({ error: 'Missing SoundCloud URL.' });
    }

    const token = process.env.SOUNDCLOUD_ACCESS_TOKEN;
    if (!token) {
      console.error('[Audio Ingestion] Error: SOUNDCLOUD_ACCESS_TOKEN not configured.');
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    const headers = {
      'Authorization': `OAuth ${token}`,
      'Accept': 'application/json; charset=utf-8'
    };

    console.log(`[Audio Ingestion] Resolving SoundCloud URL: ${url}`);

    // 2. Resolve URL & fetch metadata
    const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}`;
    const resolveMeta = await fetch(resolveUrl, { headers });

    if (!resolveMeta.ok) {
      const errText = await resolveMeta.text();
      console.error(`[Audio Ingestion] Resolution failed: ${resolveMeta.status} - ${errText}`);
      return res.status(resolveMeta.status).json({ error: 'Failed to resolve SoundCloud track.' });
    }

    const trackData = await resolveMeta.json();
    const trackUrn = trackData.urn || `soundcloud:tracks:${trackData.id}`;
    
    console.log(`[Audio Ingestion] Resolved track: ${trackData.title} (URN: ${trackUrn})`);

    // 3. Fetch streamable audio URLs
    const streamsUrl = `https://api.soundcloud.com/tracks/${encodeURIComponent(trackUrn)}/streams`;
    const streamsMeta = await fetch(streamsUrl, { headers });

    if (!streamsMeta.ok) {
        const errText = await streamsMeta.text();
        console.error(`[Audio Ingestion] Stream fetch failed: ${streamsMeta.status} - ${errText}`);
        return res.status(streamsMeta.status).json({ error: 'Failed to fetch stream details.' });
    }

    const streamData = await streamsMeta.json();

    console.log(`[Audio Ingestion] Successfully retrieved stream payload for: ${trackData.title}`);

    // 4. Return assembled payload
    return res.status(200).json({ 
        title: trackData.title,
        track_urn: trackUrn,
        bpm: trackData.bpm,
        key_signature: trackData.key_signature,
        streams: streamData 
    });

  } catch (error: any) {
    console.error(`[Audio Ingestion] Internal Error: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error during ingestion pipeline.' });
  }
});

export default router;
