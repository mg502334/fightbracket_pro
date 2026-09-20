import requests
import json

query = """
query TournamentQuery($slug: String!) {
  tournament(slug: $slug) {
    events {
      sets(page: 1, perPage: 5, sortType: STANDARD) {
        nodes {
          id
          stream {
            streamName
            streamSource
          }
        }
      }
    }
  }
}
"""

headers = {
    "Authorization": "Bearer 55c386d66dda4be8912737dfde87a195",
    "Content-Type": "application/json"
}

resp = requests.post(
    "https://api.start.gg/gql/alpha",
    json={"query": query, "variables": {"slug": "space-city-beatdown-july-2026"}},
    headers=headers
)
print(json.dumps(resp.json(), indent=2))
