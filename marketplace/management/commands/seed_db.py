import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from marketplace.models import Product
from datetime import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial users and products to database'

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")
        
        # Create users
        farmers_data = [
            { "username": "anita", "name": "Anita Patil", "email": "anita@demo.com", "phone": "919812345671", "location": "Ratnagiri, MH", "farm_name": "Patel Mango Garden" },
            { "username": "suresh", "name": "Suresh Reddy", "email": "suresh@demo.com", "phone": "919812345672", "location": "Guntur, AP", "farm_name": "Reddy Grains" },
            { "username": "meena", "name": "Meena Singh", "email": "meena@demo.com", "phone": "919812345673", "location": "Ludhiana, PB", "farm_name": "Singh Organic Farms" },
            { "username": "joseph", "name": "Joseph Thomas", "email": "joseph@demo.com", "phone": "919812345674", "location": "Wayanad, KL", "farm_name": "Kerala Spices & Fruits" }
        ]
        
        farmers = {}
        for fd in farmers_data:
            user, created = User.objects.get_or_create(
                username=fd["username"],
                defaults={
                    "first_name": fd["name"],
                    "email": fd["email"],
                    "role": "FARMER",
                    "phone": fd["phone"],
                    "farm_location": fd["location"],
                    "farm_name": fd["farm_name"]
                }
            )
            if created:
                user.set_password("demo1234")
                user.save()
                self.stdout.write(f"Created farmer user: {user.username}")
            farmers[fd["username"]] = user

        # Create demo buyer
        buyer, created = User.objects.get_or_create(
            username="buyer",
            defaults={
                "first_name": "Demo Buyer",
                "email": "buyer@demo.com",
                "role": "BUYER",
                "phone": "919999999999",
                "address": "12 Market Road, Bengaluru"
            }
        )
        if created:
            buyer.set_password("demo1234")
            buyer.save()
            self.stdout.write(f"Created buyer user: {buyer.username}")

        # Create products
        products_data = [
            { "id": 102, "farmer": "anita", "name": "Alphonso Mangoes", "category": "Fruits", "price": 480, "unit_type": "Kg", "min_order_qty": 3, "stock_quantity": 120, "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=70", "harvest_date": "2026-06-28" },
            { "id": 103, "farmer": "suresh", "name": "Sona Masuri Rice", "category": "Grains", "price": 5200, "unit_type": "Quintal", "min_order_qty": 1, "stock_quantity": 60, "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=70", "harvest_date": "2026-05-15" },
            { "id": 104, "farmer": "meena", "name": "Organic Wheat", "category": "Organic", "price": 3800, "unit_type": "Quintal", "min_order_qty": 1, "stock_quantity": 90, "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=70", "harvest_date": "2026-04-20" },
            { "id": 105, "farmer": "joseph", "name": "Farm-Fresh Bananas", "category": "Fruits", "price": 55, "unit_type": "Sack", "min_order_qty": 1, "stock_quantity": 40, "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&q=70", "harvest_date": "2026-07-08" },
            { "id": 107, "farmer": "meena", "name": "Organic Turmeric Root", "category": "Organic", "price": 220, "unit_type": "Kg", "min_order_qty": 1, "stock_quantity": 70, "image_url": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=70", "harvest_date": "2026-03-12" },
            { "id": 108, "farmer": "suresh", "name": "Yellow Corn", "category": "Grains", "price": 2400, "unit_type": "Quintal", "min_order_qty": 1, "stock_quantity": 110, "image_url": "https://images.unsplash.com/photo-1601593768799-76a04ea3f8f7?w=600&q=70", "harvest_date": "2026-06-01" },
        ]

        for pd in products_data:
            harvest_dt = datetime.strptime(pd["harvest_date"], "%Y-%m-%d").date()
            product, created = Product.objects.get_or_create(
                id=pd["id"],
                defaults={
                    "farmer": farmers[pd["farmer"]],
                    "name": pd["name"],
                    "category": pd["category"],
                    "price": pd["price"],
                    "unit_type": pd["unit_type"],
                    "min_order_qty": pd["min_order_qty"],
                    "stock_quantity": pd["stock_quantity"],
                    "image_url": pd["image_url"],
                    "harvest_date": harvest_dt,
                    "is_organic": pd["category"] == "Organic",
                    "is_active": True
                }
            )
            if created:
                self.stdout.write(f"Created product: {product.name}")
        
        self.stdout.write("Database seeded successfully!")
