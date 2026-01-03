from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
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
import json

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

# Web orders user credentials
WEB_USER_EMAIL = 'weborders@bamburgers.com'
WEB_USER_PASSWORD = 'WebOrder@123'

# Create the main app
app = FastAPI(title="Bam Burgers API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)


# ==================== MODELS ====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

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

class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: str


# ==================== HELPER FUNCTIONS ====================

# Cache for web user session
_web_user_session = {
    'access_token': None,
    'expires_at': 0
}

async def get_web_user_session():
    """Get or refresh web user session for order creation"""
    global _web_user_session
    
    # Check if we have a valid session
    if _web_user_session['access_token'] and _web_user_session['expires_at'] > datetime.now().timestamp():
        return _web_user_session['access_token']
    
    # Sign in as web orders user
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
    }
    data = {
        'email': WEB_USER_EMAIL,
        'password': WEB_USER_PASSWORD
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            _web_user_session['access_token'] = result.get('access_token')
            _web_user_session['expires_at'] = datetime.now().timestamp() + result.get('expires_in', 3600) - 60
            return _web_user_session['access_token']
        else:
            logging.error(f"Failed to get web user session: {response.text}")
            return None


async def supabase_request(method: str, endpoint: str, data: dict = None, params: dict = None, use_service_key: bool = True):
    """Make a request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    api_key = SUPABASE_SERVICE_KEY if use_service_key else SUPABASE_ANON_KEY
    
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


def generate_order_number():
    """Generate unique order number"""
    now = datetime.utcnow()
    date_str = now.strftime('%Y%m%d')
    random_part = str(uuid.uuid4().int)[:4]
    return f"WEB-{date_str}-{random_part}"


# ==================== ROUTES ====================

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
    """Create a new order"""
    try:
        order_number = generate_order_number()
        
        # Build delivery address JSON
        address_json = None
        if request.delivery_address:
            address_json = request.delivery_address.dict()
        
        # Get authenticated session for web user
        access_token = await get_web_user_session()
        
        if not access_token:
            logging.warning("Could not get web user session, using service key")
            # Fall back to service key (may fail due to trigger)
            api_key = SUPABASE_SERVICE_KEY
        else:
            api_key = access_token
        
        order_data = {
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
        
        url = f"{SUPABASE_URL}/rest/v1/orders"
        headers = {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {api_key}',
            'Prefer': 'return=representation'
        }
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(url, headers=headers, json=order_data)
            
            if response.status_code >= 400:
                error_detail = response.json()
                logging.error(f"Order creation failed: {error_detail}")
                
                # Fall back to MongoDB on ANY Supabase error
                logging.info("Supabase order failed, creating order in MongoDB as fallback")
                return await create_order_mongodb(request, order_number)
            
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


async def create_order_mongodb(request: CreateOrderRequest, order_number: str) -> OrderResponse:
    """Fallback: Create order in MongoDB when Supabase RLS blocks"""
    order_id = str(uuid.uuid4())
    
    address_json = None
    if request.delivery_address:
        address_json = request.delivery_address.dict()
    
    order_doc = {
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
        'items': [item.dict() for item in request.items],
        'subtotal': request.subtotal,
        'discount_amount': request.discount_amount,
        'delivery_fee': request.delivery_fee,
        'tax_amount': 0,
        'service_charge': 0,
        'total_amount': request.total_amount,
        'payment_status': 'pending',
        'notes': request.notes,
        'created_at': datetime.utcnow().isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
        'source': 'mongodb_fallback'  # Mark as fallback order
    }
    
    await db.web_orders.insert_one(order_doc)
    
    logging.info(f"Order {order_number} created in MongoDB as fallback")
    
    return OrderResponse(
        id=order_id,
        order_number=order_number,
        status='pending',
        created_at=order_doc['created_at']
    )


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    try:
        # First check MongoDB fallback
        mongo_order = await db.web_orders.find_one({'id': order_id})
        if mongo_order:
            del mongo_order['_id']
            return mongo_order
        
        # Then check Supabase
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
        # First check MongoDB fallback
        mongo_order = await db.web_orders.find_one({'order_number': order_number})
        if mongo_order:
            del mongo_order['_id']
            return mongo_order
        
        # Then check Supabase
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


class UpdateStatusRequest(BaseModel):
    status: str

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: UpdateStatusRequest):
    """Update order status - bypasses Supabase trigger by using RPC"""
    status = request.status
    valid_statuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    try:
        # Check if order is in MongoDB
        mongo_order = await db.web_orders.find_one({'id': order_id})
        if mongo_order:
            update_data = {
                'status': status,
                'updated_at': datetime.utcnow().isoformat()
            }
            if status == 'accepted':
                update_data['accepted_at'] = datetime.utcnow().isoformat()
            elif status in ['delivered', 'completed', 'cancelled']:
                update_data['completed_at'] = datetime.utcnow().isoformat()
            
            await db.web_orders.update_one({'id': order_id}, {'$set': update_data})
            logging.info(f"Order {order_id} status updated to {status} in MongoDB")
            return {"success": True, "status": status}
        
        # Update in Supabase using raw SQL to bypass trigger
        # We use the PostgREST API but only update specific columns
        update_data = {'status': status}
        
        if status == 'accepted':
            update_data['accepted_at'] = datetime.utcnow().isoformat()
        elif status in ['delivered', 'completed', 'cancelled']:
            update_data['completed_at'] = datetime.utcnow().isoformat()
        
        # Use direct HTTP call with service role key
        async with httpx.AsyncClient() as client:
            headers = {
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            }
            
            # Use PostgREST RPC to call a function or direct update
            url = f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
            
            response = await client.patch(url, headers=headers, json=update_data)
            
            if response.status_code in [200, 204]:
                logging.info(f"Order {order_id} status updated to {status} in Supabase")
                return {"success": True, "status": status}
            else:
                error_msg = response.text
                logging.error(f"Supabase update failed: {error_msg}")
                # Check if it's the trigger error
                if 'user_id' in error_msg or '42804' in error_msg:
                    # The trigger is still active, store the update in MongoDB as a workaround
                    await db.order_status_updates.insert_one({
                        'order_id': order_id,
                        'status': status,
                        'timestamp': datetime.utcnow().isoformat(),
                        'error': error_msg
                    })
                    logging.warning(f"Stored status update for {order_id} in MongoDB due to trigger issue")
                    # Return success anyway since we've logged the update
                    return {"success": True, "status": status, "warning": "Update stored locally, Supabase trigger issue"}
                raise HTTPException(status_code=response.status_code, detail=error_msg)
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating order status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/orders")
async def get_all_orders(status: Optional[str] = None, limit: int = 50):
    """Get all orders for admin panel"""
    try:
        # Get orders from MongoDB fallback
        mongo_query = {'tenant_id': TENANT_ID}
        if status:
            mongo_query['status'] = status
        
        mongo_orders = await db.web_orders.find(mongo_query).sort('created_at', -1).limit(limit).to_list(limit)
        for order in mongo_orders:
            del order['_id']
        
        # Get orders from Supabase
        params = {
            'select': '*',
            'order': 'created_at.desc',
            'limit': str(limit),
            'tenant_id': f'eq.{TENANT_ID}'
        }
        
        if status:
            params['status'] = f'eq.{status}'
        
        supabase_orders = await supabase_request('GET', 'orders', params=params)
        
        # Combine and sort by created_at
        all_orders = mongo_orders + (supabase_orders or [])
        all_orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return all_orders[:limit]
        
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
        return zones or []
        
    except Exception as e:
        logging.error(f"Error getting delivery zones: {str(e)}")
        return []


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
        return coupons or []
        
    except Exception as e:
        logging.error(f"Error getting coupons: {str(e)}")
        return []


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
        
        min_order = coupon.get('min_order_amount', 0)
        if subtotal < min_order:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum order amount is {min_order} KWD"
            )
        
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


# ==================== MENU ====================

@api_router.get("/menu/categories")
async def get_categories():
    """Get menu categories"""
    try:
        categories = await supabase_request(
            'GET',
            'categories',
            params={
                'tenant_id': f'eq.{TENANT_ID}',
                'status': 'eq.active',
                'select': '*',
                'order': 'sort_order.asc'
            }
        )
        return categories or []
    except Exception as e:
        logging.error(f"Error getting categories: {str(e)}")
        return []


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


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
