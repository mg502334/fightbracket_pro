import uuid

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/api/db.py'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

integration_model = """
class DBUserIntegration(Base):
    __tablename__ = "user_integrations"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, nullable=False) # References users.id
    integration_type = Column(String, nullable=False) # e.g. "startgg"
    encrypted_api_key = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
"""

if 'DBUserIntegration' not in text:
    idx = text.find('class DBFriendship')
    new_text = text[:idx] + integration_model + '\n' + text[idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Added DBUserIntegration model to api/db.py')
else:
    print('DBUserIntegration already exists')
