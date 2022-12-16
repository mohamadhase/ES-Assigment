from IR import app
from http import HTTPStatus
from IR.src.data_handler import SerchQuery
from IR.src.utils import constract_query
from IR import es
@app.get("/health")
def _heath_check() -> dict:
    """Health check."""
    response = {
    "message": HTTPStatus.OK.phrase,
    "status-code": HTTPStatus.OK,
    }
    return response
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


