<template>
  <div>
    <div id="map"></div>
  </div>
</template>

<script>
export default {
  name: "LeafletMap",
  data() {
    return {
      map: null,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      let vueInstance = this;

      //simple map
      var zoom = localStorage.getItem("zoom");
      var latlngs = JSON.parse(localStorage.getItem("latlng"));
console.log('latlngs => ',latlngs);

      this.map = L.map("map").setView(
        [
          latlngs ? latlngs[0][0][0]["lat"] : -41.2858,
          latlngs ? latlngs[0][0][0]["lng"] : 174.78682,
        ],
        zoom ? zoom : 15
      );

      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
      });

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 21,
        }
      ).addTo(this.map);

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

      var info = L.control({ position: "topleft" });

      info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info"); // create a div with a class "info"
        // this.update();
        return this._div;
      };

      info.addTo(this.map);

      if (latlngs) {
        for (var i = 0; i < latlngs.length; i++) {
          for (var j = 0; j < latlngs[i].length; j++) {
            //  create a polyline
            var path = new L.Polyline(latlngs[i][j], {
              color: "#1e0fff",
              dashArray: "5 5",
              lineCap: "round",
              weight: 2,
              opacity: 1,
            }).addTo(this.map);

            var distance = L.latLng([
              latlngs[i][j][0].lat,
              latlngs[i][j][0].lng,
            ]).distanceTo([latlngs[i][j][1].lat, latlngs[i][j][1].lng]);

            path.setText(`${distance.toFixed(2)}`, {
              center: true,
              attributes: { fill: "yellow" },
              // orientation: "70",
            });
            // perpendicular, flip, angle

            // path.on("mouseover", function (e) {
            //   new L.Polyline(e.sourceTarget._latlngs, {
            //     color: vueInstance.selectedColor,
            //     dashArray: "5, 5",
            //     lineCap: "round",
            //   }).addTo(this.map);
            // });
          }
        }
      }
    },
  },
};
</script>
<style>
body {
  /* padding: 50px; */
}

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
  height: 82vh;
}

/* .cost_label {
  font-weight: bold;
}

.cost_value {
  text-align: left;
} */
</style>
