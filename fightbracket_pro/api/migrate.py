import sqlite3

def migrate():
    conn = sqlite3.connect('fightbracket.db')
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE posts ADD COLUMN attached_event_id VARCHAR;")
        print("Added attached_event_id to posts")
    except Exception as e:
        print("Error altering posts:", e)
        
    try:
        cursor.execute("ALTER TABLE events ADD COLUMN show_on_profile BOOLEAN DEFAULT 0;")
        print("Added show_on_profile to events")
    except Exception as e:
        print("Error altering events:", e)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
