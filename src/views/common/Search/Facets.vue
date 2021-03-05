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
    <canvas id="canvas" width="1500" height="1300"></canvas>
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
      this.zoom = JSON.parse(localStorage.getItem("zoom")) || initZoom;
      var initLatLng = JSON.parse(localStorage.getItem("initLatLng"));

      this.lat = (initLatLng && initLatLng.lat) || initLat;
      this.lng = (initLatLng && initLatLng.lng) || initLng;

      this.map = L.map("myMap", {
        attributionControl: false,
        zoomControl: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView([this.lat, this.lng], this.zoom);
      // this.map.doubleClickZoom.disable();
      // this.map.scrollWheelZoom.disable();
      this.tileLayerData = L.tileLayer(process.env.VUE_APP_LEAFLET_MAP, {
        maxZoom: 20,
        maxNativeZoom: 19,
      }).addTo(this.map);

      L.marker([this.lat, this.lng]).addTo(this.map);

      this.polyData = JSON.parse(localStorage.getItem("polygon")) || [];

      // ----- polygon draw ------
      this.polyData &&
        this.polyData.map((shape) => {
          let pointArray = [];
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
            }).addTo(this.map);
          }

          //To keep shape in pdf handle xyPoint
          shape.map((pth) => {
            let xy = this.map.latLngToLayerPoint([pth[0], pth[1]]);
            pointArray.push(xy);
          });
          this.xyPoint.push(pointArray);
        });

      // setting out the area measurements
      this.map.eachLayer((layer) => {
        if (layer._latlngs) {
          _finalObject.shape &&
            _finalObject.shape.length > 0 &&
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
      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        _finalObject.shape.map((shapes) => {
          totalArea += shapes.area;
        });
        _finalObject.totalArea = parseFloat(Math.round(totalArea));
        _finalObject.unit = "m²";
      }

      if (_finalObject && _finalObject.shape && _finalObject.shape.length > 0) {
        this.drawShape(
          this.map,
          _finalObject,
          vueInstance.selectedColor,
          this.polyData.length,
          false,
          true
        );
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

      _printData.shape.length > 0 &&
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
      doc.setFontSize(20);
      doc.setTextColor("#259ad7");
      doc.text(10, 20, "Roof Report");
      doc.setFontSize(12);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 30);
      doc.text(`${_printData.totalFacets} Facets`, 20, 40);
      doc.text(
        `Total Facet Area : ${_printData.totalArea} ${_printData.unit}`,
        20,
        50
      );
      //place image
      doc.addImage(
        await imageUrl(this.lat, this.lng, false),
        "PNG",
        20,
        60,
        170,
        150
      );
      // ------------- Building Location place image -----------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(10, 20, "Building Location");
      doc.setFontSize(12);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 30);
      doc.addImage(
        await imageUrl(this.lat, this.lng, true),
        "PNG",
        20,
        40,
        170,
        150
      );

      // --------------- Length Measurement Report--------------------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`Length Measurement Report`, 10, 20);
      doc.setFontSize(12);
      doc.setTextColor("gray");
      doc.text(_printData && _printData.address, 10, 30);
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
      doc.text(_printData && _printData.address, 10, 30);
      doc.autoTable(areaCol, areaRows, { startY: 40 });
      // context.beginPath();
      console.log("ssi _printData => ", _printData);

      _printData.shape.map((shp, i) => {
        console.log("ssi shp =>", shp);
        if (shp.area != 0) {
          // ------------- Structure Summary for particular Shape -----------------
          doc.addPage();
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          header();
          footer();
          doc.setFontSize(16);
          doc.setTextColor("#259ad7");
          doc.text(`Structure #${i} Summary`, 15, 20);
          doc.setFontSize(12);
          doc.setTextColor("Gray");
          doc.text(_printData && _printData.address, 20, 30);
          doc.setFontSize(14);
          doc.setTextColor("Gray");
          doc.text(`Measurement`, 20, 40);
          doc.setFontSize(11);
          doc.setTextColor("Gray");
          doc.text(
            `Total Roof Facets ${
              _printData.totalFacets / _printData.totalFacets
            } facets`,
            20,
            50
          );
          // shape add start
          this.xyPoint.map((xyShape, xyIndex) => {
            if (xyIndex === i) {
              context.beginPath();
              xyShape.map((xyPoint) => {
                context.strokeStyle = "#259ad7";
                context.fillStyle = "#8ED6FF";
                context.fill();
                context.lineWidth = 1.5;
                context.lineTo(xyPoint.x, xyPoint.y);
              });
              context.closePath();
              context.stroke();
              let imgData = canvasElement.toDataURL("image/png");
              doc.addImage(imgData, "PNG", i * 10 + 20, i * 10 + 20, 200, 200);
            }
          });
          // shape add start

          let _EavesRakes = 0,
            _HipsRidges = 0,
            _lengthUnit,
            stayY;
          if (shp.type) {
            Object.keys(shp.type).map((key, index) => {
              doc.text(
                `Total ${shp.type[key].label} ${shp.type[key].length.toFixed(
                  2
                )} ${shp.type[key].unit}`,
                20,
                60 + index * 10
              );
              stayY = 60 + index * 10;
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
              _lengthUnit =
                shp.type[key] && shp.type[key].unit && shp.type[key].unit;
            });
            doc.text(
              `Hips + Ridges ${_HipsRidges.toFixed(2)} ${_lengthUnit}`,
              20,
              stayY + 10
            );
            doc.text(
              `Eaves + Rakes ${_EavesRakes.toFixed(2)} ${_lengthUnit}`,
              20,
              stayY + 20
            );
            doc.text(`Total Roof Area ${shp.area + shp.unit}`, 20, stayY + 30);
          }
        }
      });

      // --------- All Shape Structures Summary -------
      doc.addPage();
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Shape Structures Summary`, 15, 20);
      doc.setFontSize(12);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 30);
      for (var i = 0; i < this.polyData.length; i++) {
        this.xyPoint.map((xy) => {
          context.beginPath();
          for (var j = 0; j < this.polyData[i].length; j++) {
            xy.map((pt) => {
              context.strokeStyle = "#259ad7";
              context.fillStyle = "#DCDCDC";
              context.fill();
              context.lineWidth = 1.5;
              context.lineTo(pt.x, pt.y);
            });
          }
          context.closePath();
          context.stroke();
        });

        var imgData = canvasElement.toDataURL("image/png");
        this.pdfShape = imgData;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const widthRatio = pageWidth / context.canvas.width;
        const heightRatio = pageHeight / context.canvas.height;
        const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;
        const canvasWidth = context.canvas.width * ratio;
        const canvasHeight = context.canvas.height * ratio;

        const marginX = (pageWidth - canvasWidth) / 2;
        const marginY = (pageHeight - canvasHeight) / 2;
        //shape image
        doc.addImage(
          imgData,
          "PNG",
          marginX,
          marginY,
          canvasWidth * 2 - 80,
          canvasHeight * 2 - 80
        );
      }
      // ----------- All Structures Summary ----------
      doc.addPage();
      header();
      footer();
      doc.setFontSize(16);
      doc.setTextColor("#259ad7");
      doc.text(`All Structures Summary `, 15, 20);
      doc.setFontSize(12);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 30);
      doc.setFontSize(14);
      doc.setTextColor("Gray");
      doc.text(`Measurement`, 20, 40);
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text(
        `Total Roof Area ${_printData.totalArea} ${_printData.unit}`,
        20,
        50
      );
      doc.text(`Total Roof Facets ${_printData.totalFacets} facets`, 20, 60);
      let EavesRakes = 0,
        HipsRidges = 0,
        startY = 0,
        lengthUnit;
      if (_printData.measurement) {
        Object.keys(_printData.measurement).map((key, index) => {
          doc.text(
            `Total ${key} ${_printData.measurement[key].length.toFixed(2)} ${
              _printData.measurement[key].unit
            }`,
            20,
            70 + index * 10
          );
          startY = 70 + index * 10;
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
          `Hips + Ridges ${HipsRidges.toFixed(2)} ${lengthUnit}`,
          20,
          startY + 10
        );
        doc.text(
          `Eaves + Rakes ${EavesRakes.toFixed(2)} ${lengthUnit}`,
          20,
          startY + 20
        );
        // Add all shape start
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const widthRatio = pageWidth / context.canvas.width;
        const heightRatio = pageHeight / context.canvas.height;
        const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;
        const canvasWidth = context.canvas.width * ratio;
        const canvasHeight = context.canvas.height * ratio;

        const marginX = (pageWidth - canvasWidth) / 2;
        const marginY = (pageHeight - canvasHeight) / 2;

        doc.addImage(this.pdfShape, "PNG", 20, 20, 200, 200);
        // Add all shape start
      }
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
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
