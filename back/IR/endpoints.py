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
    print(es_query)
    res = es.search(index="tweets", body=es_query,size=100)
    #filter the res
    res = res["hits"]["hits"]
    keywords = ["id","text","created_at","coordinates"]
    res = [{key:tweet["_source"][key] for key in keywords} for tweet in res]
    print(len(res))
    print(es_query)
    print(query)
    response = {
    "message": HTTPStatus.OK.phrase,
    "status-code": HTTPStatus.OK,
    "data": res
    }
    return response
