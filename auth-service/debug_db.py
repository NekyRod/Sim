import psycopg2
import sys

def test_conn(host, dbname, user, password, port):
    print(f"Testing: host={host}, db={dbname}, user={user}, port={port}")
    try:
        conn = psycopg2.connect(host=host, dbname=dbname, user=user, password=password, port=port)
        print("✅ SUCCESS")
        conn.close()
    except Exception as e:
        # Get raw bytes if possible to avoid UnicodeDecodeError
        print(f"❌ FAILED: Exception type: {type(e).__name__}")
        if hasattr(e, 'pgerror'):
             print(f"   Raw pgerror: {repr(e.pgerror)}")
        else:
             print(f"   Could not get raw pgerror. Trying repr: {repr(e)}")

print("--- Testing 'simu' / 'password' on localhost ---")
test_conn("localhost", "simu", "admiSim", "password", 5432)

print("\n--- Testing 'sim' / 'password' on localhost ---")
test_conn("localhost", "sim", "admiSim", "password", 5432)

print("\n--- Testing 'sim' / 'RAqk3TqV1hSGlVooeJHd' on 127.0.0.1 ---")
test_conn("127.0.0.1", "sim", "admiSim", "RAqk3TqV1hSGlVooeJHd", 5432)
