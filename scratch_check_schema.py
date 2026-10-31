import sqlite3

conn = sqlite3.connect('anpr_history.db')
cursor = conn.cursor()
tables = cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print('Tables:', tables)
for t in tables:
    cols = cursor.execute(f"PRAGMA table_info({t[0]})").fetchall()
    print(f"Table {t[0]}:", [f"{c[1]} ({c[2]})" for c in cols])
conn.close()
