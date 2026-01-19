// Execute SQL fix for set_tenant_id function
import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL!;

async function executeFix() {
    const pool = new Pool({ connectionString });

    try {
        console.log('Fixing set_tenant_id function...');

        const sql = fs.readFileSync(
            path.join(process.cwd(), 'scripts', 'fix-set-tenant-id.sql'),
            'utf-8'
        );

        await pool.query(sql);
        console.log('✅ Function set_tenant_id fixed successfully!');

        // Test the function
        console.log('Testing function...');
        await pool.query("SELECT set_tenant_id('00000000-0000-0000-0000-000000000000')");
        console.log('✅ Function test passed!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

executeFix();
