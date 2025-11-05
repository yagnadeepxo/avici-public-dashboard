const { supabase } = require("./db");

(async () => {
    console.log("starting")
  const { data, error } = await supabase
    .from("wallet_swap_aggregates")
    .upsert({ id: "5abf07c9-4d4c-438b-8b04-3f8bfa04ac11",total_volume_usd: 420, total_count: 69, last_updated: new Date()})
    .select();

  console.log({ data, error });
})();
