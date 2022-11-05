from dataclasses import dataclass
@dataclass
class Date:
    start_date: str
    end_date: str
    
@dataclass
class GeoSpatial:
    lat: float
    lon: float
    radius: float
@dataclass
#make the attributes optional
class SerchQuery:
    term: str = None
    date: Date = None
    geo_spatial: GeoSpatial = None
    
