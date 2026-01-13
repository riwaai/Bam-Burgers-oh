from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import json

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

# In-memory store for pending payments (in production, use Redis or database)
pending_payments = {}


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
    customer_id: Optional[str] = None
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
    loyalty_points_used: int = 0
    loyalty_points_earned: int = 0

class OrderResponse(BaseModel):
    id: str
    order_number: str
    status: str
    created_at: str
    payment_url: Optional[str] = None
    requires_payment: bool = False

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

async def create_order_in_db(request: CreateOrderRequest, payment_status: str = 'pending', transaction_id: str = None, provider_response: dict = None) -> dict:
    """Create order in Supabase database"""
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
        'customer_id': request.customer_id if request.customer_id else None,
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
        'payment_status': payment_status,
        'notes': request.notes,
    }
    
    # Insert order
    await supabase_request('POST', 'orders', data=order_data)
    logging.info(f"Order created: {order_id} - {order_number}")
    
    # Insert order items
    if request.items:
        for item in request.items:
            order_item_id = str(uuid.uuid4())
            
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
            
            # Insert item modifiers
            if item.modifiers:
                for mod in item.modifiers:
                    modifier_data = {
                        'order_item_id': order_item_id,
                        'modifier_id': mod.id if hasattr(mod, 'id') else mod.get('id', ''),
                        'modifier_name_en': mod.name_en if hasattr(mod, 'name_en') else mod.get('name_en', ''),
                        'modifier_name_ar': mod.name_ar if hasattr(mod, 'name_ar') else mod.get('name_ar', ''),
                        'quantity': 1,
                        'price': mod.price if hasattr(mod, 'price') else mod.get('price', 0),
                    }
                    try:
                        await supabase_request('POST', 'order_item_modifiers', data=modifier_data)
                    except Exception as e:
                        logging.warning(f"Could not save modifier: {e}")
    
    # Create payment record if online payment
    if payment_status == 'paid' and transaction_id:
        payment_data = {
            'id': str(uuid.uuid4()),
            'order_id': order_id,
            'payment_method': 'online',
            'provider': 'tap',
            'amount': request.total_amount,
            'currency': 'KWD',
            'status': 'completed',
            'transaction_id': transaction_id,
            'provider_response': provider_response,
            'completed_at': datetime.utcnow().isoformat(),
        }
        await supabase_request('POST', 'payments', data=payment_data)
        logging.info(f"Payment record created for order {order_id}: transaction_id={transaction_id}")
    
    # Handle loyalty points
    if request.customer_id:
        try:
            # Get current customer loyalty points
            customers = await supabase_request('GET', 'customers', params={'id': f'eq.{request.customer_id}', 'select': 'loyalty_points'})
            current_points = customers[0]['loyalty_points'] if customers else 0
            
            # Calculate new balance
            points_spent = request.loyalty_points_used
            points_earned = request.loyalty_points_earned
            new_balance = current_points - points_spent + points_earned
            
            # Update customer loyalty points
            await supabase_request('PATCH', 'customers', 
                data={'loyalty_points': new_balance, 'updated_at': datetime.utcnow().isoformat()},
                params={'id': f'eq.{request.customer_id}'})
            
            # Create loyalty transaction record
            if points_spent > 0 or points_earned > 0:
                loyalty_transaction = {
                    'customer_id': request.customer_id,
                    'order_id': order_id,
                    'points_earned': points_earned,
                    'points_spent': points_spent,
                    'balance_after': new_balance,
                    'notes': f'Order #{order_number}',
                }
                await supabase_request('POST', 'loyalty_transactions', data=loyalty_transaction)
                logging.info(f"Loyalty transaction created for customer {request.customer_id}: +{points_earned}/-{points_spent}")
        except Exception as e:
            logging.warning(f"Could not update loyalty points: {e}")
    
    return {
        'id': order_id,
        'order_number': order_number,
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat(),
    }


@api_router.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest):
    """Create a new order - for cash orders, creates immediately. For online payment, initiates payment first."""
    try:
        # For cash payment, create order immediately
        if request.payment_method != 'tap':
            result = await create_order_in_db(request, payment_status='pending')
            return OrderResponse(
                id=result['id'],
                order_number=result['order_number'],
                status='pending',
                created_at=result['created_at'],
                requires_payment=False
            )
        
        # For online payment, create order with payment_pending status first
        # Then create the Tap charge with the order_id
        frontend_url = os.environ.get('FRONTEND_URL', 'https://bamburgers-fix.preview.emergentagent.com')
        
        # Create order with payment_pending status (won't show in admin until payment confirmed)
        order_result = await create_order_in_db(request, payment_status='payment_pending')
        order_id = order_result['id']
        order_number = order_result['order_number']
        
        logging.info(f"Created pending payment order: {order_id} - {order_number}")
        
        # Create Tap charge with order_id in metadata
        charge_data = {
            "amount": float(request.total_amount),
            "currency": "KWD",
            "customer_initiated": True,
            "threeDSecure": True,
            "save_card": False,
            "description": f"Bam Burgers Order #{order_number}",
            "metadata": {
                "order_id": order_id,
                "order_number": order_number
            },
            "reference": {
                "transaction": order_id,
                "order": order_number
            },
            "receipt": {
                "email": True,
                "sms": True
            },
            "customer": {
                "first_name": request.customer_name.split()[0] if request.customer_name else "Customer",
                "last_name": request.customer_name.split()[-1] if request.customer_name and len(request.customer_name.split()) > 1 else "",
                "email": request.customer_email or "customer@bamburgers.com",
                "phone": {
                    "country_code": "965",
                    "number": request.customer_phone.replace("+965", "").replace(" ", "").replace("-", "") if request.customer_phone else "00000000"
                }
            },
            "merchant": {
                "id": TAP_MERCHANT_ID
            },
            "source": {
                "id": "src_all"
            },
            "redirect": {
                "url": f"{frontend_url}/payment-result?order_id={order_id}"
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.tap.company/v2/charges",
                headers={
                    "Authorization": f"Bearer {TAP_SECRET_KEY}",
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                json=charge_data
            )
            
            if response.status_code == 200:
                result = response.json()
                payment_url = result.get('transaction', {}).get('url')
                charge_id = result.get('id')
                
                logging.info(f"Tap charge created: {charge_id} for order {order_id}")
                
                return OrderResponse(
                    id=order_id,
                    order_number=order_number,
                    status='awaiting_payment',
                    created_at=order_result['created_at'],
                    payment_url=payment_url,
                    requires_payment=True
                )
            else:
                logging.error(f"Tap charge failed: {response.text}")
                # Delete the pending order since payment initiation failed
                try:
                    await supabase_request('DELETE', 'orders', params={'id': f'eq.{order_id}'})
                except:
                    pass
                raise HTTPException(status_code=400, detail="Payment initiation failed")
                
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating order: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/payment/verify/{charge_ref}")
async def verify_payment_old(charge_ref: str):
    """Legacy endpoint - redirects to new verify endpoint"""
    return await verify_payment_new(tap_id=None, ref=charge_ref, order_id=None)


@api_router.get("/payment/verify")
async def verify_payment_new(tap_id: Optional[str] = None, ref: Optional[str] = None, order_id: Optional[str] = None):
    """
    Verify payment status and update order if successful.
    
    New approach: Order is already created with payment_pending status.
    On successful payment, we update the order to paid status.
    """
    try:
        logging.info(f"Payment verification request: tap_id={tap_id}, ref={ref}, order_id={order_id}")
        
        # If we have tap_id from Tap, use it directly to verify
        if tap_id:
            # Verify charge with Tap API using the tap_id (charge_id)
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.tap.company/v2/charges/{tap_id}",
                    headers={
                        "Authorization": f"Bearer {TAP_SECRET_KEY}",
                        "accept": "application/json"
                    }
                )
                
                logging.info(f"Tap API response status: {response.status_code}")
                
                if response.status_code != 200:
                    logging.error(f"Tap verification failed: {response.text}")
                    return {
                        "success": False,
                        "status": "verification_failed",
                        "message": "Could not verify payment with Tap"
                    }
                
                charge_data = response.json()
                charge_status = charge_data.get('status', '').upper()
                transaction_id = charge_data.get('id')
                
                # Get order_id from charge metadata or reference
                charge_order_id = charge_data.get('metadata', {}).get('order_id') or charge_data.get('reference', {}).get('transaction') or order_id
                charge_order_number = charge_data.get('metadata', {}).get('order_number') or charge_data.get('reference', {}).get('order')
                
                logging.info(f"Tap charge {tap_id} status: {charge_status}, order_id: {charge_order_id}")
                
                # Check if payment was successful
                if charge_status == 'CAPTURED':
                    if charge_order_id:
                        # Update the existing order to paid status
                        try:
                            update_data = {
                                'payment_status': 'paid',
                                'status': 'pending',  # Now it's a real pending order
                                'transaction_id': transaction_id,
                                'updated_at': datetime.utcnow().isoformat()
                            }
                            await supabase_request('PATCH', 'orders', data=update_data, params={'id': f'eq.{charge_order_id}'})
                            logging.info(f"Order {charge_order_id} updated to paid status")
                            
                            # Create payment record
                            payment_data = {
                                'id': str(uuid.uuid4()),
                                'order_id': charge_order_id,
                                'payment_method': 'online',
                                'provider': 'tap',
                                'amount': charge_data.get('amount', 0),
                                'currency': 'KWD',
                                'status': 'completed',
                                'transaction_id': transaction_id,
                                'provider_response': charge_data,
                                'completed_at': datetime.utcnow().isoformat(),
                            }
                            try:
                                await supabase_request('POST', 'payments', data=payment_data)
                                logging.info(f"Payment record created for order {charge_order_id}")
                            except Exception as e:
                                logging.warning(f"Could not create payment record: {e}")
                            
                            # Get the order number if we don't have it
                            if not charge_order_number:
                                orders = await supabase_request('GET', 'orders', params={'id': f'eq.{charge_order_id}', 'select': 'order_number'})
                                if orders:
                                    charge_order_number = orders[0].get('order_number')
                            
                            return {
                                "success": True,
                                "status": "paid",
                                "order_id": charge_order_id,
                                "order_number": charge_order_number or "",
                                "transaction_id": transaction_id,
                                "message": "Payment successful! Order confirmed."
                            }
                        except Exception as e:
                            logging.error(f"Failed to update order: {e}")
                            import traceback
                            traceback.print_exc()
                            return {
                                "success": True,
                                "status": "paid",
                                "order_id": charge_order_id,
                                "order_number": charge_order_number or "",
                                "transaction_id": transaction_id,
                                "message": "Payment successful but order update failed. Contact support."
                            }
                    else:
                        logging.warning(f"Payment CAPTURED but no order_id found in charge data")
                        return {
                            "success": True,
                            "status": "paid",
                            "order_id": "",
                            "order_number": "",
                            "transaction_id": transaction_id,
                            "message": "Payment successful! Order will be processed shortly."
                        }
                
                elif charge_status in ['CANCELLED', 'FAILED', 'DECLINED', 'RESTRICTED', 'VOID', 'TIMEDOUT', 'ABANDONED']:
                    # Delete the pending order since payment failed
                    if charge_order_id:
                        try:
                            await supabase_request('DELETE', 'orders', params={'id': f'eq.{charge_order_id}'})
                            logging.info(f"Deleted failed payment order: {charge_order_id}")
                        except Exception as e:
                            logging.warning(f"Could not delete failed order: {e}")
                    
                    return {
                        "success": False,
                        "status": "failed",
                        "message": f"Payment {charge_status.lower()}. Please try again."
                    }
                
                elif charge_status in ['INITIATED', 'IN_PROGRESS']:
                    return {
                        "success": False,
                        "status": "pending",
                        "message": "Payment is still being processed"
                    }
                
                else:
                    logging.warning(f"Unknown charge status: {charge_status}")
                    return {
                        "success": False,
                        "status": "pending",
                        "message": f"Payment status: {charge_status}"
                    }
        
        # If we have order_id but no tap_id, we need to find the charge
        elif order_id:
            # The order exists - check its payment status
            orders = await supabase_request('GET', 'orders', params={'id': f'eq.{order_id}', 'select': '*'})
            if orders:
                order = orders[0]
                if order.get('payment_status') == 'paid':
                    return {
                        "success": True,
                        "status": "paid",
                        "order_id": order_id,
                        "order_number": order.get('order_number', ''),
                        "transaction_id": order.get('transaction_id', ''),
                        "message": "Payment already confirmed!"
                    }
                else:
                    return {
                        "success": False,
                        "status": "pending",
                        "message": "Waiting for payment verification. Please check with Tap."
                    }
            else:
                return {
                    "success": False,
                    "status": "not_found",
                    "message": "Order not found"
                }
        
        else:
            return {
                "success": False,
                "status": "invalid",
                "message": "No payment reference provided"
            }
                
    except Exception as e:
        logging.error(f"Payment verification error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "status": "error",
            "message": str(e)
        }


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID with items, modifiers, and payment info"""
    try:
        orders = await supabase_request('GET', 'orders', params={'id': f'eq.{order_id}', 'select': '*'})
        if not orders:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = orders[0]
        
        # Get items with modifiers
        items = await supabase_request('GET', 'order_items', params={'order_id': f'eq.{order_id}', 'select': '*'})
        items_with_modifiers = []
        for item in (items or []):
            modifiers = await supabase_request('GET', 'order_item_modifiers', params={
                'order_item_id': f'eq.{item["id"]}',
                'select': '*'
            })
            item['modifiers'] = modifiers or []
            items_with_modifiers.append(item)
        order['items'] = items_with_modifiers
        
        # Get payment info
        payments = await supabase_request('GET', 'payments', params={
            'order_id': f'eq.{order_id}',
            'select': '*'
        })
        if payments:
            order['payment'] = payments[0]
        
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
        
        # Get payment info
        payments = await supabase_request('GET', 'payments', params={
            'order_id': f'eq.{order["id"]}',
            'select': '*'
        })
        if payments:
            order['payment'] = payments[0]
        
        return order
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: UpdateStatusRequest):
    """Update order status"""
    valid_statuses = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']
    
    if request.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
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
    """Get all orders for admin panel with payment info"""
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
        
        # Get payment info for each order
        for order in (orders or []):
            payments = await supabase_request('GET', 'payments', params={
                'order_id': f'eq.{order["id"]}',
                'select': '*'
            })
            if payments:
                order['payment'] = payments[0]
        
        return orders or []
    except Exception as e:
        logging.error(f"Error getting orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/tap/webhook")
async def tap_webhook(request: Request):
    """Handle Tap payment webhook"""
    try:
        data = await request.json()
        
        charge_id = data.get('id')
        status = data.get('status', '').upper()
        charge_ref = data.get('reference', {}).get('order') or data.get('metadata', {}).get('charge_ref')
        
        logging.info(f"Tap webhook received: charge={charge_id}, status={status}, ref={charge_ref}")
        
        if charge_ref and status == 'CAPTURED':
            pending = pending_payments.get(charge_ref)
            if pending and 'order_data' in pending:
                # Create order
                order_request = CreateOrderRequest(**pending['order_data'])
                await create_order_in_db(
                    order_request, 
                    payment_status='paid',
                    transaction_id=charge_id
                )
                del pending_payments[charge_ref]
                logging.info(f"Order created via webhook for ref {charge_ref}")
        
        return {"received": True}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        return {"received": True}


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


# ==================== MENU ====================

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


# ==================== MODIFIERS ====================

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


@api_router.get("/menu/items/{item_id}/modifiers")
async def get_item_modifiers(item_id: str):
    """Get all modifier groups and modifiers for an item"""
    try:
        links = await supabase_request('GET', 'item_modifier_groups', params={
            'item_id': f'eq.{item_id}',
            'select': '*',
            'order': 'sort_order.asc'
        })
        
        if not links:
            return []
        
        group_ids = [link['modifier_group_id'] for link in links]
        
        groups = await supabase_request('GET', 'modifier_groups', params={
            'id': f'in.({",".join(group_ids)})',
            'status': 'eq.active',
            'select': '*'
        })
        
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


# ==================== ADMIN SETTINGS ====================

@api_router.get("/admin/settings")
async def get_admin_settings():
    """Get admin settings"""
    return {
        "tap_public_key": TAP_PUBLIC_KEY,
        "tap_secret_key_set": bool(TAP_SECRET_KEY),
    }


@api_router.get("/")
async def root():
    return {"message": "Bam Burgers API", "version": "2.0.0"}


# Include the router
app.include_router(api_router)
