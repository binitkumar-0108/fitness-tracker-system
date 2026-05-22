import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  console.log("Supabase URL:", url);
  console.log("Supabase Key starts with:", key ? key.substring(0, 10) + "..." : "None");
  
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error("Supabase query error:", error);
    } else {
      console.log("Supabase connection success! Data:", data);
    }
  } catch (err) {
    console.error("Failed to connect to Supabase:", err.message);
  }
}

test();
