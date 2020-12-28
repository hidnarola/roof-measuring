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

      this.zoom = localStorage.getItem("zoom") || 16;

      var initLatLng = (localStorage.getItem("initLatLng") != null || localStorage.getItem("initLatLng") != undefined) && JSON.parse(localStorage.getItem("initLatLng"));

      this.initLat = initLatLng && initLatLng.lat ||  -41.2858;
      this.initLng = initLatLng && initLatLng.lng || 174.78682 ;

      this.map = L.map("myMap").setView( [this.initLat, this.initLng], this.zoom );

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, maxNativeZoom: 19, }
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

            var distance = L.latLng([ this.latlngs[i][j][0].lat, this.latlngs[i][j][0].lng, ]).distanceTo([ this.latlngs[i][j][1].lat, this.latlngs[i][j][1].lng]);
            path.setText(`${distance.toFixed(2)} m`, {
              center: true,
              attributes: { fill: "yellow" },
              // orientation: "70",
            });

            path.on("click", function (e) {
              if (vueInstance.enableColor) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map( (poly) => poly && poly.map((pl) => {
                      if (
                        pl[0].lat === e.sourceTarget._latlngs[0].lat &&
                        pl[0].lng === e.sourceTarget._latlngs[0].lng &&
                        pl[1].lat === e.sourceTarget._latlngs[1].lat &&
                        pl[1].lng === e.sourceTarget._latlngs[1].lng
                      ) {
                        return ( pl && pl.map((dt) => {
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
                e.sourceTarget.setStyle({ color: vueInstance.selectedColor , });
                localStorage.setItem("latlng", JSON.stringify(vueInstance.latlngs));
              }
            });

            path.on("click", function (e) {
              if (vueInstance.enableDelete) {
                vueInstance.latlngs = JSON.parse(
                  JSON.stringify(vueInstance.latlngs)
                ).map((dtt) =>
                  dtt.filter((dt) => {
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
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
