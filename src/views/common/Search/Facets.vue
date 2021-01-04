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
      tileLayer: null,
      imgElement: null,
      polyData: [],
      area: null,
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
            color: "#1e0fff",
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

      areas.map((areaData, i) => {
        this.totalArea = this.totalArea + parseFloat(areaData);
        _finalObject.shape[i].area = parseFloat(areaData);
        _finalObject.shape[i].unit = areaData.split(" ").pop();
        _finalObject.totalArea = this.totalArea;
        _finalObject.unit = areaData.split(" ").pop();
      });

      localStorage.setItem("finalObject", JSON.stringify(_finalObject));

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
            this.finalObject = _finalObject;
          }
        });
      }

      // ------ polyline end
    },
    async createMapImage() {
      const width = 1100;
      const height = 900;
      const mapElement = document.getElementById("myMap");
      const dataURL = await domtoimage.toPng(mapElement, { width, height });
      this.imgElement = new Image();
      this.imgElement.src = dataURL;
    },

    async handlePdf() {
      await this.createMapImage();
      const doc = new jsPDF();
      // const doc = new jsPDF('landscape');
      let pageHeight = doc.internal.pageSize.height;

      // -------table data start -------------
      var edgesTable = [];
      var areaTable = [];

      var edgesCol = ["Sr. No.", "Edges", "Color", "Measurement"];
      var areaCol = ["Sr. No.", "Area", "Total area"];
      var edgesRows = [];
      var areaRows = [];

      JSON.parse(JSON.stringify(this.finalObject)).shape.map((latlng, i) => {
        areaTable.push({
          index: `Shape - ${i + 1}`,
          area: latlng.area + latlng.unit,
          totalArea:
            JSON.parse(JSON.stringify(this.finalObject)).totalArea +
            JSON.parse(JSON.stringify(this.finalObject)).unit,
        });

        latlng.path.map((ltlg, j) => {
          if (ltlg[0].isColorChanged) {
            edgesTable.push({
              index: j + 1,
              label: ltlg[0].label,
              color: ltlg[0].color,
              length: ltlg[0].length,
            });
          }
        });
      });
      // -------table data end -------------

      // Before adding new content
      let y = 500; // Height position of new content

      doc.setFontSize(20);
      doc.setTextColor("Gray");
      doc.text("Roof Report", 10, 10);
      doc.setFontSize(17);
      doc.setTextColor("Gray");
      doc.text(
        this.$store.state.map.place ? this.$store.state.map.place : "",
        20,
        20
      );
      doc.setFontSize(16);
      doc.setTextColor("Gray");
      doc.text(`${this.polyData.length} Facets`, 20, 30);
      doc.text(
        `Total Facet Area : ${
          JSON.parse(JSON.stringify(this.finalObject)).totalArea
        } ${JSON.parse(JSON.stringify(this.finalObject)).unit}`,
        20,
        40
      );

      var widthImg = doc.internal.pageSize.getWidth();
      var heightImg = doc.internal.pageSize.getHeight();

      doc.addImage(this.imgElement, "PNG", 20, 50, 170, 200);

      if (y >= pageHeight) {
        doc.addPage();
        y = 0; // Restart height position
        doc.text(`Length Measurement Report`, 20, 20);

        edgesTable.forEach((element, i) => {
          var temp = [i, element.label, element.color, element.length];
          edgesRows.push(temp);
        });

        areaTable.forEach((element, i) => {
          var temp1 = [element.index, element.area, element.totalArea];
          areaRows.push(temp1);
        });

        doc.autoTable(edgesCol, edgesRows, {
          startY: 10 * edgesTable.length,
        });

        doc.text(
          `Area Measurement Report`,
          20,
          10 + 10 * edgesTable.length * areaTable.length - 5
        );

        doc.autoTable(areaCol, areaRows, {
          startY: 10 + 10 * edgesTable.length * areaTable.length,
        });
      }
      doc.save("map_report.pdf");
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
