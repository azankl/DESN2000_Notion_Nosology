from notion.client import NotionClient
from notion.block import *
import sys
# Obtain the `token_v2` value by inspecting your browser cookies on a logged-in (non-guest) session on Notion.so
client = NotionClient(token_v2="1c87546620808e2554d1a06d6c1b124e3402e2cbdd7cffaca0daa8668252047a101ffa5426e5919ff29224d28e05ba70a5f24f5e8078e200a796d0a01a0ae76f0f8ae10368523bce7c4909615bd6")

# Replace this URL with the URL of the page you want to edit
database = client.get_collection_view("https://www.notion.so/2360d5674740442d98435027aefe48d9?v=cec5e58748e2445581a56cc8b12fc5e5")

# Arg checking for [A] flag
run_all = False
if len(sys.argv) > 1:
   if sys.argv[1] == "A":
      run_all = True

result = database.collection.get_rows()
#reads through all rows and deletes selected or all if A is done
for row in result:
   if run_all == True or row.update == True:
      print(row)  # Just prints summary of row
      for child in row.children:
         child.remove(permanently=True)
