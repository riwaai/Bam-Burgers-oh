from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://sqhjsctsxlnivcbeclrn.supabase.co')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
TENANT_ID = os.environ.get('TENANT_ID', 'd82147fa-f5e3-474c-bb39-6936ad3b519a')
BRANCH_ID = os.environ.get('BRANCH_ID', '3f9570b2-24d2-4f2d-81d7-25c6b35da76b')

# Tap Payments configuration - LIVE KEYS
TAP_SECRET_KEY = os.environ.get('TAP_SECRET_KEY', 'sk_live_gBTwKh2Y0XGztTpcUqKvPOwQHfBiV')
TAP_PUBLIC_KEY = os.environ.get('TAP_PUBLIC_KEY', 'pk_live_gBTwKm2F0JfNOyR7q4rUslviegVxP')
TAP_MERCHANT_ID = os.environ.get('TAP_MERCHANT_ID', '68010541')

app = FastAPI(title="Bam Burgers API", version="2.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== MODELS ====================

class ModifierSelection(BaseModel):
    id: str
    name_en: str
    name_ar: Optional[str] = None
    price: float = 0

class OrderItem(BaseModel):
    item_id: str
    item_name_en: str
    item_name_ar: str
    quantity: int
    unit_price: float
    total_price: float
    notes: Optional[str] = None
    modifiers: Optional[List[ModifierSelection]] = []

class DeliveryAddress(BaseModel):
    area: str
    block: str
    street: Optional[str] = None
    building: str
    floor: Optional[str] = None
    apartment: Optional[str] = None
    additional_directions: Optional[str] = None
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None

class CreateOrderRequest(BaseModel):
    order_type: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_address: Optional[DeliveryAddress] = None
    delivery_instructions: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    discount_amount: float = 0
    delivery_fee: float = 0
    total_amount: float
    notes: Optional[str] = None
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = "cash"

class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: str
    payment_url: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str

class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = ""
    discount_type: str = "percentage"
    discount_value: float
    min_order_amount: float = 0
    max_discount_amount: Optional[float] = None
    max_uses: Optional[int] = None
    status: str = "active"

class LoyaltySettings(BaseModel):
    points_per_kwd: int = 10
    kwd_per_point: float = 0.01
    min_points_redeem: int = 100
    signup_bonus: int = 50
    referral_bonus: int = 100
    birthday_bonus: int = 200
    is_active: bool = True

class CategoryCreate(BaseModel):
    name_en: str
    name_ar: str
    description_en: Optional[str] = ""
    description_ar: Optional[str] = ""
    image_url: Optional[str] = ""
    sort_order: int = 0
    status: str = "active"

class ItemCreate(BaseModel):
    category_id: str
    name_en: str
    name_ar: str
    description_en: Optional[str] = ""
    description_ar: Optional[str] = ""
    image_url: Optional[str] = ""
    base_price: float
    calories: Optional[int] = None
    prep_time_minutes: Optional[int] = None
    sort_order: int = 0
    status: str = "active"

class ModifierGroupCreate(BaseModel):
    name_en: str
    name_ar: str
    min_select: int = 0
    max_select: int = 1
    required: bool = False
    sort_order: int = 0
    status: str = "active"

class ModifierCreate(BaseModel):
    modifier_group_id: str
    name_en: str
    name_ar: str
    price: float = 0
    default_selected: bool = False
    sort_order: int = 0
    status: str = "active"

class ItemModifierGroupLink(BaseModel):
    item_id: str
    modifier_group_id: str
    sort_order: int = 0

class TapChargeRequest(BaseModel):
    order_id: str
    amount: float
    currency: str = "KWD"
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: str
    description: Optional[str] = None
    redirect_url: str

class AdminSettingsUpdate(BaseModel):
    tap_secret_key: Optional[str] = None
    tap_public_key: Optional[str] = None


# ==================== SUPABASE HELPER ====================

async def supabase_request(method: str, table: str, data: dict = None, params: dict = None):
    """Make request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == 'GET':
            response = await client.get(url, headers=headers, params=params)
        elif method == 'POST':
            response = await client.post(url, headers=headers, json=data)
        elif method == 'PATCH':
            response = await client.patch(url, headers=headers, json=data, params=params)
        elif method == 'DELETE':
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            logging.error(f"Supabase error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json() if response.text else None


def generate_order_number():
    now = datetime.utcnow()
    date_str = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4().int)[:4]
    return f"WEB-{date_str}-{random_part}"


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/health")
async def api_health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ==================== ORDERS ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest):
    """Create a new order in Supabase"""
    try:
        order_number = generate_order_number()
        order_id = str(uuid.uuid4())
        
        address_json = request.delivery_address.dict() if request.delivery_address else None
        
        order_data = {
            'id': order_id,
            'tenant_id': TENANT_ID,
            'branch_id': BRANCH_ID,
            'order_number': order_number,
            'order_type': request.order_type,
            'channel': 'website',
            'status': 'pending',
            'customer_name': request.customer_name,
            'customer_phone': request.customer_phone,
            'customer_email': request.customer_email,
            'delivery_address': address_json,
            'delivery_instructions': request.delivery_instructions,
            'subtotal': request.subtotal,
            'discount_amount': request.discount_amount,
            'delivery_fee': request.delivery_fee,
            'tax_amount': 0,
            'service_charge': 0,
            'total_amount': request.total_amount,
            'payment_status': 'pending',
            'notes': request.notes,
        }
        
        # Insert order
        result = await supabase_request('POST', 'orders', data=order_data)
        
        # Insert order items
        if request.items:
            for item in request.items:
                order_item_id = str(uuid.uuid4())
                
                # Insert order item
                item_data = {
                    'id': order_item_id,
                    'order_id': order_id,
                    'item_id': item.item_id,
                    'item_name_en': item.item_name_en,
                    'item_name_ar': item.item_name_ar,
                    'quantity': item.quantity,
                    'unit_price': item.unit_price,
                    'total_price': item.total_price,
                    'notes': item.notes,
                    'status': 'pending',
                }
                await supabase_request('POST', 'order_items', data=item_data)
                
                # Insert item modifiers if any
                if item.modifiers:
                    for mod in item.modifiers:
                        modifier_data = {
                            'order_item_id': order_item_id,
                            'modifier_id': mod.id if hasattr(mod, 'id') else mod.get('id', ''),
                            'modifier_name_en': mod.name_en if hasattr(mod, 'name_en') else mod.get('name_en', mod.get('name', '')),
                            'modifier_name_ar': mod.name_ar if hasattr(mod, 'name_ar') else mod.get('name_ar', ''),
                            'quantity': 1,
                            'price': mod.price if hasattr(mod, 'price') else mod.get('price', 0),
                        }
                        try:
                            await supabase_request('POST', 'order_item_modifiers', data=modifier_data)
                        except Exception as mod_err:
                            logging.warning(f"Could not save modifier: {mod_err}")
        
        # Handle Tap payment if selected
        payment_url = None
        if request.payment_method == 'tap':
            payment_url = await create_tap_charge_internal(
                order_id=order_id,
                amount=request.total_amount,
                customer_name=request.customer_name,
                customer_email=request.customer_email,
                customer_phone=request.customer_phone,
            )
        
        return OrderResponse(
            id=order_id,
            order_number=order_number,
            status='pending',
            created_at=datetime.utcnow().isoformat(),
            payment_url=payment_url
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID with items and modifiers"""
    try:
        orders = await supabase_request('GET', 'orders', params={'id': f'eq.{order_id}', 'select': '*'})
        if not orders:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = orders[0]
        items = await supabase_request('GET', 'order_items', params={'order_id': f'eq.{order_id}', 'select': '*'})
        
        # Get modifiers for each item
        items_with_modifiers = []
        for item in (items or []):
            modifiers = await supabase_request('GET', 'order_item_modifiers', params={
                'order_item_id': f'eq.{item["id"]}',
                'select': '*'
            })
            item['modifiers'] = modifiers or []
            items_with_modifiers.append(item)
        
        order['items'] = items_with_modifiers
        return order
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/orders/number/{order_number}")
async def get_order_by_number(order_number: str):
    """Get order by order number"""
    try:
        orders = await supabase_request('GET', 'orders', params={'order_number': f'eq.{order_number}', 'select': '*'})
        if not orders:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = orders[0]
        items = await supabase_request('GET', 'order_items', params={'order_id': f'eq.{order["id"]}', 'select': '*'})
        order['items'] = items or []
        return order
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: UpdateStatusRequest):
    """Update order status in Supabase"""
    valid_statuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']
    
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    
    try:
        update_data = {'status': request.status}
        
        if request.status == 'accepted':
            update_data['accepted_at'] = datetime.utcnow().isoformat()
        elif request.status in ['delivered', 'completed', 'cancelled']:
            update_data['completed_at'] = datetime.utcnow().isoformat()
        
        await supabase_request('PATCH', 'orders', data=update_data, params={'id': f'eq.{order_id}'})
        
        return {"success": True, "status": request.status}
    except Exception as e:
        logging.error(f"Error updating order status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/orders")
async def get_all_orders(status: Optional[str] = None, limit: int = 100):
    """Get all orders for admin panel"""
    try:
        params = {
            'select': '*',
            'order': 'created_at.desc',
            'limit': str(limit),
            'tenant_id': f'eq.{TENANT_ID}'
        }
        
        if status and status != 'all':
            params['status'] = f'eq.{status}'
        
        orders = await supabase_request('GET', 'orders', params=params)
        return orders or []
    except Exception as e:
        logging.error(f"Error getting orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COUPONS ====================

@api_router.post("/coupons/validate")
async def validate_coupon(code: str, subtotal: float):
    """Validate a coupon code"""
    try:
        coupons = await supabase_request('GET', 'coupons', params={
            'code': f'eq.{code.upper()}',
            'tenant_id': f'eq.{TENANT_ID}',
            'status': 'eq.active',
            'select': '*'
        })
        
        if not coupons:
            raise HTTPException(status_code=404, detail="Coupon not found or expired")
        
        coupon = coupons[0]
        
        min_order = coupon.get('min_order_amount', 0) or 0
        if subtotal < min_order:
            raise HTTPException(status_code=400, detail=f"Minimum order amount is {min_order} KWD")
        
        discount_type = coupon.get('discount_type', 'percentage')
        discount_value = coupon.get('discount_value', 0)
        
        if discount_type == 'percentage':
            discount_amount = subtotal * (discount_value / 100)
            max_discount = coupon.get('max_discount_amount')
            if max_discount and discount_amount > max_discount:
                discount_amount = max_discount
        else:
            discount_amount = discount_value
        
        return {
            "valid": True,
            "coupon_id": coupon['id'],
            "code": coupon['code'],
            "discount_type": discount_type,
            "discount_value": discount_value,
            "discount_amount": round(discount_amount, 3),
            "description": coupon.get('description', '')
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error validating coupon: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/coupons")
async def get_coupons():
    """Get all coupons"""
    try:
        coupons = await supabase_request('GET', 'coupons', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': '*',
            'order': 'created_at.desc'
        })
        return coupons or []
    except Exception as e:
        logging.error(f"Error getting coupons: {str(e)}")
        return []


@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate):
    """Create a coupon"""
    try:
        coupon_data = {
            'id': str(uuid.uuid4()),
            'tenant_id': TENANT_ID,
            'code': coupon.code.upper(),
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'min_order_amount': coupon.min_order_amount,
            'max_discount_amount': coupon.max_discount_amount,
            'max_uses': coupon.max_uses,
            'uses_count': 0,
            'status': coupon.status,
        }
        
        result = await supabase_request('POST', 'coupons', data=coupon_data)
        return result[0] if result else coupon_data
    except Exception as e:
        logging.error(f"Error creating coupon: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: CouponCreate):
    """Update a coupon"""
    try:
        update_data = {
            'code': coupon.code.upper(),
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'min_order_amount': coupon.min_order_amount,
            'max_discount_amount': coupon.max_discount_amount,
            'max_uses': coupon.max_uses,
            'status': coupon.status,
        }
        
        await supabase_request('PATCH', 'coupons', data=update_data, params={'id': f'eq.{coupon_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error updating coupon: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str):
    """Delete a coupon"""
    try:
        await supabase_request('DELETE', 'coupons', params={'id': f'eq.{coupon_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error deleting coupon: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== LOYALTY ====================

@api_router.get("/loyalty/settings")
async def get_loyalty_settings():
    """Get loyalty settings"""
    try:
        settings = await supabase_request('GET', 'loyalty_settings', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': '*'
        })
        
        if settings and len(settings) > 0:
            return settings[0]
        
        return {
            'tenant_id': TENANT_ID,
            'points_per_kwd': 10,
            'kwd_per_point': 0.01,
            'min_points_redeem': 100,
            'signup_bonus': 50,
            'referral_bonus': 100,
            'birthday_bonus': 200,
            'is_active': True
        }
    except Exception as e:
        logging.error(f"Error getting loyalty settings: {str(e)}")
        return {'is_active': False}


@api_router.post("/loyalty/settings")
async def save_loyalty_settings(settings: LoyaltySettings):
    """Save loyalty settings"""
    try:
        existing = await supabase_request('GET', 'loyalty_settings', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': 'id'
        })
        
        settings_data = {
            'tenant_id': TENANT_ID,
            **settings.dict(),
        }
        
        if existing and len(existing) > 0:
            await supabase_request('PATCH', 'loyalty_settings', data=settings_data, params={'tenant_id': f'eq.{TENANT_ID}'})
        else:
            settings_data['id'] = str(uuid.uuid4())
            await supabase_request('POST', 'loyalty_settings', data=settings_data)
        
        return {"success": True}
    except Exception as e:
        logging.error(f"Error saving loyalty settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MENU - CATEGORIES ====================

@api_router.get("/menu/categories")
async def get_categories():
    """Get menu categories"""
    try:
        categories = await supabase_request('GET', 'categories', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'status': 'eq.active',
            'select': '*',
            'order': 'sort_order.asc'
        })
        return categories or []
    except Exception as e:
        logging.error(f"Error getting categories: {str(e)}")
        return []


@api_router.get("/admin/categories")
async def get_all_categories():
    """Get all categories for admin"""
    try:
        categories = await supabase_request('GET', 'categories', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': '*',
            'order': 'sort_order.asc'
        })
        return categories or []
    except Exception as e:
        logging.error(f"Error getting categories: {str(e)}")
        return []


@api_router.post("/admin/categories")
async def create_category(category: CategoryCreate):
    """Create a category"""
    try:
        category_data = {
            'id': str(uuid.uuid4()),
            'tenant_id': TENANT_ID,
            **category.dict()
        }
        
        result = await supabase_request('POST', 'categories', data=category_data)
        return result[0] if result else category_data
    except Exception as e:
        logging.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/admin/categories/{category_id}")
async def update_category(category_id: str, category: CategoryCreate):
    """Update a category"""
    try:
        await supabase_request('PATCH', 'categories', data=category.dict(), params={'id': f'eq.{category_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error updating category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category"""
    try:
        await supabase_request('DELETE', 'categories', params={'id': f'eq.{category_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error deleting category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MENU - ITEMS ====================

@api_router.get("/menu/items")
async def get_menu_items(category_id: Optional[str] = None):
    """Get menu items"""
    try:
        params = {
            'tenant_id': f'eq.{TENANT_ID}',
            'status': 'eq.active',
            'select': '*',
            'order': 'sort_order.asc'
        }
        
        if category_id and category_id != 'all':
            params['category_id'] = f'eq.{category_id}'
        
        items = await supabase_request('GET', 'items', params=params)
        return items or []
    except Exception as e:
        logging.error(f"Error getting menu items: {str(e)}")
        return []


@api_router.get("/admin/items")
async def get_all_items():
    """Get all items for admin"""
    try:
        items = await supabase_request('GET', 'items', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': '*',
            'order': 'sort_order.asc'
        })
        return items or []
    except Exception as e:
        logging.error(f"Error getting items: {str(e)}")
        return []


@api_router.post("/admin/items")
async def create_item(item: ItemCreate):
    """Create an item"""
    try:
        item_data = {
            'id': str(uuid.uuid4()),
            'tenant_id': TENANT_ID,
            **item.dict()
        }
        
        result = await supabase_request('POST', 'items', data=item_data)
        return result[0] if result else item_data
    except Exception as e:
        logging.error(f"Error creating item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/admin/items/{item_id}")
async def update_item(item_id: str, item: ItemCreate):
    """Update an item"""
    try:
        await supabase_request('PATCH', 'items', data=item.dict(), params={'id': f'eq.{item_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error updating item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/items/{item_id}")
async def delete_item(item_id: str):
    """Delete an item"""
    try:
        await supabase_request('DELETE', 'items', params={'id': f'eq.{item_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error deleting item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MODIFIER GROUPS ====================

@api_router.get("/admin/modifier-groups")
async def get_modifier_groups():
    """Get all modifier groups"""
    try:
        groups = await supabase_request('GET', 'modifier_groups', params={
            'tenant_id': f'eq.{TENANT_ID}',
            'select': '*',
            'order': 'sort_order.asc'
        })
        return groups or []
    except Exception as e:
        logging.error(f"Error getting modifier groups: {str(e)}")
        return []


@api_router.post("/admin/modifier-groups")
async def create_modifier_group(group: ModifierGroupCreate):
    """Create a modifier group"""
    try:
        group_data = {
            'id': str(uuid.uuid4()),
            'tenant_id': TENANT_ID,
            **group.dict()
        }
        
        result = await supabase_request('POST', 'modifier_groups', data=group_data)
        return result[0] if result else group_data
    except Exception as e:
        logging.error(f"Error creating modifier group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/admin/modifier-groups/{group_id}")
async def update_modifier_group(group_id: str, group: ModifierGroupCreate):
    """Update a modifier group"""
    try:
        await supabase_request('PATCH', 'modifier_groups', data=group.dict(), params={'id': f'eq.{group_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error updating modifier group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/modifier-groups/{group_id}")
async def delete_modifier_group(group_id: str):
    """Delete a modifier group"""
    try:
        await supabase_request('DELETE', 'modifier_groups', params={'id': f'eq.{group_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error deleting modifier group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MODIFIERS ====================

@api_router.get("/admin/modifiers")
async def get_modifiers(group_id: Optional[str] = None):
    """Get modifiers"""
    try:
        params = {'select': '*', 'order': 'sort_order.asc'}
        if group_id:
            params['modifier_group_id'] = f'eq.{group_id}'
        
        modifiers = await supabase_request('GET', 'modifiers', params=params)
        return modifiers or []
    except Exception as e:
        logging.error(f"Error getting modifiers: {str(e)}")
        return []


@api_router.post("/admin/modifiers")
async def create_modifier(modifier: ModifierCreate):
    """Create a modifier"""
    try:
        modifier_data = {
            'id': str(uuid.uuid4()),
            **modifier.dict()
        }
        
        result = await supabase_request('POST', 'modifiers', data=modifier_data)
        return result[0] if result else modifier_data
    except Exception as e:
        logging.error(f"Error creating modifier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/admin/modifiers/{modifier_id}")
async def update_modifier(modifier_id: str, modifier: ModifierCreate):
    """Update a modifier"""
    try:
        await supabase_request('PATCH', 'modifiers', data=modifier.dict(), params={'id': f'eq.{modifier_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error updating modifier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/modifiers/{modifier_id}")
async def delete_modifier(modifier_id: str):
    """Delete a modifier"""
    try:
        await supabase_request('DELETE', 'modifiers', params={'id': f'eq.{modifier_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error deleting modifier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ITEM-MODIFIER GROUP LINKS ====================

@api_router.get("/admin/item-modifier-groups")
async def get_item_modifier_groups(item_id: Optional[str] = None):
    """Get item-modifier group links"""
    try:
        params = {'select': '*'}
        if item_id:
            params['item_id'] = f'eq.{item_id}'
        
        links = await supabase_request('GET', 'item_modifier_groups', params=params)
        return links or []
    except Exception as e:
        logging.error(f"Error getting item modifier groups: {str(e)}")
        return []


@api_router.post("/admin/item-modifier-groups")
async def link_item_modifier_group(link: ItemModifierGroupLink):
    """Link a modifier group to an item"""
    try:
        link_data = {
            'id': str(uuid.uuid4()),
            **link.dict()
        }
        
        result = await supabase_request('POST', 'item_modifier_groups', data=link_data)
        return result[0] if result else link_data
    except Exception as e:
        logging.error(f"Error linking item to modifier group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/item-modifier-groups/{link_id}")
async def unlink_item_modifier_group(link_id: str):
    """Unlink a modifier group from an item"""
    try:
        await supabase_request('DELETE', 'item_modifier_groups', params={'id': f'eq.{link_id}'})
        return {"success": True}
    except Exception as e:
        logging.error(f"Error unlinking item from modifier group: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MENU WITH MODIFIERS ====================

@api_router.get("/menu/items/{item_id}/modifiers")
async def get_item_modifiers(item_id: str):
    """Get all modifier groups and modifiers for an item"""
    try:
        # Get linked modifier groups
        links = await supabase_request('GET', 'item_modifier_groups', params={
            'item_id': f'eq.{item_id}',
            'select': '*',
            'order': 'sort_order.asc'
        })
        
        if not links:
            return []
        
        group_ids = [link['modifier_group_id'] for link in links]
        
        # Get modifier groups
        groups = await supabase_request('GET', 'modifier_groups', params={
            'id': f'in.({",".join(group_ids)})',
            'status': 'eq.active',
            'select': '*'
        })
        
        # Get modifiers for each group
        result = []
        for group in (groups or []):
            modifiers = await supabase_request('GET', 'modifiers', params={
                'modifier_group_id': f'eq.{group["id"]}',
                'status': 'eq.active',
                'select': '*',
                'order': 'sort_order.asc'
            })
            
            result.append({
                **group,
                'modifiers': modifiers or []
            })
        
        return result
    except Exception as e:
        logging.error(f"Error getting item modifiers: {str(e)}")
        return []


# ==================== DELIVERY ZONES ====================

@api_router.get("/delivery-zones")
async def get_delivery_zones():
    """Get all delivery zones"""
    try:
        zones = await supabase_request('GET', 'delivery_zones', params={
            'branch_id': f'eq.{BRANCH_ID}',
            'status': 'eq.active',
            'select': '*'
        })
        return zones or []
    except Exception as e:
        logging.error(f"Error getting delivery zones: {str(e)}")
        return []


@api_router.get("/admin/delivery-zones")
async def get_all_delivery_zones():
    """Get all delivery zones for admin"""
    try:
        zones = await supabase_request('GET', 'delivery_zones', params={
            'branch_id': f'eq.{BRANCH_ID}',
            'select': '*'
        })
        return zones or []
    except Exception as e:
        logging.error(f"Error getting delivery zones: {str(e)}")
        return []


# ==================== TAP PAYMENTS ====================

async def create_tap_charge_internal(order_id: str, amount: float, customer_name: str, customer_email: str, customer_phone: str) -> Optional[str]:
    """Create a Tap payment charge and return the redirect URL"""
    try:
        # Get frontend URL for redirect
        frontend_url = os.environ.get('FRONTEND_URL', 'https://eatbam.me')
        
        charge_data = {
            "amount": amount,
            "currency": "KWD",
            "customer_initiated": True,
            "threeDSecure": True,
            "save_card": False,
            "description": f"Order {order_id}",
            "reference": {
                "transaction": order_id,
                "order": order_id
            },
            "customer": {
                "first_name": customer_name.split()[0] if customer_name else "Customer",
                "last_name": customer_name.split()[-1] if customer_name and len(customer_name.split()) > 1 else "",
                "email": customer_email or "customer@example.com",
                "phone": {
                    "country_code": "965",
                    "number": customer_phone.replace("+965", "").replace(" ", "") if customer_phone else "00000000"
                }
            },
            "source": {
                "id": "src_all"
            },
            "post": {
                "url": f"{frontend_url}/api/tap/webhook"
            },
            "redirect": {
                "url": f"{frontend_url}/payment-result?order_id={order_id}"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tap.company/v2/charges/",
                headers={
                    "Authorization": f"Bearer {TAP_SECRET_KEY}",
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                json=charge_data
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('transaction', {}).get('url')
            else:
                logging.error(f"Tap charge failed: {response.text}")
                return None
    except Exception as e:
        logging.error(f"Error creating Tap charge: {str(e)}")
        return None


@api_router.post("/tap/charge")
async def create_tap_charge(request: TapChargeRequest):
    """Create a Tap payment charge"""
    try:
        charge_data = {
            "amount": request.amount,
            "currency": request.currency,
            "customer_initiated": True,
            "threeDSecure": True,
            "save_card": False,
            "description": request.description or f"Order {request.order_id}",
            "reference": {
                "transaction": request.order_id,
                "order": request.order_id
            },
            "customer": {
                "first_name": request.customer_name.split()[0] if request.customer_name else "Customer",
                "last_name": request.customer_name.split()[-1] if request.customer_name and len(request.customer_name.split()) > 1 else "",
                "email": request.customer_email or "customer@example.com",
                "phone": {
                    "country_code": "965",
                    "number": request.customer_phone.replace("+965", "").replace(" ", "") if request.customer_phone else "00000000"
                }
            },
            "source": {
                "id": "src_all"
            },
            "post": {
                "url": f"{request.redirect_url.rsplit('/', 1)[0]}/api/tap/webhook"
            },
            "redirect": {
                "url": request.redirect_url
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tap.company/v2/charges/",
                headers={
                    "Authorization": f"Bearer {TAP_SECRET_KEY}",
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                json=charge_data
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "charge_id": result.get('id'),
                    "payment_url": result.get('transaction', {}).get('url'),
                    "status": result.get('status')
                }
            else:
                logging.error(f"Tap charge failed: {response.text}")
                raise HTTPException(status_code=400, detail="Payment creation failed")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating Tap charge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/tap/webhook")
async def tap_webhook(request: Request):
    """Handle Tap payment webhook"""
    try:
        data = await request.json()
        
        charge_id = data.get('id')
        status = data.get('status')
        order_id = data.get('reference', {}).get('order')
        
        if order_id and status:
            payment_status = 'paid' if status == 'CAPTURED' else 'failed'
            await supabase_request('PATCH', 'orders', 
                data={'payment_status': payment_status},
                params={'id': f'eq.{order_id}'}
            )
        
        return {"received": True}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        return {"received": True}


@api_router.get("/tap/charge/{charge_id}")
async def get_tap_charge(charge_id: str):
    """Get Tap charge status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.tap.company/v2/charges/{charge_id}",
                headers={
                    "Authorization": f"Bearer {TAP_SECRET_KEY}",
                    "accept": "application/json"
                }
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=400, detail="Could not retrieve charge")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting Tap charge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN SETTINGS ====================

@api_router.get("/admin/settings")
async def get_admin_settings():
    """Get admin settings including payment keys"""
    return {
        "tap_public_key": TAP_PUBLIC_KEY,
        "tap_secret_key_set": bool(TAP_SECRET_KEY),
    }


@api_router.get("/")
async def root():
    return {"message": "Bam Burgers API", "version": "2.0.0"}


# Include the router
app.include_router(api_router)
