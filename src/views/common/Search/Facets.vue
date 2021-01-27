<template>
  <div>
    <button @click="handlePdf" class="download-pdf-btn">Download Pdf</button>
    <div id="myMap"></div>
    <canvas id="canvas" width="1000" height="800"></canvas>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
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
      totalArea: 0,
      area: 0,
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

      this.zoom = JSON.parse(localStorage.getItem("zoom")) || 16;

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
      // ----- polygon draw
      this.polyData &&
        this.polyData.map((shape, i) => {
          if (
            shape[0][0] == shape[shape.length - 1][0] &&
            shape[0][1] == shape[shape.length - 1][1]
          ) {
            var polygon = L.polygon([shape], {
              showMeasurements: true,
              // measurementOptions: { imperial: true },
              color: "Blue",
              dashArray: "5 5",
              lineCap: "round",
              weight: 0,
              opacity: 0,
            }).addTo(this.map);
          }
        });

      // setting out the area measurements
      this.map.eachLayer((layer) => {
        if (layer._latlngs) {
          _finalObject.shape &&
            _finalObject.shape.map((shapes, i) => {
              shapes.path.map((pathPoint, j) => {
                layer._latlngs &&
                  layer._latlngs[0].map((_latlng) => {
                    if (
                      pathPoint[0].lat == _latlng.lat &&
                      pathPoint[0].lng == _latlng.lng
                    ) {
                      _finalObject.shape[i].area = parseFloat(
                        Math.round(
                          L.GeometryUtil.geodesicArea(layer._latlngs[0])
                        )
                      );
                      _finalObject.shape[i].unit = "m²";
                    }
                  });
              });
            });
        }
      });
      var totalArea = 0;
      _finalObject.shape &&
        _finalObject.shape.map((shapes, i) => {
          totalArea += shapes.area;
        });
      _finalObject.totalArea = parseFloat(Math.round(totalArea));
      _finalObject.unit = "m²";

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

            shp.path[i][0]["length"] = `${distance.toFixed(1)} m`;
            shp.path[i][1]["length"] = `${distance.toFixed(1)} m`;

            poly.setText(`${shp.path[i][0].length}`, {
              center: true,
              attributes: { fill: "yellow" },
            });
          }
        });
      }
      this.finalObject = _finalObject;
      localStorage.setItem("finalObject", JSON.stringify(_finalObject));
      // ------ polyline end
    },
    async createMapImage() {
      // DomtoImage - to take place image
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
      //PDF data
      await this.createMapImage();
      const doc = new jsPDF();

      doc.page = 1; // use this as a counter.

      function footer() {
        //Footer
        doc.setFontSize(10);
        doc.setTextColor("gray");
        doc.text(
          10,
          285,
          "Copyright © 2020 Roofmeasurement.com | All rights reserved."
        );
        doc.text(
          doc.internal.pageSize.getWidth() - 40,
          285,
          "page " + doc.page
        );
        doc.page++;
      }

      function header() {
        //Header
        doc.setFontSize(10);
        doc.setTextColor("gray");
        doc.text(150, 10, "Powered By Roof Measurement"); //print number bottom right
      }

      let canvasElement = document.getElementById("canvas");
      var context = canvasElement.getContext("2d");

      // Table data start to manage the polyline measurment with colors
      var edgesTable = [];
      var areaTable = [];

      var edgesCol = ["Sr. No.", "Edges", "Color", "Measurement", "Unit"];
      var areaCol = ["Sr. No.", "Area", "Total area"];
      var edgesRows = [];
      var areaRows = [];
      let _printData = JSON.parse(JSON.stringify(this.finalObject));

      _printData.shape.map((latlng, i) => {
        if (latlng.area != 0) {
          areaTable.push({
            index: `Shape - ${i}`,
            area: latlng.area + latlng.unit,
            totalArea:
              JSON.parse(JSON.stringify(this.finalObject)).totalArea +
              JSON.parse(JSON.stringify(this.finalObject)).unit,
          });
        }
      });

      Object.keys(_printData.measurement).map((key, index) => {
        edgesTable.push({
          index: index,
          label: key,
          color: _printData.measurement[key].color,
          length: _printData.measurement[key].length.toFixed(2),
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
      //First page- adding new content with header(); footer()
      header();
      footer();
      doc.setFontSize(20);
      doc.setTextColor("#259ad7");
      doc.text(10, 20, "Roof Report");
      doc.setFontSize(12);
      doc.setTextColor("Gray");
      doc.text( this.$store.state.map.place ? this.$store.state.map.place : "", 20, 30 );
      doc.text(`${_printData.totalFacets} Facets`, 20, 40);
      doc.text( `Total Facet Area : ${_printData.totalArea} ${_printData.unit}`, 20, 50 );

      doc.addImage(this.imgElement, "PNG", 20, 60, 170, 150);
      // ---------------Length Measurement Report--------------------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`Length Measurement Report`, 10, 20);

      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.autoTable(edgesCol, edgesRows, { startY: 30, });
      // -------------Area Measurement Report---------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`Area Measurement Report`, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.autoTable(areaCol, areaRows, { startY: 30 });

      _printData.shape.map((shp, i) => {
        if (shp.area != 0) {
          // -------------Structure Summary for particular Shape-----------------
          doc.addPage();
          header();
          footer();
          doc.setFontSize(16);
          doc.setTextColor("#259ad7");
          doc.text(`Structure #${i} Summary`, 15, 20);
          doc.setFontSize(14);
          doc.setTextColor("Gray");
          doc.text(`Measurement`, 20, 30);
          doc.setFontSize(11);
          doc.setTextColor("Gray");
          doc.text(`Total Roof Facets ${ _printData.totalFacets / _printData.totalFacets } facets`, 20, 40);

          let _EavesRakes = 0, _HipsRidges = 0, _lengthUnit, stayY;
          Object.keys(shp.type).map((key, index) => {
            doc.text(`Total ${shp.type[key].label} ${shp.type[key].length.toFixed( 2 )} ${shp.type[key].unit}`, 20, 50 + index * 10 );
            stayY = 50 + index * 10;
            switch (key) {
              case "Hips":
                _HipsRidges += shp.type["Hips"].length;
                break;
              case "Ridges":
                _HipsRidges += shp.type["Ridges"].length;
                break;
              case "Eaves":
                _EavesRakes += shp.type["Eaves"].length;
                break;
              case "Rakes":
                _EavesRakes += shp.type["Rakes"].length;
                break;
              default:
                break;
            }
            _lengthUnit = shp.type[key] && shp.type[key].unit && shp.type[key].unit;
          });

          doc.text( `Hips + Ridges ${_HipsRidges.toFixed(2)} ${_lengthUnit}`, 20, stayY + 10 );
          doc.text( `Eaves + Rakes ${_EavesRakes.toFixed(2)} ${_lengthUnit}`, 20, stayY + 20 );
          doc.text(`Total Roof Area ${shp.area + shp.unit}`, 20, stayY + 30);
        }
      });
      // ---------All Shape Structures Summary-------
      doc.addPage();
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Shape Structures Summary`, 15, 20);

      var point;
      for (var i = 0; i < this.polyData.length; i++) {
        context.beginPath();
        for (var j = 0; j < this.polyData[i].length; j++) {
          point = this.map.latLngToLayerPoint([
            this.polyData[i][j][0],
            this.polyData[i][j][1],
          ]);
          context.strokeStyle = "#259ad7";
          context.lineWidth = 1.5;
          context.lineTo(point.x, point.y);
        }
        context.closePath();
        context.stroke();
        var imgData = canvasElement.toDataURL("image/png");
        const imgProps = doc.getImageProperties(imgData);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const widthRatio = pageWidth / context.canvas.width;
        const heightRatio = pageHeight / context.canvas.height;
        const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;

        const canvasWidth = context.canvas.width * ratio;
        const canvasHeight = context.canvas.height * ratio;

        const marginX = (pageWidth - canvasWidth) / 2;
        const marginY = (pageHeight - canvasHeight) / 2;

        doc.addImage( imgData, "PNG", marginX, marginY, canvasWidth, canvasHeight );
      }
      // -----------All Structures Summary----------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Structures Summary `, 15, 20);
      doc.setFontSize(14);
      doc.setTextColor("Gray");
      doc.text(`Measurement`, 20, 30);
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text( `Total Roof Area ${_printData.totalArea} ${_printData.unit}`, 20, 40 );
      doc.text(`Total Roof Facets ${_printData.totalFacets} facets`, 20, 50);
      let EavesRakes = 0, HipsRidges = 0, startY = 0, lengthUnit;

      Object.keys(_printData.measurement).map((key, index) => {
        doc.text( `Total ${key} ${_printData.measurement[key].length.toFixed(2)} ${ _printData.measurement[key].unit }`, 20, 60 + index * 10 );

        startY = 60 + index * 10;
        switch (key) {
          case "Hips":
            HipsRidges += _printData.measurement["Hips"].length;
            break;
          case "Ridges":
            HipsRidges += _printData.measurement["Ridges"].length;
            break;
          case "Eaves":
            EavesRakes += _printData.measurement["Eaves"].length;
            break;
          case "Rakes":
            EavesRakes += _printData.measurement["Rakes"].length;
            break;
          default:
            break;
        }
        lengthUnit = _printData.measurement[key] && _printData.measurement[key].unit && _printData.measurement[key].unit;
      });

      doc.text(`Hips + Ridges ${HipsRidges.toFixed(2)} ${lengthUnit}`, 20, startY + 10 );
      doc.text(`Eaves + Rakes ${EavesRakes.toFixed(2)} ${lengthUnit}`, 20, startY + 20 );
      doc.save("map_report.pdf");
      // doc = new jsPDF();
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
