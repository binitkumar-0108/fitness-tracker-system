import pkg from 'pg';
const { Pool } = pkg;
(async function(){
  const conn = process.env.DATABASE_URL;
  if(!conn){ console.error('DATABASE_URL not set'); process.exit(1); }
  const pool = new Pool({ connectionString: conn });
  try{
    const res = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema, table_name");
    console.log('tables:', res.rows);
  }catch(e){
    console.error('error', e);
  }finally{ await pool.end(); }
})();
