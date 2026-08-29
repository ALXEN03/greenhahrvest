from django.urls import path
from . import views

urlpatterns = [
    # Pages
    path('', views.page_landing, name='landing'),
    path('landing.html', views.page_landing, name='landing_html'),
    path('index.html', views.page_index, name='index_html'),
    path('auth.html', views.page_auth, name='auth_html'),
    path('product.html', views.page_product, name='product_html'),
    path('cart.html', views.page_cart, name='cart_html'),
    path('wishlist.html', views.page_wishlist, name='wishlist_html'),
    path('orders.html', views.page_orders, name='orders_html'),
    path('farmer.html', views.page_farmer, name='farmer_html'),

    # APIs
    path('api/auth/signup/', views.api_signup, name='api_signup'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/me/', views.api_me, name='api_me'),
    
    path('api/products/', views.api_products_list, name='api_products_list'),
    path('api/products/create/', views.api_product_create, name='api_product_create'),
    path('api/products/update-stock/', views.api_product_update_stock, name='api_product_update_stock'),
    path('api/products/delete/', views.api_product_delete, name='api_product_delete'),
    
    path('api/orders/', views.api_orders_list, name='api_orders_list'),
    path('api/orders/create/', views.api_order_create, name='api_order_create'),
    path('api/farmer/orders/', views.api_farmer_orders_list, name='api_farmer_orders_list'),
    path('api/orders/update-status/', views.api_order_update_status, name='api_order_update_status'),
]
