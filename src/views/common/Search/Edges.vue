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
      <p @click="handleRemove()" class="delete">Delete Edges</p>
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
      latlngs: [],
      enableDelete: false,
      selectedToRemove: [],
      // initialLatlng: localStorage.getItem("initialLatlng"),
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      var vueInstance = this;

      this.latlngs = JSON.parse(localStorage.getItem("latlng"));
      var zoom = localStorage.getItem("zoom");

      // const map = L.map("myMap").setView(
      //   [
      //     this.initialLatlng && JSON.parse(this.initialLatlng).lat
      //       ? JSON.parse(this.initialLatlng).lat
      //       : -41.2858,
      //     this.initialLatlng && JSON.parse(this.initialLatlng).lng
      //       ? JSON.parse(this.initialLatlng).lng
      //       : 174.78682,
      //   ],
      //   zoom ? zoom : 15
      // );
      const map = L.map("myMap").setView(
        [
          this.latlngs &&
          this.latlngs[0] &&
          this.latlngs[0][0] &&
          this.latlngs[0][0][0] &&
          this.latlngs[0][0][0]["lat"]
            ? this.latlngs[0][0][0]["lat"]
            : -41.2858,
          this.latlngs &&
          this.latlngs[0] &&
          this.latlngs[0][0] &&
          this.latlngs[0][0][0] &&
          this.latlngs[0][0][0]["lng"]
            ? this.latlngs[0][0][0]["lng"]
            : 174.78682,
        ],
        zoom ? zoom : 15
      );

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 21 }
      ).addTo(map);

      if (this.latlngs) {
        for (var i = 0; i < this.latlngs.length; i++) {
          for (var j = 0; j < this.latlngs[i].length; j++) {
            //  create a polyline
            var path = new L.Polyline(this.latlngs[i][j], {
              color: vueInstance.selectedColor
                ? vueInstance.selectedColor
                : "#1e0fff",
              dashArray: "5 5",
              lineCap: "round",
              weight: 2,
              opacity: 1,
            }).addTo(map);

            var distance = L.latLng([
              this.latlngs[i][j][0].lat,
              this.latlngs[i][j][0].lng,
            ]).distanceTo([
              this.latlngs[i][j][1].lat,
              this.latlngs[i][j][1].lng,
            ]);

            path.setText(`${distance.toFixed(2)}`, {
              center: true,
              attributes: { fill: "yellow" },
              // orientation: "70",
            });
            // perpendicular, flip, angle
            console.log(
              "ii => ",
              path._latlngs === JSON.parse(JSON.stringify(this.latlngs[i][j]))
            );
            console.log(
              "ii array => ",
              JSON.stringify(path._latlngs),
              JSON.parse(JSON.stringify(this.latlngs[i][j]))
            );

            path.on("mouseover", function (e) {
              // var path_2 = new L.Polyline(e.sourceTarget._this.latlngs, {
              //   color: vueInstance.selectedColor,
              //   dashArray: "5, 5",
              //   lineCap: "round",
              // }).addTo(map);
              console.log("path => ", path);
              console.log("path e =>", e);
              // target._latlngs,sourceTarget._latlngs, sourceTarget.options.color
              console.log( "vueInstance => ", JSON.parse(JSON.stringify(vueInstance.latlngs)) );
              e.sourceTarget.setStyle({
                color: vueInstance.selectedColor || "#1e0fff",
              });
            });

            path.on("click", function (e) {
              if (vueInstance.enableDelete) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((dtt) => {
                  return dtt.filter((dt) => {
                    if (
                      JSON.stringify(dt) !=
                      JSON.stringify(e.sourceTarget._latlngs)
                    ) {
                      return dt;
                    }
                    e.sourceTarget.remove(map);
                  });
                });
                localStorage.setItem(
                  "latlng",
                  JSON.stringify(vueInstance.latlngs)
                );
              }
            });
          }
        }
      }
    },
    handleColor(color) {
      this.selectedColor = color;
      this.enableDelete = false;
    },
    handleRemove() {
      this.enableDelete = true;
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
.delete {
  cursor: pointer;
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
