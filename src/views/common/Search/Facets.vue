<template>
  <div>
    <button @click="handlePdf" class="download-pdf-btn">Download Pdf</button>
    <div id="myMap"></div>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import "jspdf-autotable";
export default {
  name: "LeafletMap",
  data() {
    return {
      finalObject: null,
      selectedColor: null,
      map: null,
      initLat: -41.2858,
      initLng: 174.78682,
      zoom: 16,
      imgElement: null,
      polyData: [],
      totalArea: null,
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

      this.initLat = (initLatLng && initLatLng.lat) || -41.2858;
      this.initLng = (initLatLng && initLatLng.lng) || 174.78682;

      this.map = L.map("myMap", {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView([this.initLat, this.initLng], this.zoom);

      // this.map.doubleClickZoom.disable();
      // this.map.scrollWheelZoom.disable();

      this.tileLayerData = L.tileLayer(
        "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 20, maxNativeZoom: 19 }
      ).addTo(this.map);

      L.marker([this.initLat, this.initLng]).addTo(this.map);

      this.polyData = JSON.parse(localStorage.getItem("polygon")) || [];

      let polyStore =
        this.polyData &&
        this.polyData.map((shape) => {
          var polygon = L.polygon([shape], {
            showMeasurements: true,
            // measurementOptions: { imperial: true },
            color: "Blue",
            dashArray: "5 5",
            lineCap: "round",
            weight: 0,
            opacity: 0,
          }).addTo(this.map);
        });
      // setting out the area measurements
      let areas = [];
      this.map.eachLayer(function (layer) {
        if (layer._title == "Total area") {
          +areas.push(layer._measurement);
        }
      });

      areas &&
        areas.map((areaData, i) => {
          this.totalArea = this.totalArea + parseFloat(areaData);
          _finalObject.shape[i].area = parseFloat(areaData);
          _finalObject.shape[i].unit = areaData.split(" ").pop();
          _finalObject.totalArea = this.totalArea;
          _finalObject.unit = areaData.split(" ").pop();
        });

      // ----- polyline draw
      if (
        _finalObject &&
        _finalObject.shape != null &&
        _finalObject.shape.length > 0
      ) {
        _finalObject.shape.map((shp) => {
          for (var i = 0; i < shp.path.length; i++) {
            //  create a polyline
            var poly = new L.Polyline(shp.path[i], {
              color: vueInstance.selectedColor
                ? vueInstance.selectedColor
                : shp.path[i][0].color,
              dashArray: "5 5",
              lineCap: "round",
              weight: 3,
              opacity: 1,
            }).addTo(this.map);

            var distance = L.latLng([
              shp.path[i][0].lat,
              shp.path[i][0].lng,
            ]).distanceTo([shp.path[i][1].lat, shp.path[i][1].lng]);
          }
        });
      }
      _finalObject &&
        _finalObject.shape.map((shape, i) => {
          shape &&
            shape.path.map((pth) => {
              let length = parseFloat(pth[0].length.split(" ", 1).pop());
              let unit = pth[0].length.split(" ").pop();
              if (shape.type && shape.type[pth[0].label]) {
                shape.type[pth[0].label].length += length;
              } else {
                shape.type = {
                  ...shape.type,
                  [pth[0].label]: {
                    label: pth[0].label,
                    color: pth[0].color,
                    length: length,
                    unit,
                  },
                };
              }

              let _length = parseFloat(pth[0].length.split(" ", 1).pop());
              let _unit = pth[0].length.split(" ").pop();
              if (
                _finalObject.measurement &&
                _finalObject.measurement[pth[0].label]
              ) {
                _finalObject.measurement[pth[0].label].length += _length;
              } else {
                _finalObject.measurement = {
                  ..._finalObject.measurement,
                  [pth[0].label]: {
                    label: pth[0].label,
                    color: pth[0].color,
                    length: _length,
                    unit: _unit,
                  },
                };
              }
              _finalObject.totalFacets = this.polyData.length;
              this.finalObject = _finalObject;
              localStorage.setItem("finalObject", JSON.stringify(_finalObject));
            });
        });

      // ------ polyline end
    },
    async createMapImage() {
      // DomtoImage
      const mapElement = document.getElementById("myMap");
      const scale = 2;
      this.imgElement = await domtoimage.toPng(mapElement, {
        height: mapElement.offsetHeight * scale,
        style: {
          transform: `scale(${scale}) translate(${
            mapElement.offsetWidth / 2 / scale
          }px, ${mapElement.offsetHeight / 2 / scale}px)`,
        },
        width: mapElement.offsetWidth * scale,
      });
    },

    async handlePdf() {
      await this.createMapImage();
      const doc = new jsPDF();
      let pageHeight = doc.internal.pageSize.height;

      // -------table data start -------------
      var edgesTable = [];
      var areaTable = [];

      var edgesCol = ["Sr. No.", "Edges", "Color", "Measurement", "Unit"];
      var areaCol = ["Sr. No.", "Area", "Total area"];
      var edgesRows = [];
      var areaRows = [];
      let _printData = JSON.parse(JSON.stringify(this.finalObject));
      console.log("_printData => ", _printData);

      _printData.shape.map((latlng, i) => {
        areaTable.push({
          index: `Shape - ${i + 1}`,
          area: latlng.area + latlng.unit,
          totalArea:
            JSON.parse(JSON.stringify(this.finalObject)).totalArea +
            JSON.parse(JSON.stringify(this.finalObject)).unit,
        });
      });

      Object.keys(_printData.measurement).map((key, index) => {
        edgesTable.push({
          index: index,
          label: key,
          color: _printData.measurement[key].color,
          length: _printData.measurement[key].length,
          unit: _printData.measurement[key].unit,
        });
      });

      edgesTable.forEach((element, i) => {
        var temp = [
          i,
          element.label,
          element.color,
          element.length,
          element.unit,
        ];
        edgesRows.push(temp);
      });

      areaTable.forEach((element, i) => {
        var temp1 = [element.index, element.area, element.totalArea];
        areaRows.push(temp1);
      });

      // -------table data end -------------

      // Before adding new content
      let y = 500; // Height position of new content

      doc.setFontSize(20);
      doc.setTextColor("Gray");
      doc.setFontSize(30);
      doc.text(10, 10, "Roof Report");
      doc.setFontSize(17);
      doc.setTextColor("Gray");
      doc.text(
        this.$store.state.map.place ? this.$store.state.map.place : "",
        20,
        20
      );
      doc.setFontSize(16);
      doc.setTextColor("Gray");
      doc.text(`${_printData.totalFacets} Facets`, 20, 30);
      doc.text(
        `Total Facet Area : ${_printData.totalArea} ${_printData.unit}`,
        20,
        40
      );

      doc.addImage(this.imgElement, "PNG", 20, 50, 180, 150);

      if (y >= pageHeight) {
        doc.addPage();
        y = 0; // Restart height position
        doc.text(`Length Measurement Report`, 20, 20);

        doc.autoTable(edgesCol, edgesRows, {
          startY: 20 * edgesTable.length,
        });

        doc.addPage();
        doc.text(`Area Measurement Report`, 20, 20);

        doc.autoTable(areaCol, areaRows, { startY: 30});
        _printData.shape.map((shp, i) => {
          doc.addPage();
          doc.setFontSize(16);
          doc.setTextColor("Gray");
          doc.text(`Structure #${i} Summary`, 20, i * 10 + 10);
          doc.setFontSize(12);
          doc.setTextColor("Gray");
          doc.text(
            `Total Roof Facets ${
              _printData.totalFacets / _printData.totalFacets
            } facets`,
            20,
            i * 10 + 20
          );
          let stayY;

          Object.keys(shp.type).map((key, index) => {
            doc.text( `Total ${shp.type[key].color}  ${shp.type[key].label} ${shp.type[key].length} ${shp.type[key].unit}`, 20, i * 10 + 30 + index * 10);
            stayY = i * 10 + 30 + index * 10;
            // doc.text(
            //   `Total  Hips + Ridges ${shp.type[key].length}`,
            //   20,
            //   stayY + 10
            // );
            // doc.text(
            //   `Total Eaves + Rakes  ${shp.type[key].color}  ${shp.type[key].label} ${shp.type[key].length}`,
            //   20,
            //   20 + i * 150 + 10 * index + 10
            // );
          });
          doc.text(`Total Roof Area ${shp.area + shp.unit}`, 20, stayY + 10);
        });
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor("Gray");
        doc.text(`All Structures Summary `, 20, 20);
        doc.setFontSize(12);
        doc.setTextColor("Gray");
        doc.text(`Total Roof Area ${_printData.totalArea} ${_printData.unit}`, 20, 30 );
        doc.text(`Total Roof Facets ${_printData.totalFacets} facets`, 20, 40);

        Object.keys(_printData.measurement).map((key, index) => {
          doc.text( `Total ${key} ${_printData.measurement[key].length} ${_printData.measurement[key].unit}`, 20, 50 + index * 10);
        });

        // Hips + Ridges 225ft 8in
        // Eaves + Rakes 294ft 10in
      }
      doc.save("map_report.pdf");
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
