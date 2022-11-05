import { Component, OnInit } from '@angular/core';
import { ServiceService } from './service.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'front';
  constructor(private service:ServiceService) { }
  tweets = [];
  ngOnInit() {
    this.service.search({}).subscribe((data:Object)=>{
      // access the attributes of the data object
      this.tweets = data['data'];
      console.log(this.tweets);
    });
}
ngAfterViewInit(): void {
  $(document).ready(function(){
    $('.btn-dd').click(function(){
      $('+ .dd-content', this).toggleClass('ddc-hide');

    });
    
    $('#date_check').click(function(){
      if($(this).is(':checked')){
        $('.hi1').css('display', 'block');
      }else{
        $('.hi1').css('display', 'None');
      }
    }
    );
    $('#location_check').click(function(){
      if($(this).is(':checked')){
        $('.hi2').css('display', 'block');
      }else{
        $('.hi2').css('display', 'None');
      }
    }
    );
});
window.onload = function() { 
  document.getElementById("search-form").onsubmit = function() { 
      return false;
  };
};
}
search(){
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
  if (term != ''){
    obj['term'] = term;
  }
  else{
    obj['term'] = null;
  }
  if (date_check && start_date != '' && end_date != ''){
    obj['date']=  {
      'start_date': start_date,
      'end_date': end_date
    }
  }
  else{
    obj['date'] = null;
  }
  
  if (location_check && lon != '' && lat != '' && radius != ''){
    obj['geo_spatial'] = {
      'lon': lon,
      'lat': lat,
      'radius': radius
    }
  }
  else{
    obj['geo_spatial'] = null;
  }
  
  console.log(obj);
  this.service.search(obj).subscribe((data:Object)=>{
    // access the attributes of the data object
    this.tweets = data['data'];
    console.log(this.tweets);
  });

}
}
