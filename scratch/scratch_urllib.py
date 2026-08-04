import urllib.request
import json

headers = {
    "Authorization": "Bearer 55c386d66dda4be8912737dfde87a195",
    "Content-Type": "application/json"
}

query_tourney = """
    query TournamentQuery($slug: String!) {
      tournament(slug: $slug) {
        id
        events {
          id
          name
        }
      }
    }
"""

req_t = urllib.request.Request("https://api.start.gg/gql/alpha", data=json.dumps({
    "query": query_tourney,
    "variables": {"slug": "space-city-beatdown-july-2026"}
}).encode("utf-8"), headers=headers)

try:
    resp_t = urllib.request.urlopen(req_t)
    data_t = json.loads(resp_t.read().decode('utf-8'))
    event_id = data_t['data']['tournament']['events'][0]['id']

    query_event = """
        query EventQuery($eventId: ID!) {
          event(id: $eventId) {
            id
            name
            entrants(query: {page: 1, perPage: 100}) {
              nodes {
                id
                name
                participants {
                  gamerTag
                }
              }
            }
            sets(page: 1, perPage: 100, sortType: RECENT) {
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
    """

    req_e = urllib.request.Request("https://api.start.gg/gql/alpha", data=json.dumps({
        "query": query_event,
        "variables": {"eventId": event_id}
    }).encode("utf-8"), headers=headers)

    resp_e = urllib.request.urlopen(req_e)
    print(json.dumps(json.loads(resp_e.read().decode('utf-8')), indent=2))
except Exception as e:
    print(f"Error: {e}")
