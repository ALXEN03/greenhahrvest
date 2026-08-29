import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .models import Product, Order, OrderItem
from datetime import datetime

User = get_user_model()

def serialize_user(user):
    return {
        "user_id": user.id,
        "name": user.first_name,
        "email": user.email,
        "role": user.role,
        "phone": user.phone,
        "location": user.farm_location if user.role == "FARMER" else user.address,
        "farm_name": user.farm_name if user.role == "FARMER" else None,
        "farm_location": user.farm_location if user.role == "FARMER" else None,
        "address": user.address if user.role == "BUYER" else None,
    }

def serialize_product(product):
    return {
        "product_id": product.id,
        "farmer_id": product.farmer.id,
        "name": product.name,
        "category": product.category,
        "price": float(product.price),
        "unit_type": product.unit_type,
        "min_order_qty": product.min_order_qty,
        "stock_quantity": product.stock_quantity,
        "image_url": product.image_url,
        "harvest_date": product.harvest_date.strftime("%Y-%m-%d") if product.harvest_date else None,
        "is_organic": product.is_organic,
        "is_active": product.is_active
    }

# --- AUTH ENDPOINTS ---

@csrf_exempt
def api_signup(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email").strip().lower()
        password = data.get("password")
        name = data.get("name").strip()
        role = data.get("role").strip().upper()
        phone = data.get("phone", "").strip()
        location = data.get("location", "").strip()

        if not email or not password or not name or not role:
            return JsonResponse({"error": "Missing required fields"}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({"error": "An account with that email already exists"}, status=400)

        # Generate unique username from email
        username = email.split("@")[0]
        counter = 1
        original_username = username
        while User.objects.filter(username=username).exists():
            username = f"{original_username}{counter}"
            counter += 1

        user = User.objects.create(
            username=username,
            email=email,
            first_name=name,
            role=role,
            phone=phone,
        )
        user.set_password(password)
        if role == "FARMER":
            user.farm_location = location
            user.farm_name = f"{name}'s Farm"
        else:
            user.address = location
        user.save()

        login(request, user)
        return JsonResponse(serialize_user(user))
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def api_login(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body)
        email = data.get("email").strip().lower()
        password = data.get("password")

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"error": "Invalid email or password"}, status=400)

        # Authenticate
        user = authenticate(username=user.username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse(serialize_user(user))
        else:
            return JsonResponse({"error": "Invalid email or password"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def api_logout(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})

def api_me(request):
    if request.user.is_authenticated:
        return JsonResponse(serialize_user(request.user))
    return JsonResponse({"error": "Not authenticated"}, status=401)

# --- PRODUCTS ENDPOINTS ---

def api_products_list(request):
    products = Product.objects.filter(is_active=True)
    
    # Retrieve user mapping to simulate local USERS list in app.js
    users = User.objects.filter(role="FARMER")
    serialized_users = [serialize_user(u) for u in users]
    
    serialized_products = [serialize_product(p) for p in products]
    return JsonResponse({
        "products": serialized_products,
        "users": serialized_users
    })

@csrf_exempt
def api_product_create(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not request.user.is_authenticated or request.user.role != "FARMER":
        return JsonResponse({"error": "Unauthorized. Farmer role required."}, status=403)
    try:
        data = json.loads(request.body)
        harvest_date = None
        if data.get("harvest_date"):
            harvest_date = datetime.strptime(data.get("harvest_date"), "%Y-%m-%d").date()

        product = Product.objects.create(
            farmer=request.user,
            name=data.get("name"),
            category=data.get("category", "Vegetables"),
            price=float(data.get("price")),
            unit_type=data.get("unit_type", "Kg"),
            min_order_qty=int(data.get("min_order_qty", 1)),
            stock_quantity=int(data.get("stock_quantity", 0)),
            image_url=data.get("image_url"),
            harvest_date=harvest_date,
            is_organic=(data.get("category") == "Organic")
        )
        return JsonResponse(serialize_product(product))
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def api_product_update_stock(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not request.user.is_authenticated or request.user.role != "FARMER":
        return JsonResponse({"error": "Unauthorized. Farmer role required."}, status=403)
    try:
        data = json.loads(request.body)
        product_id = data.get("product_id")
        new_stock = int(data.get("stock_quantity"))

        product = get_object_or_404(Product, id=product_id)
        if product.farmer != request.user:
            return JsonResponse({"error": "Forbidden"}, status=403)

        product.stock_quantity = new_stock
        product.save()
        return JsonResponse(serialize_product(product))
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
def api_product_delete(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not request.user.is_authenticated or request.user.role != "FARMER":
        return JsonResponse({"error": "Unauthorized. Farmer role required."}, status=403)
    try:
        data = json.loads(request.body)
        product_id = data.get("product_id")

        product = get_object_or_404(Product, id=product_id)
        if product.farmer != request.user:
            return JsonResponse({"error": "Forbidden"}, status=403)

        product.delete()
        return JsonResponse({"message": "Product deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

# --- ORDERS ENDPOINTS ---

def api_orders_list(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    orders = Order.objects.filter(buyer=request.user).order_by("-order_date")
    serialized_orders = []
    for order in orders:
        items = []
        for item in order.items.all():
            items.append({
                "item_id": item.item_id,
                "order_id": order.order_id,
                "product_id": item.product.id,
                "quantity": item.quantity,
                "price_at_purchase": float(item.price_at_purchase)
            })
        
        serialized_orders.append({
            "order_id": order.order_id,
            "buyer_id": order.buyer.id,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "order_date": order.order_date.isoformat(),
            "items": items
        })
    return JsonResponse(serialized_orders, safe=False)

@csrf_exempt
def api_order_create(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        data = json.loads(request.body)
        items_data = data.get("items", [])
        if not items_data:
            return JsonResponse({"error": "Empty order"}, status=400)

        # Pre-validation: Verify stock for all items
        products_to_update = []
        total_amount = 0
        
        for item_data in items_data:
            pid = item_data.get("product_id")
            qty = int(item_data.get("quantity"))
            price = float(item_data.get("price_at_purchase"))
            
            product = get_object_or_404(Product, id=pid)
            if product.stock_quantity < qty:
                return JsonResponse({
                    "error": f"Insufficient stock for {product.name}. Only {product.stock_quantity} left."
                }, status=400)
            
            if qty < product.min_order_qty:
                return JsonResponse({
                    "error": f"Minimum order quantity for {product.name} is {product.min_order_qty}."
                }, status=400)
                
            products_to_update.append((product, qty))
            total_amount += price * qty

        # Create Order
        order_id = f"ORD-{int(datetime.now().timestamp() * 1000)}"
        order = Order.objects.create(
            order_id=order_id,
            buyer=request.user,
            total_amount=total_amount,
            status="Placed",
            delivery_address=request.user.address or "Address not set"
        )

        # Create OrderItems and deduct stock
        for idx, (product, qty) in enumerate(products_to_update):
            OrderItem.objects.create(
                item_id=f"{order_id}-{idx + 1}",
                order=order,
                product=product,
                quantity=qty,
                price_at_purchase=product.price
            )
            product.stock_quantity -= qty
            product.save()

        # Return serialized order
        return JsonResponse({
            "order_id": order.order_id,
            "total_amount": float(order.total_amount),
            "status": order.status,
            "order_date": order.order_date.isoformat()
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def api_farmer_orders_list(request):
    if not request.user.is_authenticated or request.user.role != 'FARMER':
        return JsonResponse({"error": "Unauthorized. Farmer role required."}, status=403)
    
    # Get all orders containing products owned by this farmer
    orders = Order.objects.filter(items__product__farmer=request.user).distinct().order_by("-order_date")
    serialized_orders = []
    
    for order in orders:
        items = []
        farmer_total = 0
        for item in order.items.filter(product__farmer=request.user):
            line_total = float(item.price_at_purchase) * item.quantity
            farmer_total += line_total
            items.append({
                "item_id": item.item_id,
                "product_id": item.product.id,
                "name": item.product.name,
                "image_url": item.product.image_url,
                "unit_type": item.product.unit_type,
                "quantity": item.quantity,
                "price_at_purchase": float(item.price_at_purchase),
                "line_total": line_total
            })
        
        serialized_orders.append({
            "order_id": order.order_id,
            "buyer_name": order.buyer.first_name,
            "buyer_phone": order.buyer.phone,
            "buyer_email": order.buyer.email,
            "delivery_address": order.delivery_address,
            "total_amount": float(order.total_amount),
            "farmer_total": farmer_total,
            "status": order.status,
            "order_date": order.order_date.isoformat(),
            "items": items
        })
        
    return JsonResponse(serialized_orders, safe=False)

@csrf_exempt
def api_order_update_status(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    if not request.user.is_authenticated or request.user.role != 'FARMER':
        return JsonResponse({"error": "Unauthorized. Farmer role required."}, status=403)
    
    try:
        data = json.loads(request.body)
        order_id = data.get("order_id")
        new_status = data.get("status")
        
        if not order_id or not new_status:
            return JsonResponse({"error": "Missing order_id or status"}, status=400)
            
        order = get_object_or_404(Order, order_id=order_id)
        
        # Verify the farmer owns at least one product in this order
        has_product = order.items.filter(product__farmer=request.user).exists()
        if not has_product:
            return JsonResponse({"error": "Forbidden. You do not have products in this order."}, status=403)
            
        if new_status not in [choice[0] for choice in Order.STATUS_CHOICES]:
            return JsonResponse({"error": "Invalid status value"}, status=400)
            
        order.status = new_status
        order.save()
        
        return JsonResponse({"message": "Order status updated successfully", "status": order.status})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


# --- HTML PAGE RENDERERS ---

def page_landing(request):
    farmer_count = User.objects.filter(role='FARMER').count()
    product_count = Product.objects.filter(is_active=True).count()
    return render(request, "landing.html", {
        'farmer_count': farmer_count,
        'product_count': product_count
    })

def page_index(request):
    return render(request, "index.html")

def page_auth(request):
    return render(request, "auth.html")

def page_product(request):
    return render(request, "product.html")

def page_cart(request):
    return render(request, "cart.html")

def page_wishlist(request):
    return render(request, "wishlist.html")

def page_orders(request):
    return render(request, "orders.html")

def page_farmer(request):
    return render(request, "farmer.html")

