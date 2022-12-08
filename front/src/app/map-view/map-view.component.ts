import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as L from "leaflet";
import 'leaflet.heat';

import 'mapbox-gl-leaflet';
import {addressPoints} from './data.js';
// import HeatLatLngTuple interface from leflet.heat
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
//add circle marker 
  var latlngs = addressPoints.map(function (p) { return L.latLng(p[0], p[1],0.1); });

  L.heatLayer(
    latlngs
    ,
  {
    minOpacity: 0.5,
    radius: 25,
    blur: 15,
    maxZoom: 1,
    max: 1,
  }
  ).addTo(map);

 
  }





  
}
