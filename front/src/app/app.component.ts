import { Component, Input, OnInit } from '@angular/core';
import { ServiceService } from './service.service';
import * as L from "leaflet";
import 'leaflet.heat';

import 'mapbox-gl-leaflet';
import { addressPoints } from '../app/map-view/data.js';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'front';
  constructor(private service: ServiceService) { }
  tweets = [];
  map: any;
  map_show = false;
  value = 1;
  ngOnInit() {
    this.service.search({}).subscribe((data: Object) => {
      // access the attributes of the data object
      this.tweets = data['data'];
      console.log(this.tweets);
      // draw the map
      this.draw_map({});
      var map_copy = this.map;
      var tweets_copy= this.tweets;
      this.map.on('click', function (e) {
        
        // get the tweets in the clicked area with the radius of 1km
        var tweets = tweets_copy.filter(function (tweet) {
          var lat = tweet['coordinates']['coordinates'][1];
          var lon = tweet['coordinates']['coordinates'][0];
          var distance = Math.sqrt(Math.pow(lat - e.latlng.lat, 2) + Math.pow(lon - e.latlng.lng, 2));
      
            return distance < 3;
        }
        );

        // print the tweets in the pop up
        var content = '';
        tweets.forEach(function (tweet) {
          // add heder with the user name and the date corrdinates and the score of the tweet
          content += '<div style="text-align:center;font-weight: bold;"> ' + 'id : '+ tweet['id'] + '</br>' +   'date : '+  tweet['created_at']  +   '</br>' +   'Coordinates : '+ tweet['coordinates']['coordinates'][0] + ',' + tweet['coordinates']['coordinates'][1] + '</br>'+   'Score : '+ tweet['score'] + '</br> '+ '</div>';
          content +=  tweet['text'] + '<br>';
          // add line break after each tweet
          content +='<hr>'
        }
        );
        if (content == '') {
          content = 'No tweets in this area';
        }
        // add schroll to the pop up if there are many tweets showed only if the height of the pop up is more than 200px
        if (content.length > 200) {
        content = '<div style="height: 200px; overflow-y: scroll;">' + content + '</div>';
        }

        L.popup()
          .setLatLng(e.latlng)
          .setContent(content)
          .openOn(this);
          
  
      }); 

    });


    // // add dragable marker with the + and - buttons to change the radius
    // var marker = L.marker([Number(31), Number(35)], {
    //   draggable: true,
    //   icon: L.icon({
    //     iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    //     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    //     iconSize: [25, 41],
    //     iconAnchor: [12, 41],
    //     popupAnchor: [1, -34],
    //     shadowSize: [41, 41]
    //   })
    // }).addTo(this.map);

    // // console log the coordinates of the marker when finished dragging
    // marker.on('dragend', function (e) {
    //   console.log(marker.getLatLng());
    // });
    




  }
  ngAfterViewInit(): void {
    $(document).ready(function () {
      $('.btn-dd').click(function () {
        $('+ .dd-content', this).toggleClass('ddc-hide');

      });

      $('#date_check').click(function () {
        if ($(this).is(':checked')) {
          $('.hi1').css('display', 'block');
        } else {
          $('.hi1').css('display', 'None');
        }
      }
      );
      $('#location_check').click(function () {
        if ($(this).is(':checked')) {
          $('.hi2').css('display', 'block');
        } else {
          $('.hi2').css('display', 'None');
        }
      }
      );
    });
    window.onload = function () {
      document.getElementById("search-form").onsubmit = function () {
        return false;
      };
    };
  }
  search() {
    var term = $('#search').val();
    var start_date = $('#start_date').val();
    var end_date = $('#end_date').val();
    var lon = $('#lon').val();
    var lat = $('#lat').val();
    var radius = $('#radius').val();
    var location_check = false
    // get the value of checkbox with id date_check
    var date_check = false
    if ($('#date_check').is(':checked')) {
      date_check = true;
    }

    if ($('#location_check').is(':checked')) {
      location_check = true;
    }
    var obj = {};
    if (term != '') {
      obj['term'] = term;
    }
    else {
      obj['term'] = null;
    }
    if (date_check && start_date != '' && end_date != '') {
      obj['date'] = {
        'start_date': start_date,
        'end_date': end_date
      }
    }
    else {
      obj['date'] = null;
    }

    if (location_check && lon != '' && lat != '' && radius != '') {
      obj['geo_spatial'] = {
        'lon': lon,
        'lat': lat,
        'radius': radius
      }
    }
    else {
      obj['geo_spatial'] = null;
    }


    this.service.search(obj).subscribe((data: Object) => {
      // access the attributes of the data object
      this.tweets = data['data'];
      console.log(this.tweets);

      // draw the map
      this.draw_map(obj);


      var tweets_copy= this.tweets;
      var map_copy = this.map;
      this.map.on('click', function (e) {
        
        // get the tweets in the clicked area with the radius of 1km
        var tweets = tweets_copy.filter(function (tweet) {
          var lat = tweet['coordinates']['coordinates'][1];
          var lon = tweet['coordinates']['coordinates'][0];
          var distance = Math.sqrt(Math.pow(lat - e.latlng.lat, 2) + Math.pow(lon - e.latlng.lng, 2));
          // make the distance based on the zoom level of the map zoom out the distance will be bigger 

          return distance < 1;
        }
        );

        // print the tweets in the pop up
        var content = '';
        tweets.forEach(function (tweet) {
            // add heder with the user name and the date corrdinates and the score of the tweet
            content += '<div style="text-align:center;font-weight: bold;"> ' + 'id : '+ tweet['id'] + '</br>' +   'date : '+  tweet['created_at']  +   '</br>' +   'Coordinates : '+ tweet['coordinates']['coordinates'][0] + ',' + tweet['coordinates']['coordinates'][1] + '</br>'+   'Score : '+ tweet['score'] + '</br> '+ '</div>';
            content +=  tweet['text'] + '<br>';
            // add line break after each tweet
            content +='<hr>'
        }
        );
        if (content == '') {
          content = 'No tweets in this area';
        }
        // make the pop up  not go too much with high instead add scroll bar
        content = '<div style="height: 200px; overflow-y: scroll;">' + content + '</div>';

        L.popup()
          .setLatLng(e.latlng)
          .setContent(content)
          .openOn(this);

          
        content = '';
      }); 





    });


  }
  map_table_convert() {

    if (!this.map_show) {
      // make the div #demo unvisible
      $('#demo').css('display', 'none');
      $('#convert_button').text('Table')
      $('#map-setting-container').css('display', 'block');
      // the map glitched when the div was hidden so I had to reinitialize the map
      this.map.invalidateSize();
      this.map_show = true;
    }
    else {
      $('#demo').css('display', 'block');
      $('#map-setting-container').css('display', 'none');
      $('#convert_button').text('Map')


      this.map_show = false;

    }

  }
  draw_map(obj) {
    try {
      this.map.remove(); // remove the old map if it exists
      
    }
    catch (err) {
      
    }
    this.map = L.map('my-map').setView([31.9522, 35.2332], 1); // initialize the map
    var myAPIKey = "de36f5ea0ea344919c1e47dec1441f45"; // my api key
    var isRetina = L.Browser.retina; // check if the screen is retina
    var baseUrl = "https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?&apiKey=de36f5ea0ea344919c1e47dec1441f45"; // the base url of the map
    L.tileLayer(baseUrl, {
      maxZoom: 20,
    }).addTo(this.map); // add the map to the div #my-map with the base url and the max zoom
    this.tweets = this.tweets.filter(function (el) {
      return el['coordinates'] != null;
    });  // filter the tweets that have coordinates 
    // get the max value of the score 
    var max = Math.max.apply(Math, this.tweets.map(function (o) { return o['score']; }))

    var latlngs = this.tweets.map(function (p) { return L.latLng(p['coordinates']['coordinates'][1], p['coordinates']['coordinates'][0],p['score']/max); }); // get the coordinates of the tweets
    this.draw_heat_map(latlngs); // draw the heat map
    
    try {
      if (obj['geo_spatial'] != null) { 
        this.draw_circle(obj); // draw the circle
      }
    }
    catch (err) {
      
    }
    // a: because the function is asynchronous so the tweets are not ready yet
    // q: how to make it wait until the tweets are ready?


  

  }
  draw_heat_map(latlngs) {
    try {
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
      ).addTo(this.map);
    }
    catch (err) {
      console.log(err);
    }
 

  }

  draw_circle(obj) {
    var long = obj['geo_spatial']['lon'];
    var lat = obj['geo_spatial']['lat'];
    var radius = obj['geo_spatial']['radius'];
    var circle = L.circle([Number(lat), Number(long)], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: Number(radius) * 1000

    }).addTo(this.map);


    
  }



  
}

