module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const owner = String(req.query.owner || "").trim();
  if (!owner) {
    return res.status(400).json({ error: "Missing owner" });
  }

  const alchemyKey = process.env.ALCHEMY_AMOY_KEY || "";
  if (!alchemyKey) {
    return res.status(500).json({ error: "NFT service not configured" });
  }

  try {
    const url = `https://polygon-amoy.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${encodeURIComponent(owner)}&withMetadata=true`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: "Upstream NFT provider failed" });
    }

    const data = await response.json();
    return res.status(200).json({
      ownedNfts: Array.isArray(data.ownedNfts) ? data.ownedNfts : []
    });
  } catch (_err) {
    return res.status(500).json({ error: "Failed to load NFTs" });
  }
};

