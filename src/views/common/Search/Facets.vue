<template>
  <div>
    <button
      @click="handlePdf"
      class="download-pdf-btn"
      :disabled="
        (polyData && polyData.length > 0) ||
        (finalObject && finalObject.shape && finalObject.shape.length > 0)
          ? false
          : true
      "
    >
      Download Pdf
    </button>
    <div id="myMap"></div>
    <canvas id="canvas" width="1500px" height="1400px"></canvas>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  drawShapefunction,
  initLat,
  initLng,
  initZoom,
  imageUrl,
} from "../../../shared/shared";

export default {
  name: "LeafletMap",
  data() {
    return {
      finalObject: null,
      selectedColor: null,
      map: null,
      lat: initLat,
      lng: initLng,
      zoom: initZoom,
      imgElement: null,
      polyData: [],
      totalArea: 0,
      area: 0,
      xyPoint: [],
      pdfShape: null,
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

      this.lat = (initLatLng && initLatLng.lat) || initLat;
      this.lng = (initLatLng && initLatLng.lng) || initLng;

      this.map = L.map("myMap", {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView([this.lat, this.lng], zoom ? zoom : initZoom);

      this.tileLayerData = L.tileLayer(process.env.VUE_APP_LEAFLET_MAP, {
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(this.map);

      let marker;
      marker = L.marker([this.lat, this.lng], {
        draggable: true,
      }).addTo(this.map);

      marker.on("dragend", function (e) {
        localStorage.setItem(
          "initLatLng",
          JSON.stringify(e.target.getLatLng())
        );
      });
      this.polyData = JSON.parse(localStorage.getItem("polygon")) || [];

      // ----- polygon draw ------

      this.polyData &&
        this.polyData.map((shape) => {
          if (
            shape[0][0] == shape[shape.length - 1][0] &&
            shape[0][1] == shape[shape.length - 1][1]
          ) {
            L.polygon([shape], {
              showMeasurements: true,
              color: "#1e0fff",
              dashArray: "5 5",
              lineCap: "round",
              weight: 0,
              opacity: 0,
              measurementOptions: { imperial: true },
            }).addTo(this.map);
          }
        });

      this.map.on("zoomend", function (e) {
        localStorage.setItem("zoom", e.target._zoom);
      });
      // setting out the area measurements
      this.map.eachLayer((layer) => {
        if (layer._latlngs) {
          _finalObject.shape &&
            _finalObject.shape.length > 0 &&
            _finalObject.shape.map((shapes, i) => {
              shapes.path.map((pathPoint) => {
                layer._latlngs &&
                  layer._latlngs[0].map((_latlng) => {
                    if (
                      pathPoint[0].lat == _latlng.lat &&
                      pathPoint[0].lng == _latlng.lng
                    ) {
                      _finalObject.shape[i].area = Math.round(
                        10.764 * L.GeometryUtil.geodesicArea(layer._latlngs[0])
                      );
                      _finalObject.shape[i].unit = "sqft";
                    }
                  });
              });
            });
        }
      });

      var totalArea = 0;
      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        _finalObject.shape.map((shapes) => {
          totalArea += shapes.area;
        });
        _finalObject.totalArea = parseFloat(Math.round(totalArea));
        _finalObject.unit = "sqft";
      }

      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        this.drawShape(this.map, _finalObject, vueInstance.selectedColor, this.polyData.length, false, true);
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
    numberWithCommas(number) {
      return number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    },
    squaresOfShingles(number) {
      return (Math.round((number / 100) * 100) / 100).toFixed(1);
    },
    async handlePdf() {
      //PDF data

      let canvasElement = document.getElementById("canvas");
      var context = canvasElement.getContext("2d");

      await this.createMapImage();
      const doc = new jsPDF();
      doc.setFont("times");
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
        doc.text(doc.internal.pageSize.getWidth() - 40, 285, "page " + doc.page);
        doc.page++;
      }
      function header() {
        //Header
        doc.setDrawColor(0, 0, 0);
        doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10, "S");
        doc.setFontSize(10);
        doc.setTextColor("gray");
        doc.text(150, 10, "Powered By Roof Measurement"); //print number bottom right
      }

      // Table data start to manage the polyline measurment with colors
      var edgesTable = [];
      var areaTable = [];

      var edgesCol = ["Sr. No.", "Edges", "Color", "Measurement", "Unit"];
      var areaCol = ["Sr. No.", "Area", "Total area"];
      var edgesRows = [];
      var areaRows = [];
      let _printData = JSON.parse(JSON.stringify(this.finalObject));

      _printData.shape.length > 0 &&
        _printData.shape.map((latlng, i) => {
          if (latlng.area != 0) {
            areaTable.push({
              index: `Shape - ${i}`,
              area: this.numberWithCommas(latlng.area) + " " + latlng.unit,
              totalArea:
                this.numberWithCommas(this.finalObject.totalArea) +
                " " +
                this.finalObject.unit,
            });
          }
        });

      _printData.measurement &&
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
      doc.setFontSize(30);
      doc.setTextColor("#259ad7");
      doc.setFont("times", "bold");
      doc.text(doc.internal.pageSize.width / 2, 40, "Roof Measurement", {
        align: "center",
      });
      doc.setFontSize(25);
      doc.setTextColor("#259ad7");
      doc.setFont("times", "normal");
      doc.text(15, 55, "Roof Report");
      doc.setFontSize(14);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 15, 65);
      doc.text(`${_printData.totalFacets} facets`, 188, 70, { maxWidth: 50, align: "right", });
      doc.text( `${this.numberWithCommas(_printData.totalArea)} ${_printData.unit}`, 188, 78, { maxWidth: 50, align: "right" } );
      //Place image
      doc.addImage( await imageUrl(this.lat, this.lng, false), "PNG", 20, 84, 170, 150 );
      // ------------- Building Location place image -----------
      doc.addPage();
      header();
      footer();

      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(10, 20, "Building Location");
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 28);
      doc.addImage( await imageUrl(this.lat, this.lng, true), "PNG", 20, 40, 170, 150 );

      // --------------- Length Measurement Report--------------------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`Length Measurement Report`, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.text(_printData && _printData.address, 10, 28);
      doc.autoTable(edgesCol, edgesRows, { startY: 40 });

      // -------------Area Measurement Report---------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`Area Measurement Report`, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.text(_printData && _printData.address, 10, 28);
      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.autoTable(areaCol, areaRows, { startY: 40 });
      // -------------Area Measurement Report End---------

      _printData.shape.map((shp, i) => {
        if (shp.area != 0) {
          // ------------- Structure Summary for particular Shape -----------------
          doc.addPage();
          header();
          footer();

          doc.setFontSize(16);
          doc.setTextColor("#259ad7");
          doc.text(`Structure #${i} Summary`, 15, 20);
          doc.setFontSize(11);
          doc.setTextColor("Gray");
          doc.text(_printData && _printData.address, 20, 28);
          doc.setFontSize(14);
          doc.setTextColor("#259ad7");
          doc.setFillColor("#DCDCDC");
          doc.rect(138, 34, 55, 9, "F");
          doc.text(`Measurement`, 140, 40);
          doc.setFontSize(13);
          doc.setTextColor("Gray");
          doc.text( `Total Roof Facets ${ _printData.totalFacets / _printData.totalFacets } facets`, 140, 52 );
          // shape add start

          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const widthRatio = pageWidth / context.canvas.width;
          const heightRatio = pageHeight / context.canvas.height;
          const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;
          const canvasWidth = context.canvas.width * ratio;
          const canvasHeight = context.canvas.height * ratio;

          // shape add start
          this.drawShapeInPdf(context, canvasElement, doc, 20, 40, canvasWidth / 2, canvasHeight / 2, i);

          let _EavesRakes = 0, _HipsRidges = 0, _lengthUnit, stayY;

          if (shp.type) {
            Object.keys(shp.type).map((key, index) => {
              doc.text(`Total ${shp.type[key].label}  ${shp.type[key].length.toFixed( 2 )} ${shp.type[key].unit}`, 140, 62 + index * 10);
              stayY = 62 + index * 10;
              switch (key) {
                case "Hips": _HipsRidges += shp.type["Hips"].length;
                  break;
                case "Ridges": _HipsRidges += shp.type["Ridges"].length;
                  break;
                case "Eaves": _EavesRakes += shp.type["Eaves"].length; break;
                case "Rakes": _EavesRakes += shp.type["Rakes"].length; break;
                default: break;
              }
              _lengthUnit = shp.type[key] && shp.type[key].unit && shp.type[key].unit;
            });
            doc.text(`Hips + Ridges  ${_HipsRidges.toFixed(2)} ${_lengthUnit}`, 140, stayY + 10);
            doc.text(`Eaves + Rakes  ${_EavesRakes.toFixed(2)} ${_lengthUnit}`, 140, stayY + 20);
            doc.text(`Total Roof Area ${ this.numberWithCommas(shp.area) + " " + shp.unit }`, 140, stayY + 30);
          }
        }
      });

      // --------- All Shape Structures Summary -------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Shape Structures Summary`, 15, 20);
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 28);
      this.drawShapeInPdf(context, canvasElement, doc, 50, 50, 120, 150);

      // ----------- All Structures Summary ----------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Structures Summary`, 15, 20);
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 28);
      doc.setFillColor("#DCDCDC");
      doc.rect(138, 34, 55, 9, "F");
      doc.setFontSize(14);
      doc.setTextColor("#259ad7");
      doc.text(`Measurement`, 140, 40);
      doc.setFontSize(13);
      doc.setTextColor("Gray");
      doc.text(`Total Roof Area ${this.numberWithCommas(_printData.totalArea)} ${ _printData.unit }`, 140, 52);
      doc.text(`Total Roof Facets ${_printData.totalFacets} facets`, 140, 62);
      let EavesRakes = 0, HipsRidges = 0, startY = 0, lengthUnit;
      if (_printData.measurement) {
        Object.keys(_printData.measurement).map((key, index) => {
          doc.text(`Total ${key}  ${_printData.measurement[key].length.toFixed(2)} ${ _printData.measurement[key].unit }`, 140, 72 + index * 10);

          startY = 72 + index * 10;
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
          lengthUnit =
            _printData.measurement[key] &&
            _printData.measurement[key].unit &&
            _printData.measurement[key].unit;
        });
        doc.text(
          `Hips + Ridgest  ${HipsRidges.toFixed(2)} ${lengthUnit}`,
          140,
          startY + 10
        );
        doc.text(
          `Eaves + Rakes  ${EavesRakes.toFixed(2)} ${lengthUnit}`,
          140,
          startY + 20
        );
      }
      // Add all shape
      this.drawShapeInPdf(context, canvasElement, doc, 30, 50, 70, 80);

      doc.setFontSize(14);
      doc.setTextColor("#259ad7");
      doc.setFillColor("#DCDCDC");
      doc.rect(18, startY + 74, doc.internal.pageSize.width - 38, 9, "F");
      doc.text(`Pitch`, 20, startY + 80);
      doc.text(`0/12`, 60, startY + 80);
      doc.setTextColor("Gray");
      doc.text(`Area (${_printData.unit})`, 20, startY + 90);
      doc.text(this.numberWithCommas(_printData.totalArea), 60, startY + 90);
      doc.text(`Squares`, 20, startY + 100);
      doc.text(this.squaresOfShingles(_printData.totalArea), 60, startY + 100);
      doc.save("map_report.pdf");
    },
    drawShape(
      map,
      _finalObject,
      selectedColor,
      totalFacets,
      isEdges,
      isFacets
    ) {
      drawShapefunction(
        map,
        _finalObject,
        selectedColor,
        totalFacets,
        isEdges,
        isFacets
      );
    },
    getBoundingRect() {
      let left = Infinity,
        right = -Infinity;
      let top = Infinity,
        bottom = -Infinity;

      for (var i = 0; i < this.polyData.length; i++) {
        for (var j = 0; j < this.polyData[i].length; j++) {
          if (left > this.polyData[i][j][0]) left = this.polyData[i][j][0];
          if (top > this.polyData[i][j][1]) top = this.polyData[i][j][1];
          if (right < this.polyData[i][j][0]) right = this.polyData[i][j][0];
          if (bottom < this.polyData[i][j][1]) bottom = this.polyData[i][j][1];
        }
      }
      return { x: left, y: top, width: right - left, height: bottom - top };
    },
    drawShapeInPdf(ctx, canvasElement, doc, xPoint, yPoint, width, height, i) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      let boundingRect = this.getBoundingRect();
      let scale = Math.min(ctx.canvas.width, ctx.canvas.height);
      for (var index = 0; index < this.polyData.length; index++) {
        if (i !== undefined) {
          if (index === i) {
            ctx.beginPath();
            for (var j = 0; j < this.polyData[index].length; j++) {
              let x =
                ((this.polyData[index][j][0] - boundingRect.x) /
                  boundingRect.width) *
                scale;
              let y =
                ((this.polyData[index][j][1] - boundingRect.y) /
                  boundingRect.height) *
                scale;
              ctx.strokeStyle = "#259ad7";
              ctx.lineWidth = 1.5;
              ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.rotate(0.5);
            ctx.fillStyle = "#DCDCDC";
            ctx.fill();
            ctx.stroke();
            var imgData = canvasElement.toDataURL("image/png");
            doc.addImage(imgData, "PNG", xPoint, yPoint, width, height);
          }
        } else {
          ctx.beginPath();
          for (var j = 0; j < this.polyData[index].length; j++) {
            let x =
              ((this.polyData[index][j][0] - boundingRect.x) /
                boundingRect.width) *
              scale;
            let y =
              ((this.polyData[index][j][1] - boundingRect.y) /
                boundingRect.height) *
              scale;
            ctx.strokeStyle = "#259ad7";
            ctx.lineWidth = 1.5;
            ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.rotate(0.5);
          ctx.fillStyle = "#DCDCDC";
          ctx.fill();
          ctx.stroke();
          var imgData = canvasElement.toDataURL("image/png");
          doc.addImage(imgData, "PNG", xPoint, yPoint, width, height);
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
