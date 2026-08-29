from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('BUYER', 'Buyer'),
        ('FARMER', 'Farmer'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='BUYER')
    phone = models.CharField(max_length=20, blank=True, null=True)
    farm_name = models.CharField(max_length=160, blank=True, null=True)
    farm_location = models.CharField(max_length=200, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Use email as the primary identification field for login/unique keys if needed
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Vegetables', 'Vegetables'),
        ('Fruits', 'Fruits'),
    ]
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='Vegetables')
    price = models.DecimalField(max_digits=10, decimal_places=2)  # maps to price_per_unit in schema.sql
    unit_type = models.CharField(max_length=20, default='kg')
    stock_quantity = models.IntegerField(default=0)
    min_order_qty = models.IntegerField(default=1)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    harvest_date = models.DateField(blank=True, null=True)
    is_organic = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('Placed', 'Placed'),
        ('Confirmed', 'Confirmed'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    PAYMENT_CHOICES = [
        ('COD', 'COD'),
        ('UPI', 'UPI'),
        ('CARD', 'CARD'),
    ]
    order_id = models.CharField(max_length=40, primary_key=True)
    buyer = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Placed')
    payment_method = models.CharField(max_length=10, choices=PAYMENT_CHOICES, default='COD')
    delivery_address = models.TextField(blank=True, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_id

class OrderItem(models.Model):
    item_id = models.CharField(max_length=60, primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.RESTRICT)
    quantity = models.IntegerField()
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.item_id} - {self.product.name} (x{self.quantity})"

