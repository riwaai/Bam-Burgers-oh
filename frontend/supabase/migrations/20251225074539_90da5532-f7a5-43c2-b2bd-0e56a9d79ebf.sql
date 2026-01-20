-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create settings table for restaurant configuration
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Settings RLS: public read, admin write
CREATE POLICY "Anyone can view settings"
ON public.settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update settings"
ON public.settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    available BOOLEAN NOT NULL DEFAULT true,
    popular BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Menu items: public read, admin write
CREATE POLICY "Anyone can view menu items"
ON public.menu_items
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage menu items"
ON public.menu_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    delivery_address TEXT,
    order_type TEXT NOT NULL DEFAULT 'delivery',
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders: admin can manage all
CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Anonymous users can create orders
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Coupons: public read active, admin write
CREATE POLICY "Anyone can view active coupons"
ON public.coupons
FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create loyalty_settings table
CREATE TABLE public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    points_per_dollar INTEGER NOT NULL DEFAULT 10,
    rewards JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loyalty_settings
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

-- Loyalty settings: public read, admin write
CREATE POLICY "Anyone can view loyalty settings"
ON public.loyalty_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage loyalty settings"
ON public.loyalty_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create customer_loyalty table
CREATE TABLE public.customer_loyalty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'Bronze',
    total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customer_loyalty
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Customer loyalty: admin can manage all
CREATE POLICY "Admins can manage customer loyalty"
ON public.customer_loyalty
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loyalty_settings_updated_at
    BEFORE UPDATE ON public.loyalty_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_loyalty_updated_at
    BEFORE UPDATE ON public.customer_loyalty
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
('restaurant', '{"name": "Bam Burgers", "phone": "+965 1234 5678", "email": "hello@bamburgers.com", "address": "Kuwait City, Kuwait", "currency": "KWD"}'),
('delivery', '{"fee": 0.500, "minOrder": 3.000, "freeDeliveryThreshold": 1000.000, "radius": 15}'),
('payment', '{"knet": {"enabled": false, "merchantId": ""}, "myfatoorah": {"enabled": false, "apiKey": ""}, "tap": {"enabled": false, "apiKey": ""}, "cashOnDelivery": true}'),
('notifications', '{"newOrderAlerts": true, "lowStockAlerts": true, "dailySummary": false}'),
('website', '{"onlineOrdering": true, "loyaltyProgram": true, "maintenanceMode": false}');

-- Insert default loyalty settings
INSERT INTO public.loyalty_settings (points_per_dollar, rewards) VALUES
(10, '[{"name": "Free Drink", "points": 100}, {"name": "Free Side", "points": 200}, {"name": "Free Burger", "points": 500}, {"name": "$10 Off", "points": 1000}]');

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category, popular, image_url) VALUES
('Classic Burger', 'Juicy beef patty with fresh lettuce, tomato, and our special sauce', 2.500, 'Burgers', true, '/placeholder.svg'),
('Double Cheese Burger', 'Two beef patties with melted cheese, pickles, and onions', 3.500, 'Burgers', true, '/placeholder.svg'),
('Spicy Chicken Burger', 'Crispy chicken with jalapeños and spicy mayo', 3.000, 'Burgers', true, '/placeholder.svg'),
('Veggie Burger', 'Plant-based patty with avocado and fresh vegetables', 3.250, 'Burgers', false, '/placeholder.svg'),
('Crispy Fries', 'Golden, crispy French fries', 1.000, 'Sides', true, '/placeholder.svg'),
('Onion Rings', 'Crispy battered onion rings', 1.250, 'Sides', false, '/placeholder.svg'),
('Cheese Fries', 'Fries topped with melted cheese sauce', 1.500, 'Sides', false, '/placeholder.svg'),
('Cola', 'Refreshing cola drink', 0.500, 'Drinks', false, '/placeholder.svg'),
('Lemonade', 'Fresh homemade lemonade', 0.750, 'Drinks', false, '/placeholder.svg'),
('Milkshake', 'Creamy vanilla milkshake', 1.500, 'Drinks', true, '/placeholder.svg');

-- Insert sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, active) VALUES
('WELCOME10', 'percentage', 10, 5.000, false),
('FREESHIP', 'fixed', 1.000, 3.000, false);