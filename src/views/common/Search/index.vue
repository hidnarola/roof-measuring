<template>
  <div>
    <div id="map"></div>
  </div>
</template>

<script>

export default {
  name: "LeafletMap",
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      //simple map
      var map = L.map("map").setView([-41.2858, 174.78682], 15);

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 21
        }
      ).addTo(map);

      var cost_underground = 12.55,
        cost_above_ground = 17.89,
        html = [
          "<table>",
          ' <tr><td class="cost_label">Cost Above Ground:</td><td class="cost_value">${total_above_ground}</td></tr>',
          ' <tr><td class="cost_label">Cost Underground:</td><td class="cost_value">${total_underground}</td></tr>',
          "</table>",
        ].join(""),
        numberWithCommas = function (x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };


      var Ruler = L.Control.LinearMeasurement.extend({
        // layerSelected: function (e) {
        //   /* cost should be in feet */

        //   var distance = e.total.scalar;

        //   if (e.total.unit === "mi") {
        //     distance *= e.sub_unit;
        //   } else if (e.total.unit === "km") {
        //     distance *= 3280.84;
        //   } else if (e.total.unit === "m") {
        //     distance *= 3.28084;
        //   }

        //   var data = {
        //     total_above_ground: numberWithCommas(
        //       L.Util.formatNum(cost_above_ground * distance, 2)
        //     ),
        //     total_underground: numberWithCommas(
        //       L.Util.formatNum(cost_underground * distance, 2)
        //     ),
        //   };

        //   var content = L.Util.template(html, data),
        //     popup = L.popup().setContent(content);

        //   e.total_label.bindPopup(popup, { offset: [45, 0] });
        //   e.total_label.openPopup();
        // },
      });


      map.addControl(new Ruler({
          unitSystem: "metric",
          color: "#1e0fff",
          opacity:0,
          dashArray: [0,0],
          dashArrayOptions:[]
        })
      );
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
  height: 90vh;
}

.cost_label {
  font-weight: bold;
}

.cost_value {
  text-align: left;
}

</style>
