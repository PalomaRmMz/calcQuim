// Same idempotency table and response as Admin commands. No new persistence.
export function withInventoryOperationStatus(service, pool, schema) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error('Invalid schema');
  return { ...service, async inventoryOperationStatus(key) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN READ ONLY');
      const row = (await client.query(`SELECT request_hash,response FROM "${schema}".idempotency_requests WHERE request_key=$1`, [key])).rows[0];
      await client.query('COMMIT');
      return row ? { requestHash: row.request_hash, response: row.response } : null;
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  } };
}
