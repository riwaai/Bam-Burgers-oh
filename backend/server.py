from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import uuid
from datetime import datetime
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
TENANT_ID = os.environ.get('TENANT_ID', '')
BRANCH_ID = os.environ.get('BRANCH_ID', '')
WEB_USER_ID = os.environ.get('WEB_USER_ID', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Order Models
class OrderItem(BaseModel):
    item_id: str
    item_name_en: str
    item_name_ar: str
    quantity: int
    unit_price: float
    total_price: float
    notes: Optional[str] = None
    modifiers: Optional[List[dict]] = []

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
    order_type: str  # 'delivery' or 'pickup'
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

class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: str

async def supabase_request(method: str, endpoint: str, data: dict = None, params: dict = None, use_auth: bool = False):
    """Make a request to Supabase REST API using service key"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    # For order creation, we need to authenticate as a user first
    api_key = SUPABASE_SERVICE_KEY
    
    headers = {
        'Content-Type': 'application/json',
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Prefer': 'return=representation'
    }
    
    async with httpx.AsyncClient() as client:
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
            raise HTTPException(status_code=response.status_code, detail=response.json())
        
        return response.json() if response.text else None


async def create_order_with_auth():
    """
    Authenticate as web orders user and return the access token.
    This is needed because the orders table has a trigger that sets user_id from auth.uid()
    """
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
    }
    data = {
        'email': 'weborders@bamburgers.com',
        'password': 'WebOrder@123'
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            logging.error(f"Auth error: {response.text}")
            return None

# Generate order number
def generate_order_number():
    now = datetime.utcnow()
    date_str = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4().int)[:4]
    return f"WEB-{date_str}-{random_part}"


# Routes
@api_router.get("/")
async def root():
    return {"message": "Bam Burgers API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest):
    """Create a new order in Supabase"""
    try:
        order_number = generate_order_number()
        
        # Build delivery address JSON
        address_json = None
        if request.delivery_address:
            address_json = request.delivery_address.dict()
        
        # Insert order into Supabase using direct SQL via RPC to bypass trigger issues
        # Since service role bypasses RLS but triggers still run, we'll use a workaround
        
        order_data = {
            'tenant_id': TENANT_ID,
            'branch_id': BRANCH_ID,
            'order_number': order_number,
            'order_type': request.order_type,
            'channel': 'website',
            'status': 'pending',
            'user_id': WEB_USER_ID,  # Set explicitly
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
        
        # Use httpx to make raw POST request with proper headers
        url = f"{SUPABASE_URL}/rest/v1/orders"
        headers = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
            'Prefer': 'return=representation'
        }
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(url, headers=headers, json=order_data)
            
            if response.status_code >= 400:
                error_detail = response.json()
                logging.error(f"Order creation failed: {error_detail}")
                
                # If the trigger is causing issues, try alternate approach
                if 'user_id' in str(error_detail):
                    # Try creating without user_id and see if there's a default
                    del order_data['user_id']
                    response = await http_client.post(url, headers=headers, json=order_data)
                    
                    if response.status_code >= 400:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Failed to create order: {response.json()}"
                        )
            
            order_result = response.json()
            
            if isinstance(order_result, list) and len(order_result) > 0:
                order = order_result[0]
            else:
                order = order_result
            
            order_id = order['id']
            
            # Insert order items
            if request.items:
                items_data = []
                for item in request.items:
                    items_data.append({
                        'order_id': order_id,
                        'item_id': item.item_id,
                        'item_name_en': item.item_name_en,
                        'item_name_ar': item.item_name_ar,
                        'quantity': item.quantity,
                        'unit_price': item.unit_price,
                        'total_price': item.total_price,
                        'notes': item.notes,
                        'status': 'pending',
                    })
                
                items_url = f"{SUPABASE_URL}/rest/v1/order_items"
                await http_client.post(items_url, headers=headers, json=items_data)
        
        return OrderResponse(
            id=order_id,
            order_number=order_number,
            status='pending',
            created_at=order.get('created_at', datetime.utcnow().isoformat())
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    try:
        orders = await supabase_request(
            'GET', 
            'orders',
            params={'id': f'eq.{order_id}', 'select': '*'}
        )
        
        if not orders:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = orders[0]
        
        # Get order items
        items = await supabase_request(
            'GET',
            'order_items',
            params={'order_id': f'eq.{order_id}', 'select': '*'}
        )
        
        order['items'] = items
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
        orders = await supabase_request(
            'GET',
            'orders',
            params={'order_number': f'eq.{order_number}', 'select': '*'}
        )
        
        if not orders:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = orders[0]
        
        # Get order items
        items = await supabase_request(
            'GET',
            'order_items',
            params={'order_id': f'eq.{order["id"]}', 'select': '*'}
        )
        
        order['items'] = items
        return order
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Update order status (for admin panel)"""
    valid_statuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        update_data = {'status': status, 'updated_at': datetime.utcnow().isoformat()}
        
        # Set timestamp fields based on status
        if status == 'accepted':
            update_data['accepted_at'] = datetime.utcnow().isoformat()
        elif status in ['delivered', 'cancelled']:
            update_data['completed_at'] = datetime.utcnow().isoformat()
        
        result = await supabase_request(
            'PATCH',
            'orders',
            data=update_data,
            params={'id': f'eq.{order_id}'}
        )
        
        return {"success": True, "status": status}
        
    except Exception as e:
        logging.error(f"Error updating order status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/orders")
async def get_all_orders(status: Optional[str] = None, limit: int = 50):
    """Get all orders for admin panel"""
    try:
        params = {
            'select': '*',
            'order': 'created_at.desc',
            'limit': str(limit),
            'tenant_id': f'eq.{TENANT_ID}'
        }
        
        if status:
            params['status'] = f'eq.{status}'
        
        orders = await supabase_request('GET', 'orders', params=params)
        return orders
        
    except Exception as e:
        logging.error(f"Error getting orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DELIVERY ZONES ====================

@api_router.get("/delivery-zones")
async def get_delivery_zones():
    """Get all delivery zones"""
    try:
        zones = await supabase_request(
            'GET',
            'delivery_zones',
            params={'tenant_id': f'eq.{TENANT_ID}', 'select': '*'}
        )
        return zones
        
    except Exception as e:
        logging.error(f"Error getting delivery zones: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== COUPONS ====================

@api_router.get("/coupons")
async def get_coupons():
    """Get all active coupons"""
    try:
        coupons = await supabase_request(
            'GET',
            'coupons',
            params={'tenant_id': f'eq.{TENANT_ID}', 'status': 'eq.active', 'select': '*'}
        )
        return coupons
        
    except Exception as e:
        logging.error(f"Error getting coupons: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/coupons/validate")
async def validate_coupon(code: str, subtotal: float):
    """Validate a coupon code"""
    try:
        coupons = await supabase_request(
            'GET',
            'coupons',
            params={
                'code': f'eq.{code}',
                'tenant_id': f'eq.{TENANT_ID}',
                'status': 'eq.active',
                'select': '*'
            }
        )
        
        if not coupons:
            raise HTTPException(status_code=404, detail="Coupon not found or expired")
        
        coupon = coupons[0]
        
        # Check minimum order
        min_order = coupon.get('min_order_amount', 0)
        if subtotal < min_order:
            raise HTTPException(
                status_code=400, 
                detail=f"Minimum order amount for this coupon is {min_order} KWD"
            )
        
        # Check expiry
        if coupon.get('expires_at'):
            expiry = datetime.fromisoformat(coupon['expires_at'].replace('Z', '+00:00'))
            if expiry < datetime.now():
                raise HTTPException(status_code=400, detail="Coupon has expired")
        
        # Calculate discount
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


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
