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
    <canvas id="canvas" width="1600px" height="1500px"></canvas>

    <div id="colorSelection" class="facets-section">
      <p>Facets Tools</p>

      <div v-for="(display, idx) in pitches" :key="idx">
        <div class="name">
          <div class="text-right">
            {{ display.pitch }}
            <img
              :src="fullScreen"
              @click="clickIn && handlePitch(display.pitch, display.multiplier)"
            />
          </div>
        </div>
      </div>
    </div>
    <table id="edges-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Color</th>
          <th>Measurment</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(edge, idx) in edgesTable" :key="idx">
          <td>{{ edge.label }}</td>
          <td>
            <span :name="edge.color"></span>
          </td>
          <td>{{ edge.length }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import fullScreen from "../../../../public/images/full-screen.svg";
import {
  drawShapefunction,
  initLat,
  initLng,
  initZoom,
  imageUrl,
  setAddress,
} from "../../../shared/shared";

export default {
  name: "LeafletMap",
  data() {
    return {
      fullScreen: fullScreen,
      pitches: [
        { pitch: "0/12", multiplier: 1 },
        { pitch: "1/12", multiplier: 1.003 },
        { pitch: "2/12", multiplier: 1.014 },
        { pitch: "3/12", multiplier: 1.031 },
        { pitch: "4/12", multiplier: 1.054 },
        { pitch: "5/12", multiplier: 1.083 },
        { pitch: "6/12", multiplier: 1.118 },
        { pitch: "7/12", multiplier: 1.158 },
        { pitch: "8/12", multiplier: 1.202 },
        { pitch: "8/12", multiplier: 1.25 },
        { pitch: "10/12", multiplier: 1.302 },
        { pitch: "11/12", multiplier: 1.357 },
        { pitch: "12/12", multiplier: 1.414 },
        { pitch: "13/12", multiplier: 1.474 },
        { pitch: "14/12", multiplier: 1.537 },
        { pitch: "15/12", multiplier: 1.601 },
        { pitch: "16/12", multiplier: 1.667 },
        { pitch: "17/12", multiplier: 1.734 },
        { pitch: "18/12", multiplier: 1.803 },
        { pitch: "19/12", multiplier: 1.873 },
        { pitch: "20/12", multiplier: 1.944 },
      ],
      selectedPitch: { pitch: "0/12", multiplier: 1 },
      finalObject: null,
      selectedColor: null,
      map: null,
      lat: initLat,
      lng: initLng,
      zoom: initZoom,
      imgElement: null,
      polyData: [],
      clickIn: true,
      edgesTable: [],
    };
  },
  mounted() {
    this.initMap();
  },

  methods: {
    totalAreaCalculation() {
      var totalArea = 0;
      if (
        this.finalObject &&
        this.finalObject.shape &&
        this.finalObject.shape.length > 0
      ) {
        this.finalObject.shape.map((shapes) => {
          totalArea += shapes.areaWithPitch;
        });
        this.finalObject.totalArea = parseFloat(Math.round(totalArea));
        this.finalObject.unit = "sqft";

        this.finalObject.pitch =
          this.selectedPitch.pitch !== "0/12"
            ? this.selectedPitch.pitch
            : this.finalObject.pitch;
        this.finalObject.totalSquare = this.squaresOfShingles(
          this.finalObject.totalArea
        );

        this.finalObject.wasteDetail.map((wstDetail) => {
          wstDetail.area = this.areaWithWaste(
            this.finalObject.totalArea,
            wstDetail.per
          );

          wstDetail.square = this.squaresOfShinglesWithWaste(wstDetail.area);
        });
      }
      return this.finalObject;
    },
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
        setAddress(e.target.getLatLng().lat, e.target.getLatLng().lng);
      });
      this.polyData = JSON.parse(localStorage.getItem("polygon")) || [];

      // ----- polygon draw ------
      let polygon;
      this.polyData &&
        this.polyData.map((shape) => {
          if (
            shape[0][0] == shape[shape.length - 1][0] &&
            shape[0][1] == shape[shape.length - 1][1]
          ) {
            polygon = L.polygon([shape], {
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
                      _finalObject.shape[i].pitch =
                        _finalObject.shape[i].pitch !== "0/12"
                          ? _finalObject.pitch
                          : this.selectedPitch.pitch;

                      let shapeArea = _finalObject.shape[i].area;
                      _finalObject.shape[
                        i
                      ].areaWithPitch = this.handleAreaWithPitch(
                        shapeArea,
                        _finalObject.shape[i].pitch
                      );
                      _finalObject.shape[i].squares = this.squaresOfShingles(
                        _finalObject.shape[i].areaWithPitch
                      );
                    }
                  });
              });

              _finalObject.shape[i].waste.map((wst) => {
                wst.area = this.areaWithWaste(
                  _finalObject.shape[i].areaWithPitch,
                  wst.per
                );
                wst.square = this.squaresOfShinglesWithWaste(wst.area);
              });
            });
        }
      });
      this.finalObject = _finalObject;
      this.totalAreaCalculation();

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
      // ------------- Polyline end -------------
    },
    handlePitch(pitch, multiplier) {
      this.$toasted.show(`Selected pitch is ${pitch} !`, {
        action: [
          {
            text: "Done",
            onClick: (e, toast) => {
              toast.goAway(0);
              this.clickIn = true;
              this.selectedPitch = { pitch: pitch, multiplier: multiplier };
              this.finalObject.shape &&
                this.finalObject.shape.length > 0 &&
                this.finalObject.shape.map((shapes, i) => {
                  let shapeArea = this.finalObject.shape[i].area;
                  this.finalObject.shape[i].pitch = this.selectedPitch.pitch;
                  this.finalObject.shape[
                    i
                  ].areaWithPitch = this.handleAreaWithPitch(
                    shapeArea,
                    this.finalObject.shape[i].pitch
                  );
                  this.finalObject.shape[i].squares = this.squaresOfShingles(
                    this.finalObject.shape[i].areaWithPitch
                  );
                  this.finalObject.shape[i].waste.map((wst) => {
                    wst.area = this.areaWithWaste(
                      this.finalObject.shape[i].areaWithPitch,
                      wst.per
                    );
                    wst.square = this.squaresOfShinglesWithWaste(wst.area);
                  });
                });

              this.totalAreaCalculation();
              localStorage.setItem(
                "finalObject",
                JSON.stringify(this.finalObject)
              );
            },
          },
          {
            text: "Cancel",
            onClick: (e, toastObject) => {
              toastObject.goAway(0);
              this.clickIn = true;
              this.selectedPitch = { pitch: "0/12", multiplier: 1 };
            },
          },
        ],
      });
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
    handleAreaWithPitch(number, pitch) {
      this.pitches.map((ptch) => {
        if (ptch.pitch === pitch) {
          this.selectedPitch.multiplier = ptch.multiplier;
        }
      });
      let area = Math.round(number * this.selectedPitch.multiplier);
      return area;
    },
    numberWithCommas(number) {
      return number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    },
    squaresOfShingles(number) {
      return (Math.round((number / 100) * 100) / 100).toFixed(1);
    },
    areaWithWaste(number, per) {
      let area = Math.round((per / 100 + 1) * number);
      return area;
    },
    squaresOfShinglesWithWaste(number) {
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
        doc.text(
          doc.internal.pageSize.getWidth() - 40,
          285,
          "page " + doc.page
        );
        doc.page++;
      }
      function header() {
        //Header
        doc.setDrawColor(0, 0, 0);
        doc.rect(
          5,
          5,
          doc.internal.pageSize.width - 10,
          doc.internal.pageSize.height - 10,
          "S"
        );
        doc.setFontSize(10);
        doc.setTextColor("gray");
        doc.text(150, 10, "Powered By Roof Measurement"); //print number bottom right
      }

      // Table data start to manage the polyline measurment with colors
      var areaTable = [];

      var areaCol = ["Shapes", "Area", "Total area"];
      var areaRows = [];
      let _printData = JSON.parse(JSON.stringify(this.finalObject));
      let shapeCount = 0;
      _printData.shape.length > 0 &&
        _printData.shape.map((latlng) => {
          if (latlng.areaWithPitch != 0) {
            shapeCount++;
            areaTable.push({
              index: `Shape - ${shapeCount}`,
              area:
                this.numberWithCommas(latlng.areaWithPitch) + " " + latlng.unit,
              totalArea:
                this.numberWithCommas(this.finalObject.totalArea) +
                " " +
                this.finalObject.unit,
            });
          }
        });

      _printData.measurement &&
        Object.keys(_printData.measurement).map((key) => {
          this.edgesTable.push({
            label: key,
            color: _printData.measurement[key].color,
            length: `${
              _printData.measurement[key].length.toFixed(2) +
              " " +
              _printData.measurement[key].unit
            }`,
          });
        });

      areaTable.forEach((element) => {
        var temp1 = [element.index, element.area, element.totalArea];
        areaRows.push(temp1);
      });

      // -------table data end -------------

      var pageWidth = doc.internal.pageSize.getWidth();
      var pageHeight = doc.internal.pageSize.getHeight();
      var widthRatio = pageWidth / context.canvas.width;
      var heightRatio = pageHeight / context.canvas.height;
      var ratio = widthRatio > heightRatio ? heightRatio : widthRatio;
      var canvasWidth = context.canvas.width * ratio;
      var canvasHeight = context.canvas.height * ratio;
      // const marginX = (pageWidth - canvasWidth) / 2;
      // const marginY = (pageHeight - canvasHeight) / 2;
      // -------------
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
      doc.text(`${_printData.totalFacets} facets`, 188, 73, {
        maxWidth: 50,
        align: "right",
      });
      doc.text(
        `${this.numberWithCommas(_printData.totalArea)} ${_printData.unit}`,
        188,
        80,
        { maxWidth: 50, align: "right" }
      );

      doc.text(`Predominant Pitch ${_printData.pitch}`, 188, 87, {
        maxWidth: 50,
        align: "right",
      });
      //Place image
      doc.addImage(
        await imageUrl(this.lat, this.lng, false),
        "PNG",
        20,
        97,
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
      doc.setFontSize(11);
      doc.setTextColor("Gray");
      doc.text(_printData && _printData.address, 20, 28);
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
      doc.text(_printData && _printData.address, 10, 28);

      doc.autoTable({
        html: "#edges-table",
        startY: 40,
        bodyStyles: { minCellHeight: 10 },
        didDrawCell: function (data) {
          if (data.column.index === 1 && data.cell.section === "body") {
            var td = data.cell.raw;
            var span = td.getElementsByTagName("span")[0];
            var textPos = data.cell;
            doc.setLineWidth(2);
            doc.setDrawColor(span.getAttribute("name"));
            doc.line(
              textPos.x + 2,
              textPos.y + 5,
              textPos.x + 11,
              textPos.y + 5
            );
          }
        },
      });

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
      // ------------- Area Measurement Report End ---------
      let boundingRect = this.getBoundingRect();
      let scale = Math.min(context.canvas.width, context.canvas.height);
      let gmapPolygons = this.polyData.map((polyData) => {
        const polyCord = polyData.map((plData) => {
          return { lat: plData[0], lng: plData[1] };
        });
        return new window.google.maps.Polygon({ paths: polyCord });
      });
      let lineStart, lineEnd;
      let count = 0;
      _printData.shape.length > 1 &&
        _printData.shape.map((shp, i) => {
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          context.save();

          context.translate(80, 95 * 15.8);
          context.rotate((Math.PI / 180) * -89);
          for (var index = 0; index < this.polyData.length; index++) {
            if (index === i) {
              count++;
              // ------------- Structure Summary for particular Shape -----------------
              doc.addPage();
              header();
              footer();
              doc.setFontSize(16);
              doc.setTextColor("#259ad7");
              doc.text(`Structure #${count} Summary`, 15, 20);
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
              doc.text(
                `Total Roof Facets ${
                  _printData.totalFacets / _printData.totalFacets
                } facets`,
                140,
                52
              );
              // shape add start

              // shape add start

              // this.drawShapeInPdf(
              //   context,
              //   canvasElement,
              //   doc,
              //   20,
              //   30,
              //   80,
              //   95,
              //   true,
              //   i
              // );

              shp.path.forEach((line) => {
                lineStart = new window.google.maps.LatLng(
                  line[0].lat,
                  line[0].lng
                );
                lineEnd = new window.google.maps.LatLng(
                  line[1].lat,
                  line[1].lng
                );

                for (
                  let polygonI = 0;
                  polygonI < gmapPolygons.length;
                  polygonI++
                ) {
                  if (
                    setTimeout(function () {
                      window.google.maps.geometry.poly.containsLocation(
                        lineStart,
                        gmapPolygons[polygonI]
                      ) ||
                        window.google.maps.geometry.poly.containsLocation(
                          lineEnd,
                          gmapPolygons[polygonI]
                        );
                    }, 1000)
                  ) {
                    let a1 =
                      ((line[0].lat - boundingRect.x) / boundingRect.width) *
                      scale;
                    let b1 =
                      ((line[0].lng - boundingRect.y) / boundingRect.height) *
                      scale;
                    let a2 =
                      ((line[1].lat - boundingRect.x) / boundingRect.width) *
                      scale;
                    let b2 =
                      ((line[1].lng - boundingRect.y) / boundingRect.height) *
                      scale;
                    context.beginPath();
                    context.strokeStyle = line[0].color;
                    context.lineWidth = 2;
                    context.moveTo(a1, b1);
                    context.lineTo(a2, b2);
                    context.closePath();
                    context.stroke();
                    break;
                  }
                }
              });

              let _EavesRakes = 0,
                _HipsRidges = 0,
                _lengthUnit,
                stayY;

              if (shp.type) {
                Object.keys(shp.type).map((key, index) => {
                  doc.text(
                    `Total ${shp.type[key].label}  ${shp.type[
                      key
                    ].length.toFixed(2)} ${shp.type[key].unit}`,
                    140,
                    62 + index * 10
                  );
                  stayY = 62 + index * 10;
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
                  `Hips + Ridges  ${_HipsRidges.toFixed(2)} ${_lengthUnit}`,
                  140,
                  stayY + 10
                );
                doc.text(
                  `Eaves + Rakes  ${_EavesRakes.toFixed(2)} ${_lengthUnit}`,
                  140,
                  stayY + 20
                );
                doc.text(
                  `Total Roof Area ${
                    this.numberWithCommas(shp.areaWithPitch) + " " + shp.unit
                  }`,
                  140,
                  stayY + 30
                );
              }

              doc.setFontSize(14);
              doc.setTextColor("#259ad7");
              doc.setFillColor("#DCDCDC");
              // Pitch detail
              doc.rect(18, 166, doc.internal.pageSize.width - 38, 9, "F");
              doc.text(`Pitch`, 20, 172);
              doc.text(`${_printData.pitch}`, 60, 172);
              doc.setTextColor("Gray");
              doc.text(`Area ${shp.unit}`, 20, 182);
              doc.text(this.numberWithCommas(shp.areaWithPitch), 60, 182);
              doc.text(`Squares`, 20, 192);
              doc.text(`${shp.squares}`, 60, 192);
              // Waste data
              doc.setTextColor("#259ad7");
              doc.setFillColor("#DCDCDC");
              doc.rect(18, 212, doc.internal.pageSize.width - 38, 9, "F");
              doc.text(`Waste`, 20, 218);
              let y = 50;
              shp.waste.map((wst) => {
                doc.setTextColor("#259ad7");
                doc.setFillColor("#DCDCDC");
                doc.text(`${wst.per}%`, y, 218);
                doc.setTextColor("Gray");
                doc.text(this.numberWithCommas(wst.area), y, 228);
                doc.text(wst.square, y, 238);
                y = y + 20;
              });
              doc.text(`Area (${_printData.unit})`, 20, 228);
              doc.text(`Squares`, 20, 238);
            }
          }

          var trimmedCanvas = this.trimCanvas(canvasElement);
          var imgData = trimmedCanvas.toDataURL();
          doc.addImage(imgData, "PNG", 20, 30, 80, 95);
          context.restore();
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
      this.drawShapeInPdf(context, canvasElement, doc, 30, 40, 85, 95.2);

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
      doc.text(
        `Total Roof Area ${this.numberWithCommas(_printData.totalArea)} ${
          _printData.unit
        }`,
        140,
        52
      );
      doc.text(`Total Roof Facets ${_printData.totalFacets} facets`, 140, 62);
      let EavesRakes = 0,
        HipsRidges = 0,
        startY = 0,
        lengthUnit;
      if (_printData.measurement) {
        Object.keys(_printData.measurement).map((key, index) => {
          doc.text(
            `Total ${key}  ${_printData.measurement[key].length.toFixed(2)} ${
              _printData.measurement[key].unit
            }`,
            140,
            72 + index * 10
          );

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
          `Hips + Ridges  ${HipsRidges.toFixed(2)} ${lengthUnit}`,
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
      this.drawShapeInPdf(context, canvasElement, doc, 30, 40, 85, 95.2);
      doc.setFontSize(14);
      doc.setTextColor("#259ad7");
      doc.setFillColor("#DCDCDC");
      // Pitch detail
      doc.rect(18, 166, doc.internal.pageSize.width - 38, 9, "F");
      doc.text(`Pitch`, 20, 172);
      doc.text(`${_printData.pitch}`, 60, 172);
      doc.setTextColor("Gray");
      doc.text(`Area ${_printData.unit}`, 20, 182);
      doc.text(this.numberWithCommas(_printData.totalArea), 60, 182);
      doc.text(`Squares`, 20, 192);
      doc.text(this.squaresOfShingles(_printData.totalArea), 60, 192);
      // Waste data
      doc.setTextColor("#259ad7");
      doc.setFillColor("#DCDCDC");
      doc.rect(18, 212, doc.internal.pageSize.width - 38, 9, "F");
      doc.text(`Waste`, 20, 218);

      let y = 50;
      _printData.wasteDetail.map((wstDetail) => {
        doc.setTextColor("#259ad7");
        doc.setFillColor("#DCDCDC");
        doc.text(`${wstDetail.per}%`, y, 218);
        doc.setTextColor("Gray");
        doc.text(this.numberWithCommas(wstDetail.area), y, 228);
        doc.text(wstDetail.square, y, 238);
        y = y + 20;
      });
      doc.text(`Area (${_printData.unit})`, 20, 228);
      doc.text(`Squares`, 20, 238);
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
    drawShapeInPdf(
      ctx,
      canvasElement,
      doc,
      xPoint,
      yPoint,
      width,
      height,
      isSingleShape = false,
      finalPolygonIndex
    ) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (
        var polygonIndex = 0;
        polygonIndex < this.polyData.length;
        polygonIndex++
      ) {
        if (isSingleShape) {
          if (polygonIndex === finalPolygonIndex) {
            // this.contextDraw(
            //   polygonIndex,
            //   ctx,
            //   width,
            //   height,
            //   canvasElement,
            //   doc,
            //   20,
            //   40,
            //   isSingleShape
            // );
          }
        } else {
          this.contextDraw(
            polygonIndex,
            ctx,
            width,
            height,
            canvasElement,
            doc,
            xPoint,
            yPoint
          );
        }
      }
    },

    contextDraw(
      polygonIndex,
      ctx,
      width,
      height,
      canvasElement,
      doc,
      xPoint,
      yPoint,
      isSingleShape = false
    ) {
      let boundingRect = this.getBoundingRect();
      let scale = Math.min(ctx.canvas.width, ctx.canvas.height);

      // ctx.beginPath();
      // ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      // ctx.save();

      // ctx.translate(width, height * 15.8);
      // ctx.rotate((Math.PI / 180) * -89);

      // for (var j = 0; j < this.polyData[polygonIndex].length; j++) {
      //   let x =
      //     ((this.polyData[polygonIndex][j][0] - boundingRect.x) / boundingRect.width) *
      //     scale;
      //   let y =
      //     ((this.polyData[polygonIndex][j][1] - boundingRect.y) /
      //       boundingRect.height) *
      //     scale;
      //   ctx.strokeStyle = "#259ad7";
      //   ctx.lineWidth = 2;
      //   ctx.lineTo(x, y);
      // }
      // ctx.closePath();
      // ctx.fillStyle = "#DCDCDC";
      // ctx.fill();
      // ctx.stroke();
      // var trimmedCanvas = this.trimCanvas(canvasElement);
      // var imgData = trimmedCanvas.toDataURL();

      // var imgDataAll = canvasElement.toDataURL("image/png");
      // doc.addImage(
      //   i !== undefined ? imgData : imgDataAll,
      //   "PNG",
      //   xPoint,
      //   yPoint,
      //   width,
      //   height
      // );
      // ctx.restore();

      let gmapPolygons = this.polyData.map((polyData) => {
        const polyCord = polyData.map((plData) => {
          return { lat: plData[0], lng: plData[1] };
        });
        return new window.google.maps.Polygon({ paths: polyCord });
      });

      this.finalObject.shape.map((shp) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        ctx.translate(width, height * 15.8);
        ctx.rotate((Math.PI / 180) * -89);

        shp.path.forEach((line) => {
          let lineStart = new window.google.maps.LatLng(
            line[0].lat,
            line[0].lng
          );
          let lineEnd = new window.google.maps.LatLng(line[1].lat, line[1].lng);

          for (let polygonI = 0; polygonI < gmapPolygons.length; polygonI++) {
            if (
              setTimeout(function () {
                window.google.maps.geometry.poly.containsLocation(
                  lineStart,
                  gmapPolygons[polygonI]
                ) ||
                  window.google.maps.geometry.poly.containsLocation(
                    lineEnd,
                    gmapPolygons[polygonI]
                  );
              }, 1000)
            ) {
              let a1 =
                ((line[0].lat - boundingRect.x) / boundingRect.width) * scale;
              let b1 =
                ((line[0].lng - boundingRect.y) / boundingRect.height) * scale;
              let a2 =
                ((line[1].lat - boundingRect.x) / boundingRect.width) * scale;
              let b2 =
                ((line[1].lng - boundingRect.y) / boundingRect.height) * scale;

              ctx.beginPath();
              ctx.strokeStyle = "#259ad7";
              ctx.lineWidth = 2;
              ctx.moveTo(a1, b1);
              ctx.lineTo(a2, b2);
              ctx.fillStyle = "#DCDCDC";
              ctx.fill();
              ctx.stroke();
              break;
            }
          }
        });

        var imgDataAll = canvasElement.toDataURL("image/png");

        doc.addImage(imgDataAll, "PNG", xPoint, yPoint, width, height);
        ctx.restore();
      });
    },
    trimCanvas(c) {
      var ctx = c.getContext("2d"),
        copy = document.createElement("canvas").getContext("2d"),
        pixels = ctx.getImageData(0, 0, c.width, c.height),
        l = pixels.data.length,
        i,
        bound = {
          top: null,
          left: null,
          right: null,
          bottom: null,
        },
        x,
        y;

      // Iterate over every pixel to find the highest
      // and where it ends on every axis ()
      for (i = 0; i < l; i += 4) {
        if (pixels.data[i + 3] !== 0) {
          x = (i / 4) % c.width;
          y = ~~(i / 4 / c.width);

          if (bound.top === null) {
            bound.top = y;
          }

          if (bound.left === null) {
            bound.left = x;
          } else if (x < bound.left) {
            bound.left = x;
          }

          if (bound.right === null) {
            bound.right = x;
          } else if (bound.right < x) {
            bound.right = x;
          }

          if (bound.bottom === null) {
            bound.bottom = y;
          } else if (bound.bottom < y) {
            bound.bottom = y;
          }
        }
      }

      // Calculate the height and width of the content
      var trimHeight = bound.bottom - bound.top + 20,
        trimWidth = bound.right - bound.left + 20,
        trimmed = ctx.getImageData(
          bound.left,
          bound.top,
          trimWidth,
          trimHeight
        );

      copy.canvas.width = trimWidth;
      copy.canvas.height = trimHeight;
      copy.putImageData(trimmed, 0, 0);

      // Return trimmed canvas
      return copy.canvas;
    },
  },
};
</script>
<style lang="scss" scoped>
@import "../../../style/search/edges.scss";
</style>
