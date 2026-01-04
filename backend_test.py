#!/usr/bin/env python3
"""
Bam Burgers Backend API Test Suite
Tests all backend endpoints for the food ordering system
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from the review request
BASE_URL = "https://foodie-dashboard-4.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_api_endpoint(method, endpoint, data=None, params=None, expected_status=200):
    """Helper function to test API endpoints"""
    url = f"{API_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, params=params, timeout=30)
        elif method == "PATCH":
            response = requests.patch(url, json=data, params=params, timeout=30)
        else:
            return False, f"Unsupported method: {method}"
        
        print(f"{method} {endpoint}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == expected_status:
            try:
                return True, response.json()
            except:
                return True, response.text
        else:
            return False, f"Expected {expected_status}, got {response.status_code}: {response.text}"
            
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}"

def test_order_creation():
    """Test 1: Order Creation - POST /api/orders"""
    print("\n" + "="*50)
    print("TEST 1: Order Creation")
    print("="*50)
    
    # Create realistic order data
    order_data = {
        "order_type": "delivery",
        "customer_name": "Ahmed Al-Rashid",
        "customer_phone": "+96599123456",
        "customer_email": "ahmed.rashid@email.com",
        "delivery_address": {
            "area": "Salmiya",
            "block": "12",
            "street": "Salem Al-Mubarak Street",
            "building": "45",
            "floor": "3",
            "apartment": "12",
            "additional_directions": "Near the mosque",
            "geo_lat": 29.3375,
            "geo_lng": 48.0758
        },
        "delivery_instructions": "Call when you arrive",
        "items": [
            {
                "item_id": "burger_001",
                "item_name_en": "Classic Beef Burger",
                "item_name_ar": "برجر لحم كلاسيكي",
                "quantity": 2,
                "unit_price": 3.5,
                "total_price": 7.0,
                "notes": "No onions",
                "modifiers": []
            },
            {
                "item_id": "fries_001", 
                "item_name_en": "French Fries",
                "item_name_ar": "بطاطس مقلية",
                "quantity": 1,
                "unit_price": 1.5,
                "total_price": 1.5,
                "notes": "",
                "modifiers": []
            }
        ],
        "subtotal": 8.5,
        "discount_amount": 0,
        "delivery_fee": 1.0,
        "total_amount": 9.5,
        "notes": "Please prepare fresh",
        "coupon_code": None
    }
    
    success, result = test_api_endpoint("POST", "/orders", data=order_data, expected_status=200)
    
    if success:
        print("✅ Order creation successful")
        if isinstance(result, dict):
            order_id = result.get('id')
            order_number = result.get('order_number')
            print(f"Order ID: {order_id}")
            print(f"Order Number: {order_number}")
            return order_id, order_number
        else:
            print("❌ Invalid response format")
            return None, None
    else:
        print(f"❌ Order creation failed: {result}")
        return None, None

def test_order_status_update(order_id):
    """Test 2: Order Status Update - PATCH /api/orders/{order_id}/status"""
    print("\n" + "="*50)
    print("TEST 2: Order Status Update")
    print("="*50)
    
    if not order_id:
        print("❌ No order ID available for status update test")
        return False
    
    status_data = {
        "status": "accepted"
    }
    
    success, result = test_api_endpoint("PATCH", f"/orders/{order_id}/status", data=status_data, expected_status=200)
    
    if success:
        print("✅ Order status update successful")
        if isinstance(result, dict) and result.get('success'):
            print(f"Status updated to: {result.get('status')}")
            return True
        else:
            print("❌ Invalid response format")
            return False
    else:
        print(f"❌ Order status update failed: {result}")
        return False

def test_admin_orders():
    """Test 3: Get Admin Orders - GET /api/admin/orders"""
    print("\n" + "="*50)
    print("TEST 3: Get Admin Orders")
    print("="*50)
    
    success, result = test_api_endpoint("GET", "/admin/orders", expected_status=200)
    
    if success:
        print("✅ Admin orders retrieval successful")
        if isinstance(result, list):
            print(f"Number of orders returned: {len(result)}")
            if len(result) > 0:
                print(f"Sample order: {result[0].get('order_number', 'N/A')}")
            return True
        else:
            print("❌ Expected array of orders")
            return False
    else:
        print(f"❌ Admin orders retrieval failed: {result}")
        return False

def test_coupon_validation():
    """Test 4: Coupon Validation - POST /api/coupons/validate?code=SAVE10&subtotal=5"""
    print("\n" + "="*50)
    print("TEST 4: Coupon Validation")
    print("="*50)
    
    params = {
        "code": "SAVE10",
        "subtotal": 5
    }
    
    success, result = test_api_endpoint("POST", "/coupons/validate", params=params, expected_status=200)
    
    if success:
        print("✅ Coupon validation successful")
        if isinstance(result, dict):
            valid = result.get('valid')
            discount_amount = result.get('discount_amount')
            print(f"Coupon valid: {valid}")
            print(f"Discount amount: {discount_amount}")
            if valid and discount_amount is not None:
                return True
            else:
                print("❌ Invalid coupon response")
                return False
        else:
            print("❌ Invalid response format")
            return False
    else:
        print(f"❌ Coupon validation failed: {result}")
        return False

def test_loyalty_settings():
    """Test 5: Loyalty Settings - GET /api/loyalty/settings"""
    print("\n" + "="*50)
    print("TEST 5: Loyalty Settings")
    print("="*50)
    
    success, result = test_api_endpoint("GET", "/loyalty/settings", expected_status=200)
    
    if success:
        print("✅ Loyalty settings retrieval successful")
        if isinstance(result, dict):
            points_per_kwd = result.get('points_per_kwd')
            is_active = result.get('is_active')
            print(f"Points per KWD: {points_per_kwd}")
            print(f"Loyalty active: {is_active}")
            return True
        else:
            print("❌ Invalid response format")
            return False
    else:
        print(f"❌ Loyalty settings retrieval failed: {result}")
        return False

def main():
    """Run all backend API tests"""
    print("Bam Burgers Backend API Test Suite")
    print(f"Testing API at: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = []
    
    # Test 1: Order Creation
    order_id, order_number = test_order_creation()
    results.append(("Order Creation", order_id is not None))
    
    # Test 2: Order Status Update (requires order_id from test 1)
    status_update_success = test_order_status_update(order_id)
    results.append(("Order Status Update", status_update_success))
    
    # Test 3: Admin Orders
    admin_orders_success = test_admin_orders()
    results.append(("Admin Orders", admin_orders_success))
    
    # Test 4: Coupon Validation
    coupon_success = test_coupon_validation()
    results.append(("Coupon Validation", coupon_success))
    
    # Test 5: Loyalty Settings
    loyalty_success = test_loyalty_settings()
    results.append(("Loyalty Settings", loyalty_success))
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)