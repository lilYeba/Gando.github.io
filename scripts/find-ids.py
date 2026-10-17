import sqlite3
conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()
for term in ['tofu', 'ryza', 'bageta', 'pivo', 'kava']:
    c.execute(f"SELECT id FROM products WHERE id LIKE '%{term}%'")
    print(term, [r[0] for r in c.fetchall()])
