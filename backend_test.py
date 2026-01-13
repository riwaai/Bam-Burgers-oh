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
BASE_URL = "https://bamburgers-fix.preview.emergentagent.com"
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
                "item_id": "c2222222-2222-2222-2222-222222222222",
                "item_name_en": "Cheese Burger",
                "item_name_ar": "تشيز برجر",
                "quantity": 2,
                "unit_price": 1.85,
                "total_price": 3.70,
                "notes": "No onions",
                "modifiers": []
            },
            {
                "item_id": "e5555555-5555-5555-5555-555555555555", 
                "item_name_en": "Regular Fries",
                "item_name_ar": "بطاطس عادية متوسطة",
                "quantity": 1,
                "unit_price": 0.95,
                "total_price": 0.95,
                "notes": "",
                "modifiers": []
            }
        ],
        "subtotal": 4.65,
        "discount_amount": 0,
        "delivery_fee": 1.0,
        "total_amount": 5.65,
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

def test_payment_verification():
    """Test 6: Payment Verification API - GET /api/payment/verify/{charge_ref}"""
    print("\n" + "="*50)
    print("TEST 6: Payment Verification API")
    print("="*50)
    
    # Test with a non-existent charge_ref (should return success: false, status: "not_found")
    fake_charge_ref = "non-existent-charge-ref-12345"
    
    success, result = test_api_endpoint("GET", f"/payment/verify/{fake_charge_ref}", expected_status=200)
    
    if success:
        print("✅ Payment verification endpoint accessible")
        if isinstance(result, dict):
            success_flag = result.get('success')
            status = result.get('status')
            message = result.get('message')
            print(f"Success: {success_flag}")
            print(f"Status: {status}")
            print(f"Message: {message}")
            
            # Should return success: false and status: "not_found" for non-existent ref
            if success_flag == False and status == "not_found":
                print("✅ Correct response for non-existent charge reference")
                return True
            else:
                print("❌ Unexpected response format or values")
                return False
        else:
            print("❌ Invalid response format")
            return False
    else:
        print(f"❌ Payment verification failed: {result}")
        return False

def test_tap_payment_order_creation():
    """Test 7: Order Creation with Tap Payment - POST /api/orders"""
    print("\n" + "="*50)
    print("TEST 7: Tap Payment Order Creation")
    print("="*50)
    
    # Create order data with tap payment method
    order_data = {
        "order_type": "delivery",
        "customer_name": "Fatima Al-Zahra",
        "customer_phone": "+96599999999",
        "customer_email": "fatima@test.com",
        "delivery_address": {
            "area": "Salmiya",
            "block": "5",
            "street": "Test Street",
            "building": "10"
        },
        "items": [
            {
                "item_id": "cb5db91b-7c76-431a-96df-c53421c82d6a",
                "item_name_en": "Chicken BAM!",
                "item_name_ar": "سندويش بام دجاج",
                "quantity": 1,
                "unit_price": 1.75,
                "total_price": 1.75
            }
        ],
        "subtotal": 1.75,
        "delivery_fee": 0.5,
        "total_amount": 2.25,
        "payment_method": "tap"
    }
    
    success, result = test_api_endpoint("POST", "/orders", data=order_data, expected_status=200)
    
    if success:
        print("✅ Tap payment order creation successful")
        if isinstance(result, dict):
            requires_payment = result.get('requires_payment')
            payment_url = result.get('payment_url')
            order_number = result.get('order_number')
            order_id = result.get('id')
            
            print(f"Requires Payment: {requires_payment}")
            print(f"Payment URL: {payment_url}")
            print(f"Order Number: {order_number}")
            print(f"Order ID: {order_id}")
            
            # Should return requires_payment: true and payment_url starting with https://goSellJSLib
            if requires_payment == True and payment_url and payment_url.startswith('https://'):
                print("✅ Correct tap payment response - requires payment and has payment URL")
                # Order number should be empty since order isn't created yet
                if not order_number or order_number == "":
                    print("✅ Order number correctly empty (order not created yet)")
                    return True, order_id  # Return the charge_ref for potential verification
                else:
                    print("❌ Order number should be empty for tap payment before verification")
                    return False, None
            else:
                print("❌ Missing required payment fields or incorrect values")
                return False, None
        else:
            print("❌ Invalid response format")
            return False, None
    else:
        print(f"❌ Tap payment order creation failed: {result}")
        return False, None

def test_cash_payment_order_creation():
    """Test 8: Order Creation with Cash Payment - POST /api/orders"""
    print("\n" + "="*50)
    print("TEST 8: Cash Payment Order Creation")
    print("="*50)
    
    # Create order data with cash payment method
    order_data = {
        "order_type": "delivery",
        "customer_name": "Omar Al-Mansouri",
        "customer_phone": "+96599888777",
        "customer_email": "omar@test.com",
        "delivery_address": {
            "area": "Hawalli",
            "block": "3",
            "street": "Main Street",
            "building": "25"
        },
        "items": [
            {
                "item_id": "e1111111-1111-1111-1111-111111111111",
                "item_name_en": "Chicken Strips",
                "item_name_ar": "شرائح الدجاج",
                "quantity": 2,
                "unit_price": 1.25,
                "total_price": 2.50
            }
        ],
        "subtotal": 2.50,
        "delivery_fee": 0.5,
        "total_amount": 3.0,
        "payment_method": "cash"
    }
    
    success, result = test_api_endpoint("POST", "/orders", data=order_data, expected_status=200)
    
    if success:
        print("✅ Cash payment order creation successful")
        if isinstance(result, dict):
            requires_payment = result.get('requires_payment')
            order_number = result.get('order_number')
            order_id = result.get('id')
            
            print(f"Requires Payment: {requires_payment}")
            print(f"Order Number: {order_number}")
            print(f"Order ID: {order_id}")
            
            # Should immediately create order with order_number and order_id
            if requires_payment == False and order_number and order_id:
                print("✅ Correct cash payment response - order created immediately")
                return True, order_id
            else:
                print("❌ Missing order details or incorrect payment requirement")
                return False, None
        else:
            print("❌ Invalid response format")
            return False, None
    else:
        print(f"❌ Cash payment order creation failed: {result}")
        return False, None

def test_admin_orders_with_payment_info():
    """Test 9: Admin Orders with Payment Info - GET /api/admin/orders"""
    print("\n" + "="*50)
    print("TEST 9: Admin Orders with Payment Info")
    print("="*50)
    
    success, result = test_api_endpoint("GET", "/admin/orders", expected_status=200)
    
    if success:
        print("✅ Admin orders retrieval successful")
        if isinstance(result, list):
            print(f"Number of orders returned: {len(result)}")
            if len(result) > 0:
                sample_order = result[0]
                print(f"Sample order number: {sample_order.get('order_number', 'N/A')}")
                print(f"Sample order payment status: {sample_order.get('payment_status', 'N/A')}")
                
                # Check if payment info is included when available
                payment_info = sample_order.get('payment')
                if payment_info:
                    print(f"Payment info included: {payment_info.get('provider', 'N/A')}")
                else:
                    print("No payment info in sample order (may be cash order)")
                
                return True
            else:
                print("✅ No orders found (empty list is valid)")
                return True
        else:
            print("❌ Expected array of orders")
            return False
    else:
        print(f"❌ Admin orders retrieval failed: {result}")
        return False

def main():
    """Run all backend API tests"""
    print("Bam Burgers Backend API Test Suite")
    print(f"Testing API at: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    results = []
    
    # Test 1: Order Creation (Cash - for baseline)
    order_id, order_number = test_order_creation()
    results.append(("Order Creation (Cash)", order_id is not None))
    
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
    
    # NEW PAYMENT TESTS - Focus of this testing session
    print("\n" + "🔥"*20)
    print("PAYMENT VERIFICATION FLOW TESTS")
    print("🔥"*20)
    
    # Test 6: Payment Verification API
    payment_verification_success = test_payment_verification()
    results.append(("Payment Verification API", payment_verification_success))
    
    # Test 7: Tap Payment Order Creation
    tap_order_success, charge_ref = test_tap_payment_order_creation()
    results.append(("Tap Payment Order Creation", tap_order_success))
    
    # Test 8: Cash Payment Order Creation
    cash_order_success, cash_order_id = test_cash_payment_order_creation()
    results.append(("Cash Payment Order Creation", cash_order_success))
    
    # Test 9: Admin Orders with Payment Info
    admin_payment_info_success = test_admin_orders_with_payment_info()
    results.append(("Admin Orders with Payment Info", admin_payment_info_success))
    
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
    
    # Focus on payment tests
    payment_tests = results[5:]  # Last 4 tests are payment-related
    payment_passed = sum(1 for _, success in payment_tests if success)
    payment_total = len(payment_tests)
    
    print(f"Payment Flow Tests: {payment_passed}/{payment_total} passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)