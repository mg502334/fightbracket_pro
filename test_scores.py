import urllib.request
import json

query = '''
query TournamentQuery($slug: String!) {
  tournament(slug: $slug) {
    name
    city
    addrState
    venueAddress
    postalCode
    isOnline
  }
}
'''
req = urllib.request.Request('https://api.start.gg/gql/alpha', data=json.dumps({'query': query, 'variables': {'slug': 'space-city-beatdown-july-2026'}}).encode('utf-8'), headers={'Authorization': 'Bearer 55c386d66dda4be8912737dfde87a195', 'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
print(json.dumps(json.loads(resp.read().decode('utf-8')), indent=2))


