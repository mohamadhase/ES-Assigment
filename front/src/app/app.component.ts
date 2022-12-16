import { Component, Input, OnInit } from '@angular/core';
import { ServiceService } from './service.service';
import * as L from 'leaflet';
import 'leaflet.heat'; // npm install leaflet.heat
//add leaflet.heat to @types/leaflet
// npm install @types/leaflet.heat
import 'leaflet-easybutton';
import 'mapbox-gl-leaflet';
import { addressPoints } from '../app/map-view/data.js';
import 'leaflet-draw';
// import { CloudData, CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';
import * as Highcharts from 'highcharts';
declare var require: any;

const More = require('highcharts/highcharts-more');
More(Highcharts);

import Histogram from 'highcharts/modules/histogram-bellcurve';
Histogram(Highcharts);

const Exporting = require('highcharts/modules/exporting');
Exporting(Highcharts);

const ExportData = require('highcharts/modules/export-data');
ExportData(Highcharts);

const Accessibility = require('highcharts/modules/accessibility');
Accessibility(Highcharts);

const Wordcloud = require('highcharts/modules/wordcloud');
Wordcloud(Highcharts);


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'front';
  constructor(private service: ServiceService) {}
  tweets = [];
  map: any;
  map_show = false;
  value = 1;
  heat_map: any;
  circle: any;
  marker:any;
  statistics = false;
  cloud_data =[];
  aggs = [];
  // options: CloudOptions = {
  //   // the width is the width of the container
  //   width: 500,
  //   // the height is the height of the container
  //   height: 300,
  //   // if true the word cloud will be in elliptical shape, if false it will be in rectangular shape
  //   overflow: false,
  // };
  // zoomOnHoverOptions: ZoomOnHoverOptions = {
  //   scale: 1.3, // Elements will become 130 % of current zize on hover
  //   transitionTime: 1.2, // it will take 1.2 seconds until the zoom level defined in scale property has been reached
  //   delay: 0.8 // Zoom will take affect after 0.8 seconds
  // };
  ngOnInit() {
    this.service.search({}).subscribe((data: Object) => {
    
      console.log(data);
      this.tweets = data['data']; // save the data in the tweets array
      this.aggs = data['aggs'];
      this.draw_map(); // initialize the map
      this.draw_heat_map(this.formate_data(this.tweets)); // format the data and draw the heat map
      this.draw_buttons(); // draw the buttons on the map
      this.add_filter_button(); // add the filter button to the map
      this.add_marker_button(); // add the marker button to the map
      this.add_statistic_button(); // add the statistic button to the map
      this.draw_word_cloud(); // draw the word cloud
    });
  }

  // function to draw the accessury buttons on the map
  draw_buttons() {
    var current_obj = this;
    L.easyButton(
      'fa fa-map',
      function (btn, map) {
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        L.drawLocal.draw.toolbar.buttons.circle = 'Draw a circle';
        L.drawLocal.draw.handlers.circle.tooltip.start =
          'Click and drag to draw circle.';
        L.drawLocal.draw.handlers.circle.radius = 'Radius';
        // handle closing the menu when reclicking the button

        var drawControl = new L.Control.Draw({
          draw: {
            circle: {
              shapeOptions: {
                color: '#f357a1',
                fillColor: '#f357a1',
                fillOpacity: 0.2,
              },
            },

            polygon: false,
            polyline: false,
            rectangle: false,
            marker: false,
            circlemarker: false,
          },
          edit: {
            featureGroup: drawnItems,
            remove: true,
            edit: false,
          },
        });
        map.addControl(drawControl);
        current_obj.circle_button_click(drawnItems);
      }.bind(this)
    ).addTo(this.map);
  }

  // function to handle the click of circle button

  circle_button_click(drawnItems) {
    var current_obj = this;
    this.map.on(
      L.Draw.Event.CREATED,
      function (event) {
        //check if theres circle on the map dont allow the user to draw another circle
        if (drawnItems.getLayers().length > 0) {
          return;
        }
        var layer = event.layer;
        drawnItems.addLayer(layer);
        // get the coordinates of the shape
        var coordinates = layer.toGeoJSON().geometry.coordinates; // what is the format of the coordinates ?
        console.log(coordinates);
        // get the radius of the circle
        var radius = layer.getRadius(); // in meters
        console.log(radius);
        current_obj.circle = layer;
        // get the data again based on the coordinates and the radius
        var obj = {
          geo_spatial: {
            lat: coordinates[1],
            lon: coordinates[0],
            radius: radius / 1000,
          },
        };
        console.log(obj);
        // get the tweets in the circle
        current_obj.service.search(obj).subscribe((data) => {
          console.log(data);
          var filtered_data = current_obj.formate_data(data['data']);
          current_obj.draw_heat_map(filtered_data);
        });
      }.bind(this)
    );

    // add event listener to the delete button
    this.map.on(
      L.Draw.Event.DELETED,
      function (event) {
        console.log(event);
        // check if the choice is to delete the circle
        if (event.layers.getLayers().length == 0) {
          return;
        }
        current_obj.circle = null;
        current_obj.service.search({}).subscribe((data) => {
          var filtered_data = current_obj.formate_data(data['data']);
          current_obj.draw_heat_map(filtered_data);
        });
      }.bind(this)
    );
  }

  add_filter_button() {
    var current_obj = this;
    L.easyButton('fa fa-filter', function (btn, map) {
      // check if theres circle on the map get the coordinates and the radius
      // get how many layer in the map
      var obj = {
        geo_spatial: null,
        term: null,
        date: null,
      };
      if (current_obj.circle != null) {
        obj.geo_spatial = {
          lat: current_obj.circle.toGeoJSON().geometry.coordinates[1],
          lon: current_obj.circle.toGeoJSON().geometry.coordinates[0],
          radius: current_obj.circle.getRadius() / 1000,
        };
      }
      console.log(obj);
      // show pop up with the filter options the term and the date range
      var popup = L.popup()
        .setLatLng([0, 0])
        .setContent(
          '<div class="container" style="width:300px">' +
            '<div class="row">' +
            '<div class="col-12">' +
            '<div class="form-group">' +
            '<label for="term">Term</label>' +
            '<input type="text" class="form-control" id="term" placeholder="Enter term">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-6">' +
            '<div class="form-group">' +
            '<label for="start_date">Start Date</label>' +
            '<input type="date" class="form-control" id="start_date">' +
            '</div>' +
            '</div>' +
            '<div class="col-6">' +
            '<div class="form-group">' +
            '<label for="end_date">End Date</label>' +
            '<input type="date" class="form-control" id="end_date">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-12">' +
            '<button type="button" class="btn btn-primary" id="filter_button">Filter</button>' +
            '</div>' +
            '</div>' +
            '</div>'
        )
        .openOn(current_obj.map);
      // add event listener to the filter button
      document
        .getElementById('filter_button')
        .addEventListener('click', function () {
          var term = $('#term').val();
          var start_date = $('#start_date').val();
          var end_date = $('#end_date').val();
          if (term != null && term != '') {
            obj.term = term;
          }
          if (
            start_date != null &&
            start_date != '' &&
            end_date != null &&
            end_date != ''
          ) {
            obj.date = {};
            obj.date.start_date = start_date;
            obj.date.end_date = end_date;
          }

          current_obj.service.search(obj).subscribe((data) => {
            console.log(data);
            var filtered_data = current_obj.formate_data(data['data']);
            current_obj.draw_heat_map(filtered_data);
            current_obj.map.closePopup();
          });
        });
    }).addTo(this.map);
  }

  draw_map() {
    try {
      this.map.remove(); //check if the map is already exist remove it
    } catch (err) {
      console.log(err);
    }

    this.map = L.map('my-map').setView([31.9522, 35.2332], 1); // initialize the map
    var myAPIKey = 'de36f5ea0ea344919c1e47dec1441f45'; // my api key
    var isRetina = L.Browser.retina; // check if the screen is retina
    var baseUrl =
      'https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=de36f5ea0ea344919c1e47dec1441f45'; // the base url of the map
    L.tileLayer(baseUrl, {
      maxZoom: 20,
    }).addTo(this.map); // add the map to the div #my-map with the base url and the max zoom
  }
  draw_heat_map(latlngs) {
    // romve the old heat map

    try {
      this.map.removeLayer(this.heat_map);
    } catch (err) {
      console.log(err);
    }
    try {
      this.heat_map = L.heatLayer(latlngs, {
        minOpacity: 0.5,
        radius: 25,
        blur: 15,
        maxZoom: 1,
        max: 1,
      }).addTo(this.map);
    } catch (err) {
      console.log(err);
    }
  }
  formate_data(data) {
    data = data.filter(function (el) {
      return el['coordinates'] != null;
    });
    var max = Math.max.apply(
      Math,
      data.map(function (o) {
        return o['score'];
      })
    );
    var latlngs = data.map(function (p) {
      return L.latLng(
        p['coordinates']['coordinates'][1],
        p['coordinates']['coordinates'][0],
        p['score'] / max
      );
    }); // get the coordinates of the tweets
    return latlngs;
  }

  add_marker_button() {
    var current_obj = this;
    L.easyButton('fa fa-map-marker', function (btn, map) {
      // check if theres a marker already romve it else add new one
      if (current_obj.marker != null) {
        current_obj.map.removeLayer(current_obj.marker);
        current_obj.marker = null;
        return ;
      }
      // the marker icon dont show up on the map
      // q: can we use one from fontawsome?
      //a : yes we can use one from fontawsome
      

      var marker = L.marker([31, 35], {
        draggable: true,
        icon: L.icon({
          iconUrl: 'https://img.icons8.com/ios/50/000000/marker.png',
          
        }),
      }).addTo(current_obj.map);

      current_obj.marker = marker;
      marker.on('dragend', function (e) {
          // show pop up to ask for statistics type
          var popup = L.popup()
          .setLatLng(e.target.getLatLng())
          .setContent(
            '<div class="container">' +
              '<div class="row">' +
                '<div class="col-12">' +
                  '<div class="form-group form-check">' +
                    '<input type="checkbox" class="form-check-input" id="check1">' +
                    '<label class="form-check-label" for="check1">Tweets</label>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="row">' +
                '<div class="col-12">' +
                  '<div class="form-group form-check">' +
                    '<input type="checkbox" class="form-check-input" id="check2">' +
                    '<label class="form-check-label" for="check2">Retweets</label>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="row">' +
                '<div class="col-12">' +
                  '<button type="button" class="btn btn-primary" id="filter_button">Filter</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          )
          .openOn(current_obj.map);
          // add event listener to the filter button
          
      });
    }).addTo(this.map);
  }


  add_statistic_button() {

    var current_obj = this; 
    L.easyButton('fa fa-bar-chart', function (btn, map) {
      if ($('#right').is(':visible')) {
        $('#right').hide();
        $('#left').css('width', '100%');

      }
      else{
        $('#right').show();
        $('#left').css('width', '80%');
      }
    }).addTo(current_obj.map);
  }

  draw_word_cloud() {
    this.cloud_data = this.aggs.map(function (p) {
      return [p['key'], p['doc_count']];
    }
    );

    Highcharts.chart('word-cloud', {
      series: [
        {
          type: 'wordcloud',
          data:
            this.cloud_data
          ,
          name: 'Occurrences',
        },
      ],
      title: {
        text: 'Wordcloud',
      },
    });
    
  }

  draw_bar_plot() {
  }
  
  
}

//Cannot find module '../src/core/core.adapters.js' 
// a: add this to the tsconfig.json file
// "paths": {
//   "chart.js": ["node_modules/chart.js/dist/chart.js"]
// }