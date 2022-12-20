import { Component, Input, OnInit } from '@angular/core';
import { ServiceService } from './service.service';
import * as L from 'leaflet';
import 'leaflet.heat'; // npm install leaflet.heat
//add leaflet.heat to @types/leaflet
// npm install @types/leaflet.heat
import 'leaflet-easybutton';
import 'mapbox-gl-leaflet';
import { addressPoints } from '../app/map-view/data.js';
import 'leaflet-draw'; //  Can't resolve 'leaflet-draw' // npm install leaflet-draw
// import { CloudData, CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';
import * as Highcharts from 'highcharts';
declare var require: any;

// chart.js found in  node_modules\chart.js\dist\Chart.js

// L.selectArea(); // npm install leaflet-select-area // npm install @types/leaflet-select-area // error not

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
var SelectArea = require('leaflet-area-select');

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
  card = null;
  last_obj = null;
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
    this.card = $('#card').clone();
    this.service.search({}).subscribe((data: Object) => {
      this.last_obj = {};
      console.log(data);
      this.tweets = data['data']; // save the data in the tweets array
      this.aggs = data['aggs'];
      this.draw_map(); // initialize the map
      this.draw_heat_map(this.formate_data(this.tweets)); // format the data and draw the heat map
      this.draw_buttons(); // draw the buttons on the map
      this.add_filter_button(); // add the filter button to the map
      this.add_marker_button(); // add the marker button to the map
      this.add_statistic_button(); // add the statistic button to the map
      this.add_refresh_button(); // add the refresh button to the map
      // call the function refresh_button_function  every 5 seconds
      var current_obj = this;
      setInterval(function () {
        current_obj.refresh_button_function();
        current_obj.draw_pie_chart();
        current_obj.draw_word_cloud();

      }, 5000);

    });
  }

  // function to draw the accessury buttons on the map
  draw_buttons() {
    var current_obj = this;
    var drawnItems = new L.FeatureGroup();
    this.map.addLayer(drawnItems);
    L.drawLocal.draw.toolbar.buttons.circle = 'Draw a circle';
    L.drawLocal.draw.handlers.circle.tooltip.start =
      'Click and drag to draw circle.';
    L.drawLocal.draw.handlers.circle.radius = 'Radius';
    // handle closing the menu when reclicking the button

    var drawControl = new L.Control.Draw({ // property 'draw' does not exist on type 'typeof Control' // npm install @types/leaflet-draw
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
    this.map.addControl(drawControl);
    current_obj.circle_button_click(drawnItems);
 
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
          this.last_obj = obj;
          console.log(data);
          current_obj.aggs = data['aggs'];
          current_obj.tweets = data['data'];
          current_obj.re_draw_statistic();
          var filtered_data = current_obj.formate_data(data['data']);
          current_obj.draw_heat_map(filtered_data);
        });
      }.bind(this)
    );

    // add event listener to the delete button
    this.map.on(
      L.Draw.Event.DELETED, // npm install @types/leaflet-draw
      function (event) {
        console.log(event);
        // check if the choice is to delete the circle
        if (event.layers.getLayers().length == 0) {
          return;
        }
        current_obj.circle = null;
        current_obj.service.search({}).subscribe((data) => {
          this.last_obj = {};
          current_obj.aggs = data['aggs'];
          current_obj.tweets = data['data'];
          current_obj.re_draw_statistic();
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
            current_obj.last_obj = obj;
            console.log(data);
            current_obj.aggs = data['aggs'];
            current_obj.tweets = data['data'];

            current_obj.re_draw_statistic();
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
    this.map.selectArea.enable(
      // what we put here?
      {
        position: 'topleft',
        title: 'Select Area',
        useGroupingSeparator: true,
        shapeOptions: {
          color: '#ff0000',
          weight: 2,
        }
      }
    );

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
  add_refresh_button() {
    var current_obj = this;
    L.easyButton('fa fa-refresh', function (btn, map) {
      current_obj.service.search(current_obj.last_obj).subscribe((data) => {
        current_obj.tweets = data['data'];
        current_obj.aggs = data['aggs'];
        current_obj.draw_heat_map(current_obj.formate_data(data['data']));
      });
    }).addTo(this.map);
  }
  refresh_button_function(){
    var current_obj = this;
    current_obj.service.search(current_obj.last_obj).subscribe((data) => {
      current_obj.tweets = data['data'];
      current_obj.aggs = data['aggs'];
      current_obj.draw_heat_map(current_obj.formate_data(data['data']));
    });
  }
  add_marker_button() {
    var current_obj = this;
    L.easyButton('fa fa-map-marker', function (btn, map) {
      // check if theres a marker already romve it else add new one
      if (current_obj.marker != null) {
        current_obj.map.removeLayer(current_obj.marker);
        current_obj.marker = null;
        $('#cards').css('display', 'none');
        $('#word-cloud').css('display', 'block');
        $('#pie-plot').css('display', 'block');
        if ($('#right').is(':visible')) {
          $('#right').hide();
          $('#left').css('width', '100%');
          
        }
        else{
          $('#right').show();
          $('#left').css('width', '80%');
          $('#right').css('width', '20%' );
          current_obj.draw_word_cloud();
          current_obj.draw_pie_chart();
  
        }
        return ;
      }
      

      var marker = L.marker([31, 35], {
        draggable: true,
        icon: L.icon({
          iconUrl: 'https://img.icons8.com/ios/50/000000/marker.png',
          
        }),
      }).addTo(current_obj.map);

      current_obj.marker = marker;
      marker.on('dragend', function (e) {
        $('#cards').css('display', 'block');
        $('#word-cloud').css('display', 'none');
        $('#pie-plot').css('display', 'none');
        if ($('#right').is(':visible')) {

          
        }
        else{
          $('#right').show();
          $('#left').css('width', '80%');
          $('#right').css('width', '20%' );
          current_obj.draw_word_cloud();
          current_obj.draw_pie_chart();
  
        }
        var lat = marker.getLatLng().lat;
        var lng = marker.getLatLng().lng;
        var radius = 500;
        var data_with_coordinates = current_obj.tweets.filter(function (el) {
          return el['coordinates'] != null;
        });
        console.log(data_with_coordinates);
        var filtered_data = data_with_coordinates.filter(function (el) {
          var distance = current_obj.get_distance(
            lat,
            lng,
            el['coordinates']['coordinates'][1],
            el['coordinates']['coordinates'][0]
          );
          return distance < radius;
        });
        console.log(filtered_data);
        
        $('#cards').empty();
        if (filtered_data.length == 0){
          return ;
        }
        
        $('#cards').css('display', 'block');
      
        filtered_data.forEach(function (p) {
          var cloned_card = current_obj.card.clone();
          console.log()
          cloned_card.find('.card-title').text(p['id']);
          cloned_card.find('.card-text').text(p['text']);
          cloned_card.find('.card-subtitle-location').text(p['coordinates']['coordinates'][1] + ' , ' + p['coordinates']['coordinates'][0]);
          cloned_card.find('.card-subtitle-date').text(p['created_at']);
          cloned_card.find('.card-subtitle-score').text(p['score']);
          // handle the a tag in the card add (click) event to it when its clicked run the function click_me and pass the longitude and latitude to it
          cloned_card.find('.card-link').click(function () {
            current_obj.map.flyTo([p['coordinates']['coordinates'][1], p['coordinates']['coordinates'][0]], 15, {
              duration: 1
            });

      
          });
          $('#cards').append(cloned_card);
        });

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
        $('#right').css('width', '20%' );
        current_obj.draw_word_cloud();
        current_obj.draw_pie_chart();

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

  draw_pie_chart() {
 
      this.cloud_data = this.aggs.map(function (p) {
        return [p['key'], p['doc_count']];
      }
      );
  
      Highcharts.chart('pie-plot', {
        series: [
          {
            type: 'pie',
            data:
              this.cloud_data
            ,
            name: 'Occurrences',
          },
        ],
        title: {
          text: 'Pie Chart',
        },
      });
  }
  re_draw_statistic() {
    this.draw_word_cloud();
    this.draw_pie_chart();
  }
  get_distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  click_me(long,lat){

  }
 

}
