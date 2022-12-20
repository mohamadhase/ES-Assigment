import uvicorn
from fastapi import FastAPI , Request
import os
import sys
from elasticsearch import Elasticsearch
import json
from fastapi.middleware.cors import CORSMiddleware
import threading
es = Elasticsearch(hosts="http://localhost:9200")
app = FastAPI(  
    title="IR API",
    description="..",
    version="0.1",)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # run create_index.ipynb to create index 
# if  not es.indices.exists(index="tweets"):
    
#     with open("back/IR/create_tweets_index.ipynb", "r") as f:
#         notebook = json.load(f)
#         for cell in notebook["cells"]:
#             if cell["cell_type"] == "code":
#                 code = "\n".join(cell["source"])
#                 exec(code)



# make the socket file run in the background the file is in the same directory with name sender.py in another thread

thread = threading.Thread(
    target=os.system, args=(f"{sys.executable} IR/sender.py",)
)
thread.start()


from IR import endpoints





query = {
    "query": {
       "bool":{

        "must": [
            {
                "match": {
                    "text": "fire"
                }
            }
        ],
        "filter": {

            "range": {
                "created_at": {
                    "gte": "2013-01-01T00:00:00.000Z",
                    "lte": "2014-12-31T00:00:00.000Z"
                }
            },
       } ,

        "filter": {
            "geo_distance": {
                "distance": "10000km",
                "coordinates": {
                    "lat": 37.7749,
                    "lon": -122.4194
                }
            }
        }

    }
}
}


# res = es.search(index=index_name, body=query)
# res = dict(res)
# res['hits']