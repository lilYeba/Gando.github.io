import json
with open('data/image-url-audit.json', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total accessible items: {data['accessible']}")
for item in data['details']:
    if item['status'] == 'ACCESSIBLE':
        print(f"  {item['productId']}: {item['imageUrl']}")
