from square.client import Square, SquareEnvironment
import uuid
import json
import os
from datetime import datetime, timedelta

access_token = os.environ.get('SQUARE_ACCESS_TOKEN')
location_id = os.environ.get('SQUARE_LOCATION_ID')

client = Square(
    token=access_token,
    environment=SquareEnvironment.PRODUCTION
)

def create_link(date_str, guest_count):
    try:
        response = client.checkout.payment_links.create(
            idempotency_key=str(uuid.uuid4()),
            quick_pay={
                "name": f"Succulent Workshop - {date_str} ({guest_count} Guest{'s' if guest_count > 1 else ''})",
                "price_money": {
                    "amount": guest_count * 10000,
                    "currency": "AUD"
                },
                "location_id": location_id
            },
            checkout_options={
                "redirect_url": "https://succulentdriftwoods.com.au/?booked=1",
                "custom_fields": [
                    {"title": "Guest names (one per line)"}
                ]
            }
        )
        return response.payment_link.long_url
    except Exception as e:
        print(f"Error creating link for {date_str} with {guest_count} guests: {e}")
        return None

# Generate dates for the next 52 Saturdays (1 year) from this coming Saturday
today = datetime.now()
days_until_saturday = (5 - today.weekday()) % 7
if days_until_saturday == 0:
    days_until_saturday = 7  # if today is Saturday, start from next Saturday
next_saturday = today + timedelta(days=days_until_saturday)

dates = [(next_saturday + timedelta(weeks=i)).strftime('%Y-%m-%d') for i in range(52)]

links_data = {}
for date in dates:
    links_data[date] = {}
    for guests in range(1, 11):
        print(f"Generating link for {date}, {guests} guests...")
        url = create_link(date, guests)
        if url:
            links_data[date][str(guests)] = url

with open('payment_links.json', 'w') as f:
    json.dump(links_data, f, indent=2)

print("Payment links generated and saved to payment_links.json")
