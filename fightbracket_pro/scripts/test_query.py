import urllib.request, json, os
from dotenv import load_dotenv

load_dotenv()
token = os.environ.get("STARTGG_API_KEY", "")

query = """
query EventSets($eventId: ID!, $page: Int!) {
  event(id: $eventId) {
    sets(page: $page, perPage: 50, sortType: STANDARD) {
      pageInfo { totalPages }
      nodes {
        id identifier round
        slots {
          prereqSet { id }
        }
        phaseGroup { displayIdentifier }
      }
    }
  }
}
"""

req = urllib.request.Request('https://api.start.gg/gql/alpha', method='POST')
req.add_header('Content-Type', 'application/json')
if token:
    req.add_header('Authorization', f'Bearer {token}')

data = json.dumps({
    "query": query,
    "variables": {"eventId": "1098906", "page": 1} # using a random event ID if we can't get the user's
}).encode('utf-8')

try:
    with urllib.request.urlopen(req, data=data) as f:
        res = json.loads(f.read().decode('utf-8'))
        print(json.dumps(res, indent=2))
except Exception as e:
    print("Error:", e)
