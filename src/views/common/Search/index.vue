<template>
  <div>
    <input
      name="search"
      id="searchBox"
      placeholder="Search place"
      @click.prevent="handleInput"
    />
    <div id="map"></div>
  </div>
</template>

<script>
import $ from "jquery";
export default {
  name: "LeafletMap",
  data() {
    return {
      map: null,
      address: "",
    };
  },
  mounted() {
    this.initMap();
  },
  created() {
    window.addEventListener("beforeunload", this.handler);
  },
  methods: {
    initMap() {
      let vueInstance = this;
      var zoom = localStorage.getItem("zoom");
      var initLatLng = JSON.parse(localStorage.getItem("initLatLng"));

      var _finalObject = JSON.parse(
        JSON.stringify(JSON.parse(localStorage.getItem("finalObject")))
      );
      //Load map
      this.map = L.map("map").setView(
        [
          initLatLng != null ? initLatLng.lat : -41.2858,
          initLatLng != null ? initLatLng.lng : 174.78682,
        ],
        zoom ? zoom : 16
      );

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, maxNativeZoom: 19 }
      ).addTo(this.map);

      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
      });

      L.marker([
        initLatLng != null ? initLatLng.lat : -41.2858,
        initLatLng != null ? initLatLng.lng : 174.78682,
      ]).addTo(this.map);

      var Ruler = L.Control.LinearMeasurement.extend({
        // layerSelected: function (e) {
        // },
      });

      this.map.addControl(
        new Ruler({
          unitSystem: "metric",
          color: "#1e0fff",
          opacity: 0,
          dashArray: [0, 0],
          dashArrayOptions: [],
        })
      );

      //to get address of current latlng
      $.get(
        "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=-41.2858&lon=174.78682",
        (data) => {
          vueInstance.$store.commit("SELECTED_PLACE", data.address.road);
          vueInstance.address = data.address.road;
        }
      );

      var info = L.control({ position: "topleft" });

      info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
        return this._div;
      };

      info.addTo(this.map);

      var GooglePlacesSearchBox = L.Control.extend({
        onAdd: () => {
          var element = document.getElementById("searchBox");
          return element;
        },
      });

      new GooglePlacesSearchBox().addTo(this.map);
      let _this = this;

      var input = document.getElementById("searchBox");
      var searchBox = new window.google.maps.places.SearchBox(input);

      searchBox.addListener("places_changed", function () {
        localStorage.removeItem("polygon");
        localStorage.removeItem("finalObject");
        _finalObject = null;

        var places = searchBox.getPlaces();

        if (places.length == 0) {
          return;
        }

        var group = L.featureGroup();

        places.forEach(function (place) {
          vueInstance.address = place.formatted_address;
          vueInstance.$store.commit("SELECTED_PLACE", place.formatted_address);

          setTimeout(() => {
            localStorage.setItem(
              "initLatLng",
              JSON.stringify(place.geometry.location)
            );
          }, 100);

          delete L.Icon.Default.prototype._getIconUrl;

          L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
          });
          // Create a marker for each place.
          var marker = L.marker([
            place.geometry.location.lat(),
            place.geometry.location.lng(),
          ]);
          group.addLayer(marker);
        });

        group.addTo(_this.map);
        _this.map.fitBounds(group.getBounds());
      });
      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
        localStorage.setItem(
          "initLatLng",
          JSON.stringify(e.sourceTarget._animateToCenter)
        );
      });

      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        _finalObject.shape.map((shp) => {
          for (var i = 0; i < shp.path.length; i++) {
            //  create a polyline
            var poly = new L.Polyline(shp.path[i], {
              color: vueInstance.selectedColor
                ? vueInstance.selectedColor
                : shp.path[i][0].color,
              dashArray: "5 5",
              lineCap: "round",
              weight: 3,
              opacity: 1,
              // measurementOptions: { imperial: true },
            }).addTo(this.map);

            var distance = L.latLng([
              shp.path[i][0].lat,
              shp.path[i][0].lng,
            ]).distanceTo([shp.path[i][1].lat, shp.path[i][1].lng]);

            shp.path[i][0]["length"] = `${distance.toFixed(1)} m`;
            shp.path[i][1]["length"] = `${distance.toFixed(1)} m`;

            poly.setText(`${distance.toFixed(1)} m`, {
              center: true,
              attributes: { fill: "yellow" },
              // orientation: "70",
            });
            localStorage.setItem("finalObject", JSON.stringify(_finalObject));
          }
        });
      }
    },
    handler(event) {
      localStorage.clear();
    },
    handleInput(e) {
      e.stopPropagation();
    },
  },
};
</script>
<style>
h1 {
  font-weight: 300;
  font-size: 2em;
  margin-top: -0.75em;
  padding: 0;
  color: #777;
  text-align: center;
  font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

#map {
  height: calc(100% - 65px);
}
</style>
