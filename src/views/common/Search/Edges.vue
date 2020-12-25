<template>
  <div>
    <div id="myMap"></div>
    <div v-if="isOpenModel" class="confirmation_popup">
      <div class="confirmation_body">
        <span class="pop-close" @click="handleModal">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 329 329"
            style="enable-background: new 0 0 329 329"
            xml:space="preserve"
          >
            <path
              d="M194.6,164.5L322.7,36.4c8.3-8.3,8.3-21.8,0-30.1c-8.3-8.3-21.8-8.3-30.1,0L164.5,134.4L36.4,6.2c-8.3-8.3-21.8-8.3-30.1,0 c-8.3,8.3-8.3,21.8,0,30.1l128.1,128.1L6.3,292.6c-8.3,8.3-8.3,21.8,0,30.1c4.2,4.2,9.6,6.2,15.1,6.2s10.9-2.1,15.1-6.2l128.1-128.1 	l128.1,128.1c4.2,4.2,9.6,6.2,15.1,6.2c5.5,0,10.9-2.1,15.1-6.2c8.3-8.3,8.3-21.8,0-30.1L194.6,164.5z"
            /></svg
        ></span>
        <h6>This will delete all edges!</h6>
        <p>Are you sure you want to delete all edges?</p>
        <div class="btn-wrap">
          <button class="btn btn-trans" @click="handleModal">Cancel</button>
          <button class="btn btn-blue" @click="handleRemoveAll()">
            Delete all edges
          </button>
        </div>
      </div>
    </div>

    <div id="colorSelection">
      <p>Edges tool</p>
      <div v-for="(display, idx) in colors" :key="idx">
        <div @click="handleColor(display.name)" class="name">
          <span class="colorbox" :class="['bg-' + display.name]"></span>
          {{ display.name }}
        </div>
      </div>
      <div class="name">
        <button @click="handleRemove()" class="delete cm-btn">
          Delete Edge
        </button>
      </div>
      <div class="name">
        <button @click="handleModal" class="delete cm-btn">
          Delete All Edges
        </button>
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
      latlngs: [],
      enableDelete: false,
      selectedToRemove: [],
      enableColor: false,
      rotated: false,
      isOpenModel: false,
      map: null,
      initLat: -41.2858,
      initLng: 174.78682,
      zoom: 16,
    };
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      var vueInstance = this;

      this.latlngs = JSON.parse(localStorage.getItem("latlng"));

      this.zoom = localStorage.getItem("zoom");

      var initLatLng =
        (localStorage.getItem("initLatLng") != null || localStorage.getItem("initLatLng") != undefined) &&
        JSON.parse(localStorage.getItem("initLatLng"));

      this.initLat = initLatLng && initLatLng.lat;
      this.initLng = initLatLng && initLatLng.lng;

      this.map = L.map("myMap").setView(
        [this.initLat, this.initLng],
        this.zoom
      );
      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
        }
      ).addTo(this.map);

      L.marker([this.initLat, this.initLng]).addTo(this.map);

      if (
        this.latlngs != null &&
        JSON.parse(JSON.stringify(this.latlngs)).length > 0
      ) {
        for (var i = 0; i < this.latlngs.length; i++) {
          for (var j = 0; j < this.latlngs[i].length; j++) {
            //  create a polyline
            var path = new L.Polyline(this.latlngs[i][j], {
              color: vueInstance.selectedColor
                ? vueInstance.selectedColor
                : this.latlngs[i][j][0].color,
              dashArray: "5 5",
              lineCap: "round",
              weight: 3,
              opacity: 1,
            }).addTo(this.map);

            var distance = L.latLng([ this.latlngs[i][j][0].lat, this.latlngs[i][j][0].lng, ]).distanceTo([ this.latlngs[i][j][1].lat, this.latlngs[i][j][1].lng, ]);
            path.setText(`${distance.toFixed(2)} m`, {
              center: true,
              attributes: { fill: "#ddd" },
              // orientation: "70",
            });

            path.on("click", function (e) {
              if (vueInstance.enableColor) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((poly) => poly && poly.map((pl) => {
                      if (
                        pl[0].lat === e.sourceTarget._latlngs[0].lat &&
                        pl[0].lng === e.sourceTarget._latlngs[0].lng &&
                        pl[1].lat === e.sourceTarget._latlngs[1].lat &&
                        pl[1].lng === e.sourceTarget._latlngs[1].lng
                      ) {
                        return (pl && pl.map((dt) => {
                            const additions = {
                              color: vueInstance.selectedColor,
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
                e.sourceTarget.setStyle({
                  color: vueInstance.selectedColor || "#1e0fff",
                });
                localStorage.setItem( "latlng", JSON.stringify(vueInstance.latlngs) );
              }
            });

            path.on("click", function (e) {
              if (vueInstance.enableDelete) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((dtt) => dtt.filter((dt) => {
                    if (
                      dt[0].lat != e.sourceTarget._latlngs[0].lat &&
                      dt[0].lng != e.sourceTarget._latlngs[0].lng &&
                      dt[1].lat != e.sourceTarget._latlngs[1].lat &&
                      dt[1].lng != e.sourceTarget._latlngs[1].lng
                    ) {
                      return dt;
                    }
                    e.sourceTarget.remove(this.map);
                  })
                );
                localStorage.setItem("latlng", JSON.stringify(vueInstance.latlngs) );
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
    handleRemoveAll() {
      this.latlngs = [];
      localStorage.removeItem("latlng");
      this.map.off();
      this.map.remove();
      this.initMap();
      this.handleModal();
    },
    handleModal() {
      if (this.isOpenModel) {
        this.isOpenModel = false;
      } else {
        var ele = document.body;
        ele.classList.add("OpenPopup");
        this.isOpenModel = true;
      }
    },
  },
};
</script>
<style scoped>
#myMap {
  height: calc(100% - 65px);
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
  border-radius: 4px;
  border: 1px solid #ccc;
  -webkit-box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
  -moz-box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
  box-shadow: 2px 2px 10px 0px rgba(59, 59, 59, 0.39);
}
#colorSelection p {
  padding-left: 10px;
  margin-bottom: 5px;
  font-weight: 600;
  color: #393942;
  font-size: 15px;
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

.confirmation_popup {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.6);
  bottom: 0;
}
.confirmation_body {
  background: #fff;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  position: relative;
  max-width: 550px;
  padding: 30px;
  border-radius: 3px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  text-align: center;
}
body.OpenPopup {
  position: relative;
}
.confirmation_popup h6 {
  font-size: 20px;
  margin-bottom: 20px;
  text-transform: capitalize;
  color: #259ad7;
}
.confirmation_popup p {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}
.confirmation_popup .btn-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirmation_popup .btn-wrap .btn {
  margin: 0 15px;
}
.confirmation_popup .pop-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 15px;
  cursor: pointer;
  transition: all 0.5s;
}
.btn {
  font-size: 16px;
  line-height: 1.3;
  padding: 7px 15px;
}
.btn-blue {
  color: #fff;
  background-color: #259ad7;
  border-color: #259ad7;
}
.btn-trans {
  color: #333;
  background-color: #fff;
  border-color: #999;
}
#colorSelection .cm-btn {
  padding: 0;
  background: transparent;
  border: none;
  margin: 0;
  color: inherit;
  transition: all 0.5s;
}
#colorSelection .cm-btn:focus {
  box-shadow: none;
  outline: none;
}
</style>
