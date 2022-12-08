import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from "leaflet";

import 'mapbox-gl-leaflet';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit  {

  constructor() { }


  ngOnInit(): void {
// Leaflet has native support for raster maps, So you can create a map with a few commands only!

// The Leaflet map Object
var map = L.map('my-map').setView([31.9522, 35.2332], 4);
   
// The API Key provided is restricted to JSFiddle website
// Get your own API Key on https://myprojects.geoapify.com
var myAPIKey = "de36f5ea0ea344919c1e47dec1441f45";

// Retina displays require different mat tiles quality
var isRetina = L.Browser.retina;

var baseUrl = "https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=de36f5ea0ea344919c1e47dec1441f45";

// Add map tiles layer. Set 20 as the maximal zoom and provide map data attribution.
L.tileLayer( baseUrl, {
    maxZoom: 20,
}).addTo(map);
  }


  // some tiles loaded but not all in the map do not know why
  // a: https://stackoverflow.com/questions/65077977/leaflet-map-not-loading-all-tiles


// ngAfterViewInit(): void {   
//   alert("hi")
// var myAPIKey = "6dc7fb95a3b246cfa0f3bcef5ce9ed9a";
// const mapStyle = "https://maps.geoapify.com/v1/styles/osm-carto/style.json";

// const initialState = {
//   lng: 11,
//   lat: 49,
//   zoom: 4
// };

// const map = new L.Map(this.mapContainer.nativeElement).setView(
//   [initialState.lat, initialState.lng],
//   initialState.zoom
// );

// // the attribution is required for the Geoapify Free tariff plan
// map.attributionControl
//   .setPrefix("")
//   .addAttribution(
//     'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | © OpenStreetMap <a href="https://www.openstreetmap.org/copyright" target="_blank">contributors</a>'
//   );

//   L.tileLayer('https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=YOUR_API_KEY', {
//     attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | © OpenStreetMap <a href="https://www.openstreetmap.org/copyright" target="_blank">contributors</a>',
//     maxZoom: 20, id: 'osm-bright'
//   }).addTo(map);
// }


  
}
