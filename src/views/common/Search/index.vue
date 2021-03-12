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
import {
  drawShapefunction,
  initLat,
  initLng,
  initZoom,
} from "../../../shared/shared";

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
      var latlng = JSON.parse(localStorage.getItem("initLatLng"));

      var _finalObject = JSON.parse(
        JSON.stringify(JSON.parse(localStorage.getItem("finalObject")))
      );
      var marker;

      //Load map
      this.map = L.map("map").setView(
        [
          latlng != null ? latlng.lat : initLat,
          latlng != null ? latlng.lng : initLng,
        ],
        zoom ? zoom : initZoom
      );

      L.tileLayer(process.env.VUE_APP_LEAFLET_MAP, {
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(this.map);

      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
      });

      marker = L.marker( [latlng != null ? latlng.lat : initLat, latlng != null ? latlng.lng : initLng], { draggable: true } ).addTo(this.map);

      var Ruler = L.Control.LinearMeasurement.extend({
        // layerSelected: function (e) {
        // },
      });

      this.map.addControl(
        new Ruler({
          unitSystem: "imperial",
          color: "#1e0fff",
          opacity: 0,
          dashArray: [0, 0],
          dashArrayOptions: [],
        })
      );

      //to get address of current latlng
      $.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${initLat}&lon=${initLng}`,
        (data) => {
          //set address in finalObject
          vueInstance.setAddress(data.address.road);
        }
      );
      var info = L.control({ position: "topleft" });

      info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
        return this._div;
      };

      info.addTo(this.map);

      // Place search code
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
          //set address in finalObject
          vueInstance.setAddress(place.formatted_address);
          setTimeout(() => {
            localStorage.setItem( "initLatLng", JSON.stringify(place.geometry.location)
            );
          }, 100);

          delete L.Icon.Default.prototype._getIconUrl;

          L.Icon.Default.mergeOptions({
            iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
            iconUrl: require("leaflet/dist/images/marker-icon.png"),
            shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
          });
          // Create a marker for each place.
          marker = L.marker(
            [place.geometry.location.lat(), place.geometry.location.lng()],
            { draggable: true }
          );
          group.addLayer(marker);
        });

        group.addTo(_this.map);
        _this.map.fitBounds(group.getBounds());
      });
      marker.on("dragend", function (e) {
        localStorage.setItem("initLatLng", JSON.stringify(e.target.getLatLng())
        );
      });

      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
      });

      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        //Draw shape
        this.drawShape(this.map, _finalObject, vueInstance.selectedColor);
      }
    },
    handler(event) {
      localStorage.clear();
    },
    handleInput(e) {
      e.stopPropagation();
    },
    drawShape(map, _finalObject, selectedColor) {
      drawShapefunction(map, _finalObject, selectedColor);
    },
    setAddress(address) {
      let finalObject = JSON.parse(localStorage.getItem("finalObject"));
      if (finalObject === null) {
        let finalObject = {};
        finalObject.address = address;
        localStorage.setItem("finalObject", JSON.stringify(finalObject));
      } else {
        finalObject.address = address;
        localStorage.setItem("finalObject", JSON.stringify(finalObject));
      }
    },
  },
};
</script>
<style>
#map {
  height: calc(100% - 65px);
}
</style>
