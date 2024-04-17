//NEWS API -------------------------------------------------------
const fetchNews = async (q) => {
  console.log("Fetching news...");
  var url = 'https://newsapi.org/v2/everything?q=+"healthy eating"&sortBy=popularity&pageSize=4&apiKey=71051ef780954f609196cc496baaba2c';

  var req = new Request(url);

  let a = await fetch(req)
  let response = await a.json()
  console.log(JSON.stringify(response))
  console.log(response)
  let str = ""
  for (let item of response.articles) {
    str = str + `<div class="card" style="width:400px;">
        <img class="card-img-top" src="${item.urlToImage}" alt="Card image">
        <div class="card-body">
          <h4 class="card-title">${item.title}</h4>
          <p class="card-text">${item.description}</p>
          <a href="${item.url}" target="_blank" class="btn btn-outline-info">Read more...</a>
        </div>
      </div>`
  }
  document.querySelector(".content").innerHTML = str
}
fetchNews("+runway+show")


//YOUTUBE API -----------------------------------------------------------------------
function searchVideo(videoId) {
  // The URL of the YouTube Data API v3
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=8PmM6SUn7Es&key=AIzaSyAwzYCPeejaBD1bMxSdXi86FIWbEOAZ758`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const video = data.items[0];
      const videoId = video.id;
      const videoTitle = video.snippet.title;
      const videoThumbnail = video.snippet.thumbnails.medium.url;

      // Create the iframe element
      const iframe = document.createElement('iframe');
      iframe.width = '560';
      iframe.height = '315';
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.frameborder = '0';
      iframe.allowfullscreen = true;

      // Add the iframe element to the player div
      const player = document.getElementById('video');
      player.appendChild(iframe);
    });
}

// The video ID you want to show
const videoId = '8PmM6SUn7Es';

searchVideo(videoId);


//GOOGLE MAPS API ---------------------------------------------------------

function initMap() {
  const myLatlng = { lat: 50.075257408018636, lng: 14.438830018043518 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: myLatlng,
  });

  const marker = new google.maps.Marker({
    position: { lat: 50.075257408018636, lng: 14.438830018043518 },
    map: map,
    label: "",
    title: "Our Store",
    draggable: false
  });
  // Create the initial InfoWindow.
  let infoWindow = new google.maps.InfoWindow({
    content: "We are in Prague!",
    position: myLatlng,
  });

  infoWindow.open(map);
  // Configure the click listener.
  map.addListener("click", (mapsMouseEvent) => {
    // Close the current InfoWindow.
    infoWindow.close();
    // Create a new InfoWindow.
    infoWindow = new google.maps.InfoWindow({
      position: mapsMouseEvent.latLng,
    });
    infoWindow.setContent(
      JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2),
    );
    infoWindow.open(map);
  });
}

window.initMap = initMap;



$(document).ready(function () {
  $('.delete-review').on('click', function () {
    var id = $(this).data('id');
    var url = '/delete/' + id;
    if (confirm('Do you really want to Delete Review?')) {
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
          console.log('Deleting review...');
          window.location.href = '/';
        },
        error: function (err) {
          console.log(err);
        }
      });
    }
  });

  $('.edit-review').on('click', function () {
    $('#edit-form-name').val($(this).data('name'));
    $('#edit-form-description').val($(this).data('description'));
    $('#edit-form-id').val($(this).data('id'));
  });

});

$(document).ready(function () {
  $('.delete-user').on('click', function () {
    var id = $(this).data('id');
    var url = '/deleteUser/' + id;
    if (confirm('Do you really want to Delete User?')) {
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
          console.log('Deleting user...');
          window.location.href = '/admin';
        },
        error: function (err) {
          console.log(err);
        }
      });
    }
  });
});

$(document).ready(function () {
  $('.edit-profile').on('click', function () {
    $('#username').val($(this).data('username'));
    $('#email').val($(this).data('email'));
    $('#firstname').val($(this).data('firstname'));
    $('#secondname').val($(this).data('secondname'));
  });
});