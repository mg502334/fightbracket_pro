import urllib.request
import json

url = "https://api.start.gg/gql/alpha"
headers = {
    "Authorization": "Bearer 55c386d66dda4be8912737dfde87a195",
    "Content-Type": "application/json"
}

query = """
    query TournamentQuery($slug: String!) {
      tournament(slug: $slug) {
        id
        name
        events {
          id
          name
          videogame { id name }
          entrants(query: {page: 1, perPage: 40}) {
            nodes {
              id
              name
            }
          }
          sets(page: 1, perPage: 20, sortType: STANDARD) {
            nodes {
              id
              state
              fullRoundText
              round
              winnerId
              stream {
                streamName
                streamSource
              }
              slots {
                entrant {
                  id
                  name
                }
                standing {
                  stats {
                    score {
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
"""

data = json.dumps({
    "query": query,
    "variables": {"slug": "space-city-beatdown-july-2026"}
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
