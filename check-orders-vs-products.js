// Cross-check: find product_ids referenced in orders that are missing or unavailable in products table
// Run with: node check-orders-vs-products.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dirvsgwsfnmjjdnhwknf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcnZzZ3dzZm5tampkbmh3a25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzAxMzMsImV4cCI6MjA3ODUwNjEzM30.feSuisTQn5240t6W6WtxAjmqizZXoD91d5N5SYIl9fY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function analyze() {
  console.log('🔍 Fetching orders and products...\n');

  const [ordersRes, productsRes] = await Promise.all([
    supabase.from('orders').select('id, order_number, order_items, created_at'),
    supabase.from('products').select('id, name, available, stock_quantity'),
  ]);

  if (ordersRes.error) { console.error('Orders error:', ordersRes.error); return; }
  if (productsRes.error) { console.error('Products error:', productsRes.error); return; }

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];

  console.log(`📦 Orders: ${orders.length}`);
  console.log(`🏷️  Products: ${products.length}\n`);

  // Build product lookup
  const productMap = new Map();
  products.forEach(p => productMap.set(p.id, p));

  // Collect unique product references from orders
  const orderedProducts = new Map(); // product_id -> { name, orderCount, orderNumbers }

  for (const order of orders) {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    for (const item of items) {
      if (!item.product_id) continue;
      const existing = orderedProducts.get(item.product_id);
      if (existing) {
        existing.orderCount++;
        existing.orderNumbers.add(order.order_number);
      } else {
        orderedProducts.set(item.product_id, {
          name: item.product_name || '(no name)',
          orderCount: 1,
          orderNumbers: new Set([order.order_number]),
        });
      }
    }
  }

  console.log(`🛒 Unique products referenced in orders: ${orderedProducts.size}\n`);

  // Find mismatches
  const missing = [];   // product_id in orders but NOT in products table (deleted)
  const unavailable = []; // product_id in orders AND in products but available=false (hidden)
  const ok = [];        // product_id in orders and available=true

  for (const [pid, info] of orderedProducts.entries()) {
    const product = productMap.get(pid);
    if (!product) {
      missing.push({ pid, ...info });
    } else if (!product.available) {
      unavailable.push({ pid, productName: product.name, stock: product.stock_quantity, ...info });
    } else {
      ok.push({ pid, productName: product.name, ...info });
    }
  }

  // Report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`❌ MISSING (in orders but DELETED from products): ${missing.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  missing.forEach(m => {
    console.log(`  • ${m.name}`);
    console.log(`    product_id: ${m.pid}`);
    console.log(`    appeared in ${m.orderCount} order(s): #${[...m.orderNumbers].join(', #')}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`⚠️  HIDDEN (exists but available=false): ${unavailable.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  unavailable.forEach(u => {
    console.log(`  • ${u.productName} (stock: ${u.stock})`);
    console.log(`    product_id: ${u.pid}`);
    console.log(`    appeared in ${u.orderCount} order(s): #${[...u.orderNumbers].join(', #')}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ OK (still visible on site): ${ok.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  ok.forEach(o => console.log(`  • ${o.productName}`));

  console.log('\n📊 Summary:');
  console.log(`   ${missing.length} deleted, ${unavailable.length} hidden, ${ok.length} visible`);
}

analyze().catch(err => console.error('❌', err));
