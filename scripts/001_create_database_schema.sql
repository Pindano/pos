-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_settings table for merchant configuration
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Market Vendor',
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  logo_url TEXT,
  receipt_footer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default business settings
INSERT INTO business_settings (business_name, business_address, business_phone, business_email, receipt_footer)
VALUES (
  'Fresh Market Vendor',
  '123 Market Street, City, State 12345',
  '+1 (555) 123-4567',
  'orders@freshmarket.com',
  'Thank you for your business! Fresh produce delivered daily.'
) ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, category, price, unit, stock_quantity, description) VALUES
('Tomatoes', 'Vegetables', 3.50, 'lb', 50, 'Fresh red tomatoes'),
('Bananas', 'Fruits', 1.20, 'lb', 30, 'Ripe yellow bananas'),
('Carrots', 'Vegetables', 2.00, 'lb', 40, 'Organic carrots'),
('Apples', 'Fruits', 4.00, 'lb', 25, 'Crisp red apples'),
('Lettuce', 'Vegetables', 2.50, 'head', 20, 'Fresh green lettuce'),
('Oranges', 'Fruits', 3.00, 'lb', 35, 'Sweet oranges'),
('Potatoes', 'Vegetables', 1.80, 'lb', 60, 'Russet potatoes'),
('Strawberries', 'Fruits', 5.00, 'pint', 15, 'Sweet strawberries')
ON CONFLICT DO NOTHING;
