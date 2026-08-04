import sys
import os
import uuid

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from api.db import get_db, DBUser, DBUserIdentifier
from api.index import get_user_profile

def run_test():
    db = next(get_db())
    test_user_id = "test-" + str(uuid.uuid4())
    print(f"Testing with user id: {test_user_id}")

    res = get_user_profile(user_id=test_user_id, db=db)
    print("Profile result:")
    print(res)

    identifier = db.query(DBUserIdentifier).filter(DBUserIdentifier.id == test_user_id).first()
    if identifier:
        print(f"\nSUCCESS: Assigned FB ID is {identifier.unique_id}")
    else:
        print("\nFAILED to assign FB ID")

if __name__ == "__main__":
    run_test()
