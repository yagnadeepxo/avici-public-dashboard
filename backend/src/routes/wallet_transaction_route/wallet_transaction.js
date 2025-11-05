
const express = require("express");
const { supabase } = require("../../db");

const router = express.Router();

// GET /api/wallet/transactions/summary
router.get("/transactions/summary", async (req, res) => {
  const { data, error } = await supabase
    .from("wallet_transaction_aggregates")
    .select("*")
    .order("last_updated", { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(500).json({ success: false, error: error.message });

  res.json({
    success: true,
    total_volume_usd: data.total_volume_usd,
    total_count: data.total_count,
    last_updated: data.last_updated,
  });
});

module.exports = router;
