import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

STARTGG_TOKEN = os.environ.get("STARTGG_API_TOKEN")

GAME_IDS = [
    1, 2, 3, 4, 1386, 14, 43868, 17, 43905, 10, 3200, 49910, 11, 33945,
    19, 20, 35147, 53945, 40, 52627, 35, 287, 288, 289, 290, 294, 295,
    298, 286, 35306, 50058, 15, 2555, 3313, 1408, 4042, 4743
]

query = """
query GetGames($perPage: Int!, $ids: [ID]) {
  videogames(query: {perPage: $perPage, filter: {id: $ids}}) {
    nodes {
      id
      name
      displayName
      images {
        url
        type
      }
    }
  }
}
"""

variables = {
    "perPage": 100,
    "ids": GAME_IDS
}

headers = {
    "Authorization": f"Bearer {STARTGG_TOKEN}",
    "Content-Type": "application/json"
}

print("Fetching games from Start.gg...")
resp = requests.post("https://api.start.gg/gql/alpha", json={"query": query, "variables": variables}, headers=headers)
data = resp.json()

if "errors" in data:
    print("Errors:", data["errors"])
else:
    nodes = data.get("data", {}).get("videogames", {}).get("nodes", [])
    out_data = []
    for node in nodes:
        primary_image = None
        for img in node.get("images", []):
            if img.get("type") == "primary":
                primary_image = img.get("url")
                break
        
        # fallback to any image
        if not primary_image and node.get("images"):
            primary_image = node.get("images")[0].get("url")

        out_data.append({
            "id": str(node["id"]),
            "name": node.get("displayName") or node.get("name"),
            "imageUrl": primary_image
        })
    
    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "app", "data", "startggGames.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out_data, f, indent=2)
    print(f"Saved {len(out_data)} games to {out_path}")
