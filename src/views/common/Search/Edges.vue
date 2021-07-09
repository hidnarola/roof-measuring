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

    <div id="colorSelection" class="facets-section">
      <p>Edges tool</p>
      <div v-for="(display, idx) in colors" :key="idx">
        <div
          @click="handleColor(display.backgroundColor, display.label)"
          class="name"
        >
          <span class="colorbox" :class="['bg-' + display.label]"></span>
          {{ display.label }}
        </div>
      </div>
      <div class="name">
        <button @click="handleRemove()" class="delete cm-btn">
          <span><img src="../../../../public/images/cancel.svg" /></span>
          Delete Edge
        </button>
      </div>
      <div class="name">
        <button @click="handleModal" class="delete cm-btn">
          <span><img src="../../../../public/images/trash.svg" /></span>
          Delete All Edges
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { initLat, initLng, initZoom, setAddress } from "../../../shared/shared";
export default {
  name: "LeafletMap",
  data() {
    return {
      colors: [
        { label: "Eaves", backgroundColor: "#71bf82" },
        { label: "Valleys", backgroundColor: "#f0512e" },
        { label: "Hips", backgroundColor: "#9368b7" },
        { label: "Ridges", backgroundColor: "#d0efb1" },
        { label: "Rakes", backgroundColor: "#ffcc0f" },
        { label: "Unspecified", backgroundColor: "#1e0fff" },
      ],
      selectedColor: null,
      selectedLabel: null,
      enableDelete: false,
      enableColor: false,
      isOpenModel: false,
      map: null,
      lat: initLat,
      lng: initLng,
      zoom: initZoom,
      polyData: [],
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
      var zoom = localStorage.getItem("zoom");
      var initLatLng = JSON.parse(localStorage.getItem("initLatLng"));
      this.polyData = JSON.parse(
        JSON.stringify(JSON.parse(localStorage.getItem("polygon")))
      );

      this.lat = (initLatLng && initLatLng.lat) || initLat;
      this.lng = (initLatLng && initLatLng.lng) || initLng;

      this.map = L.map("myMap", {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView([this.lat, this.lng], zoom ? zoom : initZoom);

      L.tileLayer(process.env.VUE_APP_LEAFLET_MAP, {
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(this.map);
      var marker;

      marker = L.marker([this.lat, this.lng], {
        draggable: true,
      }).addTo(this.map);

      if (
        _finalObject &&
        _finalObject.shape != null &&
        _finalObject.shape.length > 0
      ) {
        _finalObject.shape.map((shp, shpIndex) => {
          shp.path.map((path, pathIndex) => {
            // Create a polyline
            var poly = new L.Polyline(path, {
              showMeasurements: true,
              color: vueInstance.selectedColor || path[0].color,
              dashArray: "5 5",
              lineCap: "round",
              weight: 3,
              opacity: 1,
              measurementOptions: { imperial: true },
            }).addTo(this.map);

            poly.setText(`${path[1].length}`, {
              center: true,
              attributes: { fill: "yellow" },
            });

            
            poly.on("click", function (e) {

              if (vueInstance.enableColor) {
                //Color change code
                vueInstance.colorPolyline(shp, path, e, _finalObject);
              } else if (vueInstance.enableDelete) {
                // Delete line code
                vueInstance.deletePolyline(
                  shp,
                  pathIndex,
                  shpIndex,
                  path,
                  e,
                  _finalObject
                );
              }
            });
            _finalObject.totalFacets = this.polyData.length;
            localStorage.setItem("finalObject", JSON.stringify(_finalObject));
          });
        });
      }
      marker.on("dragend", function (e) {
        localStorage.setItem(
          "initLatLng",
          JSON.stringify(e.target.getLatLng())
        );
        setAddress(e.target.getLatLng().lat, e.target.getLatLng().lng);
      });
      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
      });
    },
    deletePolyline(shp, pathIndex, shpIndex, path, e, _finalObject) {
      if (
        path[0].lat == e.sourceTarget._latlngs[0].lat &&
        path[0].lng == e.sourceTarget._latlngs[0].lng &&
        path[1].lat == e.sourceTarget._latlngs[1].lat &&
        path[1].lng == e.sourceTarget._latlngs[1].lng
      ) {
        shp.path.splice(pathIndex, 1);
        shp.path.length === 0 && _finalObject.shape.splice(shpIndex, 1);
        this.polyData.map((polyD, ind) => {
          polyD.map((plData) => {
            if (
              plData[0] == e.sourceTarget._latlngs[1].lat && plData[1] == e.sourceTarget._latlngs[1].lng
            ) {
              this.polyData.splice(ind, 1);
              if (
                _finalObject.shape[shpIndex] &&
                _finalObject.shape[shpIndex].area
              ) {
                _finalObject.totalArea = parseFloat(
                  (
                    _finalObject.totalArea - _finalObject.shape[shpIndex].area
                  ).toFixed(2)
                );
                _finalObject.shape[shpIndex].area = 0;
              }
            }
          });
        });

        let len = parseFloat(path[1].length.split(" ")[0]);

        if (shp.type && shp.type.hasOwnProperty(path[1].label)) {
          shp.type[path[1].label].length -= len;
          if (shp.type[path[1].label].length <= 0) {
            shp.type[path[1].label].length = 0;
          }
        }
        if (
          _finalObject.measurement &&
          _finalObject.measurement.hasOwnProperty(path[1].label)
        ) {
          _finalObject.measurement[path[0].label].length -= len;
          if (_finalObject.measurement[path[0].label].length <= 0) {
            _finalObject.measurement[path[0].label].length = 0;
          }
        }
        e.sourceTarget.remove(this.map);
      }
      
      
      localStorage.setItem("polygon", JSON.stringify(this.polyData));
      _finalObject.totalFacets = this.polyData.length;
      localStorage.setItem("finalObject", JSON.stringify(_finalObject));
    },
    colorPolyline(shp, path, e, _finalObject) {
      if (
        path[0].lat === e.sourceTarget._latlngs[0].lat &&
        path[0].lng === e.sourceTarget._latlngs[0].lng &&
        path[1].lat === e.sourceTarget._latlngs[1].lat &&
        path[1].lng === e.sourceTarget._latlngs[1].lng
      ) {
        path.map((p) => {
          p.color = this.selectedColor;
          p.label = this.selectedLabel;
        });

        e.sourceTarget.setStyle({ color: this.selectedColor });
      }
      this.updateLineColor(shp, _finalObject);
      localStorage.setItem("finalObject", JSON.stringify(_finalObject));
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
    updateLineColor(shp, _finalObject) {
      var type = null;
      var measurement = null;
      shp.path.map((pathPoint) => {
        let unit = pathPoint[1].length.split(" ").pop();
        let length = parseFloat(pathPoint[1].length.split(" ")[0]);
        // Update shape's type object - type is handeling line's color and length info
        if (
          type &&
          type[pathPoint[1].label] != null &&
          pathPoint[1].label == type[pathPoint[1].label].label
        ) {
          type[pathPoint[1].label].length += length;
        } else {
          type = {
            ...type,
            [pathPoint[1].label]: {
              length: length,
              label: pathPoint[1].label,
              color: pathPoint[1].color,
              unit,
            },
          };
        }
        shp.type = {
          ...type,
          ..._.omit(
            {
              ...type,
              Unspecified: {
                length: 0,
                label: "Unspecified",
                color: "#1e0fff",
                unit,
              },
              Hips: {
                length: 0,
                label: "Hips",
                color: "#9368b7",
                unit,
              },
              Valleys: {
                length: 0,
                label: "Valleys",
                color: "#f0512e",
                unit,
              },
              Eaves: {
                length: 0,
                label: "Eaves",
                color: "#71bf82",
                unit,
              },
              Rakes: {
                length: 0,
                label: "Rakes",
                color: "#ffcc0f",
                unit,
              },
              Ridges: {
                length: 0,
                label: "Ridges",
                color: "#d0efb1",
                unit,
              },
            },
            [...Object.keys(type)]
          ),
        };
      });
      //update measurements for all shape line's color

      _finalObject.shape.map((shape) => {
        shape.type &&
          Object.keys(shape.type).map((key, index) => {
            if (measurement && measurement[key] != null) {
              measurement[key].length += shape.type[key].length;
            } else {
              measurement = {
                ...measurement,
                [key]: {
                  label: shape.type[key].label,
                  color: shape.type[key].color,
                  length: shape.type[key].length,
                  unit: shape.type[key].unit,
                },
              };
            }
          });
        _finalObject.measurement = measurement;
      });
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
