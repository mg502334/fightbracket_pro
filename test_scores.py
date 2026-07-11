import urllib.request
import json

query = '''
query EventQuery($eventId: ID!) {
  event(id: $eventId) {
    name
    sets(page: 1, perPage: 100, sortType: RECENT) {
      nodes {
        fullRoundText
        state
        slots {
          standing { stats { score { value } } }
          entrant { name }
        }
      }
    }
  }
}
'''
req = urllib.request.Request('https://api.start.gg/gql/alpha', data=json.dumps({'query': query, 'variables': {'eventId': 2301919}}).encode('utf-8'), headers={'Authorization': 'Bearer 55c386d66dda4be8912737dfde87a195', 'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req)
d = json.loads(resp.read().decode('utf-8'))
if 'data' not in d or not d['data'].get('event'):
  print(d)
else:
  event = d['data']['event']
  for s in event['sets']['nodes']:
    if s.get('fullRoundText') and 'Grand' in s.get('fullRoundText'):
      print(event['name'], s['fullRoundText'], s['state'])
      for slot in s['slots']:
        name = slot.get('entrant', {}).get('name') if slot.get('entrant') else 'TBD'
        score = slot.get('standing', {}).get('stats', {}).get('score', {}).get('value') if slot.get('standing') and slot.get('standing').get('stats') and slot.get('standing').get('stats').get('score') else 'None'
        print(f'  {name}: {score}')

