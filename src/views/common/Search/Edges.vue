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
      enableColor: false,
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
                : this.latlngs[i][j][0].color,
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

            path.setText(`${distance.toFixed(2)} m`, {
              center: true,
              attributes: { fill: "yellow" },
              // orientation: "70",
            });

            path.on("mouseover", function (e) {
              if (vueInstance.enableColor) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((poly) => {
                  return (
                    poly &&
                    poly.map((pl) => {
                      if (
                        pl[0].lat === e.sourceTarget._latlngs[0].lat &&
                        pl[0].lng === e.sourceTarget._latlngs[0].lng &&
                        pl[1].lat === e.sourceTarget._latlngs[1].lat &&
                        pl[1].lng === e.sourceTarget._latlngs[1].lng
                      ) {
                        return (
                          pl &&
                          pl.map((dt) => {
                            const additions = {
                              color: vueInstance.selectedColor || "#1e0fff",
                            };
                            const b = { ...dt, ...additions };
                            return b;
                          })
                        );
                      } else {
                        return pl;
                      }
                    })
                  );
                });
                e.sourceTarget.setStyle({
                  color: vueInstance.selectedColor || "#1e0fff",
                });
                localStorage.setItem("latlng", JSON.stringify(vueInstance.latlngs) );
              }
            });

            path.on("click", function (e) {
              if (vueInstance.enableDelete) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((dtt) => {
                  return dtt.filter((dt) => {
                    if (
                      dt[0].lat != e.sourceTarget._latlngs[0].lat &&
                      dt[0].lng != e.sourceTarget._latlngs[0].lng &&
                      dt[1].lat != e.sourceTarget._latlngs[1].lat &&
                      dt[1].lng != e.sourceTarget._latlngs[1].lng
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
      this.enableColor = true;
      this.selectedColor = color;
      this.enableDelete = false;
    },
    handleRemove() {
      this.enableDelete = true;
      this.enableColor = false;
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
