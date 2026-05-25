import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const w = await supabase.from("waitlist").select("*", { count: "exact", head: true });
    console.log("waitlist count:", w.count, "| error:", w.error ? w.error.message : null);
    
    const o = await supabase.from("orders").select("*", { count: "exact", head: true });
    console.log("orders count:", o.count, "| error:", o.error ? o.error.message : null);
}

test();
