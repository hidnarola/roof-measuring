<template>
  <div>
    <div id="myMap"></div>
    <div id="colorSelection">
      <p>Color tool</p>
      <div v-for="(display, idx) in colors" :key="idx">
        <div @click="handleColor(display.name)" class="name">
          <span class="colorbox" :class="['bg-' + display.name]"></span>
          {{ display.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LeafletMap",
  data() {
    return {
      colors: [
        { name: "Blue", backgroundColor: "#1e0fff" },
        { name: "Yellow", backgroundColor: "#FFFF00" },
        { name: "Salmon", backgroundColor: "#FA8072" },
        { name: "Orange", backgroundColor: "#FFA500" },
        { name: "Green", backgroundColor: "#008000" },
        { name: "SandyBrown", backgroundColor: "#F4A460" },
        { name: "Pink", backgroundColor: "#FFC0CB" },
        { name: "Tan", backgroundColor: "#D2B48C" },
      ],
      selectedColor: null,
      selectedLat: null,
      selectedLng: null,
      polyArray: [],
    };
  },
  mounted() {
    this.initMap();
  },

  methods: {
    initMap() {
      this.polyArrayData;
      var vueInstance = this;

      var latlngs = JSON.parse(localStorage.getItem("latlng"));

      var zoom = localStorage.getItem("zoom");

      const map = L.map("myMap").setView(
        [
          latlngs ? latlngs[0][0][0]["lat"] : -41.2858,
          latlngs ? latlngs[0][0][0]["lng"] : 174.78682,
        ],
        zoom ? zoom : 15
      );

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 21,
        }
      ).addTo(map);

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
            }).addTo(map);

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

            path.on("mouseover", function (e) {
              new L.Polyline(e.sourceTarget._latlngs, {
                color: vueInstance.selectedColor,
                dashArray: "5, 5",
                lineCap: "round",
              }).addTo(map);
            });
          }
        }
      }

    },
    handleColor(color) {
      this.selectedColor = color;
      this.selectedColor === "yellow"
        ? "#F1F903"
        : color === "black"
        ? "#17202A"
        : color === "blue"
        ? "#1e0fff"
        : "#DCD41F";
    },
  },
};
</script>
<style scoped>
#myMap {
  height: 82vh;
}
#colorSelection {
  position: absolute;
  background: #fff;
  z-index: 1111;
  bottom: 0;
  padding: 1rem 0;
  right: 25px;
  top: 132px;
  left: auto;
  width: 10%;
  max-height: 355px;
  overflow: auto;
  border-radius: 2px;
  border: 1px solid #ccc;
  -webkit-box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
  -moz-box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
  box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
}
#colorSelection p {
  padding-left: 10px;
  margin-bottom: 5px;
}
#colorSelection .name {
  font-size: 14px;
  font-family: "Roboto", sans-serif;
  text-transform: capitalize;
  padding: 7px 0 7px 10px;
  cursor: pointer;
}
#colorSelection .name:hover {
  background-color: #f2f2f2;
}
.colorbox {
  display: inline-block;
  width: 25px;
  height: 6px;
  margin-right: 5px;
  background-color: #fff;
  border: 2px solid;
  /* border: 2px dashed; */
}
.bg-Blue {
  border-color: #1e0fff;
}
.bg-Yellow {
  border-color: #ffff00;
}
.bg-Salmon {
  border-color: #fa8072;
}
.bg-Orange {
  border-color: #ffa500;
}
.bg-Green {
  border-color: #008000;
}
.bg-SandyBrown {
  border-color: #f4a460;
}
.bg-Pink {
  border-color: #ffc0cb;
}
.bg-Tan {
  border-color: #d2b48c;
}
/* path {
  stroke: #3388ff;
  stroke-opacity: 1;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: #3388ff;
  fill-opacity: 0.2;
  fill-rule: evenodd;
} */
</style>
