import json
import pickle
from IR import app
from http import HTTPStatus
from IR.src.data_handler import SerchQuery
from IR.src.utils import constract_query
from IR import es
import socket
import threading 
from elasticsearch import helpers
import datetime
@app.get("/health")
def _heath_check() -> dict:
    """Health check."""
    response = {
    "message": HTTPStatus.OK.phrase,
    "status-code": HTTPStatus.OK,
    }
    return response

def to_dict(text):
    obj = json.loads(text)
    obj['created_at'] = datetime.datetime.strptime(obj['created_at'], '%a %b %d %H:%M:%S +0000 %Y')
    return obj

def open_socket():
    # Create a socket object
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Get the server hostname and port
    host = 'localhost'
    port = 12345

    # Connect to the server
    try:
        client_socket.connect((host, port))
        if es.indices.exists(index="tweets"):
            # delete all the data in the index but not the index itself 
            es.delete_by_query(index="tweets", body={"query": {"match_all": {}}})
    except socket.error as e:
        print("the socket is not connected")
        return
    b = b''
    # Run the client loop forever
    while True:
        # Send a message to the server
        message = b'give me data please'
        client_socket.sendall(message)
        
        # Receive a response from the server
        res = client_socket.recv(10000000000)
        if res == b'Finished':
            break
        response =   b+ res
        # why the 
        data_loaded = json.loads(response.decode())
        data_loaded = [to_dict(tweet) for tweet in data_loaded]
        # insert the data to the elastic search
        helpers.bulk(es,data_loaded,index="tweets")    # Close the client socket
    client_socket.close()
    
        
    
 
thrad = threading.Thread(target=open_socket)
thrad.start()
    
@app.post("/search")
async def _search(query:SerchQuery) -> dict:
    """ Search for tweets

    Args:
        query (SerchQuery): dataclass with the following fields: term, date, geo_spatial

    Returns:
        dict: response with the following fields: message, status-code, data
        data : list of tweets that match the query
    """
    print(query)
    es_query = constract_query(query)
   
    res_data = es.search(index="tweets", body=es_query,size=10000) 
    # print the min score
    print(res_data["hits"]["max_score"])
    res = res_data["hits"]["hits"]
    res = [{"id":tweet["_id"],"score":tweet["_score"],"text":tweet["_source"]["text"],"coordinates":tweet["_source"]["coordinates"],"created_at":tweet["_source"]["created_at"]} for tweet in res]
    
    print(len(res))
    response = {
    "message": HTTPStatus.OK.phrase,
    "status-code": HTTPStatus.OK,
    "data": res,
    "aggs":res_data["aggregations"]["most_freq_words"]["buckets"]
    }
    return response





