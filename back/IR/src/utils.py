from IR.src.data_handler import SerchQuery
def constract_query(query:SerchQuery) -> dict:
    """construct a valid query for Elastic earch

    Args:
        query (SerchQuery): dataclass with the following fields: term, date, geo_spatial

    Returns:
        dict: query for Elastic earch
    """
    base_query = {"query": {"bool": {"must": [], "filter": []}}}
    aggretion = {"aggs": {} }
    most_freq_terms_agg = {
                "most_freq_words":{
            "terms": {
                "field": "text",
                "size": 20
            }
        }
    }

    aggretion["aggs"].update(most_freq_terms_agg)
    print(aggretion)
   
    if query.term:
        base_query["query"]["bool"]["must"].append({"match": {"text": query.term}})
    if query.date:
        base_query["query"]["bool"]["filter"].append(
            {
                "range": {
                    "created_at": {
                        "gte": query.date.start_date,
                        "lte": query.date.end_date,
                    }
                }
            }
        )
    if query.geo_spatial:
        base_query["query"]["bool"]["filter"].append(
            {
                "geo_distance": {
                    "distance": f"{query.geo_spatial.radius}km",
                    "coordinates": {
                        "lat": query.geo_spatial.lat,
                        "lon": query.geo_spatial.lon,
                        
                    },
                }
            }
        )
    base_query['aggs'] = aggretion['aggs']
    
    return base_query