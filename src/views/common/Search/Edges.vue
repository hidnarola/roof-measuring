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
        <div @click="handleColor(display.color, display.label)" class="name">
          <span class="colorbox" :class="['bg-' + display.color]"></span>
          {{ display.label }}
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
import _ from "lodash";
export default {
  name: "LeafletMap",
  data() {
    return {
      colors: [
        { label: "Eaves", backgroundColor: "#F4A460", color: "SandyBrown" },
        { label: "Valleys", backgroundColor: "#FFFF00", color: "Yellow" },
        { label: "Hips", backgroundColor: "#FA8072", color: "Salmon" },
        { label: "Ridges", backgroundColor: "#FFA500", color: "Orange" },
        { label: "Rakes", backgroundColor: "#008000", color: "Green" },
        { label: "Unspecified", backgroundColor: "#1e0fff", color: "Blue" },
      ],
      selectedColor: null,
      selectedLabel: null,
      finalObject: null,
      enableDelete: false,
      enableColor: false,
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

      var _finalObject = JSON.parse(
        JSON.stringify(JSON.parse(localStorage.getItem("finalObject")))
      );

      this.zoom = localStorage.getItem("zoom") || 16;

      var initLatLng =
        (localStorage.getItem("initLatLng") != null ||
          localStorage.getItem("initLatLng") != undefined) &&
        JSON.parse(localStorage.getItem("initLatLng"));

      let polyData = JSON.parse(
        JSON.stringify(JSON.parse(localStorage.getItem("polygon")))
      );

      this.initLat = (initLatLng && initLatLng.lat) || -41.2858;
      this.initLng = (initLatLng && initLatLng.lng) || 174.78682;

      this.map = L.map("myMap", {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView([this.initLat, this.initLng], this.zoom);

      L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, maxNativeZoom: 19 }
      ).addTo(this.map);

      L.marker([this.initLat, this.initLng]).addTo(this.map);

      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
      });

      if (
        _finalObject &&
        _finalObject.shape != null &&
        _finalObject.shape.length > 0
      ) {
        _finalObject.shape.map((shp, index) => {
          shp.path.map((path, i) => {
            //  create a polyline
            var poly = new L.Polyline(path, {
              // showMeasurements: true,
              color: vueInstance.selectedColor
                ? vueInstance.selectedColor
                : path[0].color,
              dashArray: "5 5",
              lineCap: "round",
              weight: 3,
              opacity: 1,
              // measurementOptions: { imperial: true },
            }).addTo(this.map);

            var distance = L.latLng([path[0].lat, path[0].lng]).distanceTo([
              path[1].lat,
              path[1].lng,
            ]);

            path[0]["length"] = `${distance.toFixed(1)} m`;
            path[1]["length"] = `${distance.toFixed(1)} m`;

            poly.setText(`${distance.toFixed(1)} m`, {
              center: true,
              attributes: { fill: "yellow" },
            });
            //Color change
            poly.on("click", function (e) {
              if (vueInstance.enableColor) {
                if (
                  path[0].lat === e.sourceTarget._latlngs[0].lat &&
                  path[0].lng === e.sourceTarget._latlngs[0].lng &&
                  path[1].lat === e.sourceTarget._latlngs[1].lat &&
                  path[1].lng === e.sourceTarget._latlngs[1].lng
                ) {
                  path.map((p) => {
                    p.color = vueInstance.selectedColor;
                    p.isColorChanged = true;
                    p.label = vueInstance.selectedLabel;
                  });
                }
                let unit = path[0].length.split(" ").pop();
                let length = parseFloat(path[0].length.split(" ")[0]);

                var type = shp.type || null;
                if (type && type[path[0].label] != undefined) {
                  type[path[0].label].length += length;
                } else {
                  type = {
                    ...type,
                    [path[0].label]: {
                      length: length,
                      label: path[0].label,
                      color: path[0].color,
                      unit,
                    },
                  };
                  shp.type = type;
                }

                let _length = parseFloat(path[0].length.split(" ", 1).pop());
                let _unit = path[0].length.split(" ").pop();
                if (_finalObject.measurement && _finalObject.measurement[path[0].label]) {
                  _finalObject.measurement[path[0].label].length += _length;
                } else {
                  _finalObject.measurement = {
                    ..._finalObject.measurement,
                    [path[0].label]: {
                      label: path[0].label,
                      color: path[0].color,
                      length: _length,
                      unit: _unit,
                    },
                  };
                }
                e.sourceTarget.setStyle({ color: vueInstance.selectedColor });
                //updatated colored line length
              }
              localStorage.setItem("finalObject", JSON.stringify(_finalObject));
            });
            poly.on("click", function (e) {
              if (vueInstance.enableDelete) {
                // Delete line code with update FinalObject and polygon
                if (
                  path[0].lat == e.sourceTarget._latlngs[0].lat &&
                  path[0].lng == e.sourceTarget._latlngs[0].lng &&
                  path[1].lat == e.sourceTarget._latlngs[1].lat &&
                  path[1].lng == e.sourceTarget._latlngs[1].lng
                ) {
                  shp.path.splice(i, 1);
                  polyData.map((polyD, ind) => {
                    polyD.map((plData, j) => {
                      if (
                        plData[0] == e.sourceTarget._latlngs[1].lat &&
                        plData[1] == e.sourceTarget._latlngs[1].lng
                      ) {
                        polyData.splice(ind, 1);
                        _finalObject.totalArea = parseFloat(
                          (
                            _finalObject.totalArea -
                            _finalObject.shape[index].area
                          ).toFixed(2)
                        );
                        _finalObject.shape[index].area = 0;
                      }
                    });
                  });
                  let len = parseFloat(path[0].length.split(" ")[0])

                  if (shp.type && shp.type.hasOwnProperty(path[0].label)) {
                    shp.type[path[0].label].length -= len;
                    if (shp.type[path[0].label].length <= 0) {
                      delete shp.type[path[0].label];
                    }
                  }
                  if (
                    _finalObject.measurement &&
                    _finalObject.measurement.hasOwnProperty(path[0].label)
                  ) {
                    _finalObject.measurement[path[0].label].length -= len;
                    if (_finalObject.measurement[path[0].label].length <= 0) {
                      delete _finalObject.measurement[path[0].label];
                    }
                  }
                  _finalObject.totalFacets = polyData.length;
                  localStorage.setItem("polygon", JSON.stringify(polyData));
                }
                e.sourceTarget.remove(this.map);
                localStorage.setItem("finalObject", JSON.stringify(_finalObject));
              }
            });
            localStorage.setItem("finalObject", JSON.stringify(_finalObject));
          });
        });
      }
      localStorage.setItem("finalObject", JSON.stringify(_finalObject));
      this.finalObject = _finalObject;
    },
    handleColor(color, label) {
      this.enableColor = true;
      this.enableDelete = false;
      this.selectedColor = color;
      this.selectedLabel = label;
    },
    handleRemove() {
      this.enableDelete = true;
      this.enableColor = false;
    },
    handleRemoveAll() {
      this.finalObject = null;
      localStorage.removeItem("finalObject");
      localStorage.removeItem("polygon");
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
