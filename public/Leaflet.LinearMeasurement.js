
(function () {

  L.Control.LinearMeasurement = L.Control.extend({
    options: {
      position: 'topleft',
      unitSystem: 'imperial', // imperial | metric
      color: '#4D90FE',
      contrastingColor: '#fff',
      show_last_node: false,
      show_azimut: false
    },

    clickSpeed: 200,
    onAdd: function (map) {
      var container = L.DomUtil.create('div', 'leaflet-control leaflet-bar'),
        link = L.DomUtil.create('a', 'icon-ruler', container),
        map_container = map.getContainer(),
        me = this;

      link.href = '#';
      link.title = 'Toggle measurement tool';

      L.DomEvent.on(link, 'click', L.DomEvent.stop).on(link, 'click', function () {
        if (L.DomUtil.hasClass(link, 'icon-active')) {
          // me.resetRuler(!!me.mainLayer);
          // L.DomUtil.removeClass(link, 'icon-active');
          // L.DomUtil.removeClass(map_container, 'ruler-map');
        } else {
          me.initRuler();
          L.DomUtil.addClass(link, 'icon-active');
          L.DomUtil.addClass(map_container, 'ruler-map');
        }
      });
      function contrastingColor(color) {
        return (luma(color) >= 165) ? '000' : 'fff';
      }

      function luma(color) {
        var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
        return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
      }

      function hexToRGBArray(color) {
        if (color.length === 3)
          color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
        else if (color.length !== 6)
          throw ('Invalid hex color: ' + color);
        var rgb = [];
        for (var i = 0; i <= 2; i++)
          rgb[i] = parseInt(color.substr(i * 2, 2), 16);
        return rgb;
      }

      if (this.options.color && this.options.color.indexOf('#') === -1) {
        this.options.color = '#' + this.options.color;
      } else if (!this.options.color) {
        this.options.color = '#4D90FE';
      }

      var originalColor = this.options.color.replace('#', '');

      this.options.contrastingColor = '#' + contrastingColor(originalColor);

      return container;
    },

    onRemove: function (map) {
      this.resetRuler(!!this.mainLayer);
    },

    initRuler: function () {

      var me = this,
        map = this._map;

      this.mainLayer = L.featureGroup();
      this.mainLayer.addTo(this._map);

      map.touchZoom.disable();

      map.doubleClickZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();

      if (map.tap) {
        map.tap.disable();
      }

      this.dblClickEventFn = function (e) {
        L.DomEvent.stop(e);
      };
      me.tempPolygon = []

      this.clickEventFn = function (e) {
        var polygon = JSON.parse(localStorage.getItem("polygon")) || []

        // Added by ssi - start - issue - first time when click with dbl clcik then getting error of undefined

        if (this.poly && me.latlngsList.length === 0) {
          me.latlngsList.push(this.latlngs);
          me.allLatlng.push(this.latlngs);
          // me.allLatlng.push([e.latlng.lat, e.latlng.lng]);

          if (me.poly.getBounds().contains(e.latlng)) {
            // console.log('Hello ssi if click');
          } else {
            // console.log('Hello ssi Else click');
          }
        }

        me.tempPolygon.push([e.latlng.lat, e.latlng.lng])

        if (me.clickHandle) {
          clearTimeout(me.clickHandle);
          me.clickHandle = 0;

          if (me.options.show_last_node) {
            me.preClick(e);
            me.getMouseClickHandler(e);
          }

          me.getDblClickHandler(e);

        } else {
          if (me.tempPolygon.length > 0) {
            for (var i = 0; i < me.tempPolygon.length; i++) {
              if (me.tempPolygon.length - 1 !== i) {
                let everyPoint = L.latLng(me.tempPolygon[i])
                let current = L.latLng(e.latlng)
                var dist = parseInt(everyPoint.distanceTo(current).toFixed(0))


                if (dist <= 1) {
                  // Need to set frist and last point same before pushing the shape in polygon array
                  me.tempPolygon.pop()
                  me.tempPolygon.push(me.tempPolygon[i])

                  var start, end;
                  me.tempPolygon.map((poly, polyI) => {
                    if (me.tempPolygon[polyI][0] == me.tempPolygon[me.tempPolygon.length - 1][0]) {
                      if (polyI === me.tempPolygon.length - 1) {
                        end = polyI + 1
                      } else {
                        start = polyI
                      }
                    }
                  })

                  var filtered = me.tempPolygon.slice(start, end)

                  polygon.push(filtered);

                  // To get polygon with unique data
                  function Unique(array) {
                    var tmp = [];
                    var result = [];
                    if (array !== undefined /* any additional error checking */) {
                      for (var i = 0; i < array.length; i++) {
                        var val = array[i];
                        if (tmp[val] === undefined) {
                          tmp[val] = true;
                          result.push(val);
                        }
                      }
                    }
                    return result;
                  }
                  polygon = Unique(polygon);

                }
              }
            }

            // Polygon pushing the data after complting the shape so removing data if shape is complete with first and last data same
            // for (let index = 0; index < polygon.length; index++) {
            //   for (let j = 0; j < polygon[index].length; j++) {
            //     if (j !== 0 && polygon[index][0] === polygon[index][j]) {
            //       // polygon[index].splice(j + 1, 1)
            //     }
            //   }
            // }
            localStorage.setItem("polygon", JSON.stringify(polygon))
          }
          me.preClick(e);
          me.clickHandle = setTimeout(function () {
            me.getMouseClickHandler(e);
            // me.getDblClickHandler(e);
            me.clickHandle = 0;
          }, me.clickSpeed);
        }
      };

      this.moveEventFn = function (e) {
        if (!me.clickHandle) {
          me.getMouseMoveHandler(e);
        }
      };

      map.on('click', this.clickEventFn, this);
      map.on('mousemove', this.moveEventFn, this);

      this.resetRuler();
    },

    initLayer: function () {
      this.layer = L.featureGroup();
      this.layer.addTo(this.mainLayer);
      this.layer.on('selected', this.layerSelected);
      this.layer.on('click', this.clickEventFn, this);
    },

    resetRuler: function (resetLayer, allPoints = []) {

      var map = this._map;

      if (resetLayer) {
        map.off('click', this.clickEventFn, this);
        map.off('mousemove', this.moveEventFn, this);

        if (this.mainLayer) {
          this._map.removeLayer(this.mainLayer);
        }

        this.mainLayer = null;

        this._map.touchZoom.enable();
        this._map.boxZoom.enable();
        this._map.keyboard.enable();

        if (this._map.tap) {
          this._map.tap.enable();
        }
      }

      this.layer = null;
      this.prevLatlng = null;
      this.poly = null;
      this.multi = null;
      this.latlngs = null;
      this.latlngsList = [];
      this.sum = 0;
      this.distance = 0;
      this.separation = 1;
      this.last = 0;
      this.fixedLast = 0;
      this.totalIcon = null;
      this.total = null;
      this.lastCircle = null;
      this.tempPolygon = []
      this.allLatlng = [...allPoints]
      /* Leaflet return distances in meters */
      this.UNIT_CONV = 1000;
      this.SUB_UNIT_CONV = 1000;
      this.UNIT = 'km';
      this.SUB_UNIT = 'm';

      if (this.options.unitSystem === 'imperial') {
        this.UNIT_CONV = 1609.344;
        this.SUB_UNIT_CONV = 5280;
        this.UNIT = 'mi';
        this.SUB_UNIT = 'ft';
      }

      this.measure = {
        scalar: 0,
        unit: this.SUB_UNIT
      };
    },

    cleanUpMarkers: function (fixed) {

      var layer = this.layer;

      if (layer) {
        layer.eachLayer(function (l) {
          if (l.options && l.options.type === 'tmp') {
            if (fixed) {
              l.options.type = 'fixed';
            } else {
              layer.removeLayer(l);
            }
          }
        });
      }
    },

    cleanUpFixed: function () {

      var layer = this.layer;

      if (layer) {
        layer.eachLayer(function (l) {
          if (l.options && (l.options.type === 'fixed')) {
            layer.removeLayer(l);
          }
        });
      }
    },

    convertDots: function () {

      var me = this,
        layer = this.layer;

      if (layer) {
        layer.eachLayer(function (l) {
          if (l.options && (l.options.type === 'dot')) {
            var m = l.options.marker,
              i = m ? m.options.icon.options : null,
              il = i ? i.html : '';

            if (il && il.indexOf(me.measure.unit) === -1) {
              var str = l.options.label,
                s = str.split(' '),
                e = parseFloat(s[0]),
                u = s[1],
                label = '';

              if (l.options.label.indexOf(me.measure.unit) !== -1) {
                label = l.options.label;

              } else if (u === me.UNIT) {
                label = (e * me.SUB_UNIT_CONV).toFixed(2) + ' ' + me.SUB_UNIT;

              } else if (u === me.SUB_UNIT) {
                label = (e / me.SUB_UNIT_CONV).toFixed(2) + ' ' + me.UNIT;
              }

              var cicon = L.divIcon({
                className: 'total-popup-label',
                html: label
              });

              m.setIcon(cicon);
            }

          }
        });
      }
    },

    displayMarkers: function (latlngs, multi, sum) {

      var x, y, label, ratio, p,
        latlng = latlngs[latlngs.length - 1],
        prevLatlng = latlngs[0],
        original = prevLatlng.distanceTo(latlng) / this.UNIT_CONV,
        dis = original;

      var p2 = this._map.latLngToContainerPoint(latlng),
        p1 = this._map.latLngToContainerPoint(prevLatlng),
        unit = 1;

      if (this.measure.unit === this.SUB_UNIT) {
        unit = this.SUB_UNIT_CONV;
        dis = dis * unit;
      }

      var t = (sum * unit) + dis,
        qu = sum * unit;

      for (var q = Math.floor(qu); q < t; q++) {
        ratio = (t - q) / dis;

        if (q % this.separation || q < qu) {
          continue;
        }

        x = (p2.x - ratio * (p2.x - p1.x));
        y = (p2.y - ratio * (p2.y - p1.y));

        p = L.point(x, y);

        /* render a circle spaced by separation */

        latlng = this._map.containerPointToLatLng(p);

        label = (q + ' ' + this.measure.unit);

        this.renderCircle(latlng, 0, this.layer, multi ? 'fixed' : 'tmp', label);

        this.last = t;
      }

      return original;
    },

    renderCircle: function (latLng, radius, layer, type, label) {

      var color = this.options.color,
        lineColor = this.options.color,
        azimut = '',
        nodeCls = '';

      type = type || 'circle';

      linesHTML = [];

      var options = {
        color: lineColor,
        fillOpacity: 1,
        opacity: 1,
        fill: true,
        type: type
      };

      var a = this.prevLatlng ? this._map.latLngToContainerPoint(this.prevLatlng) : null,
        b = this._map.latLngToContainerPoint(latLng);

      if (type === 'dot') {
        nodeCls = 'node-label';

        if (a && this.options.show_azimut) {
          azimut = ' <span class="azimut"> ' + this.lastAzimut + '&deg;</span>';
        }
      }

      p_latLng = this._map.containerPointToLatLng(b);

      if (label) {
        var cicon = L.divIcon({
          className: 'total-popup-label ' + nodeCls,
          html: '<span style="color: ' + color + ';">' + label + azimut + ' </span>'
        });

        options.icon = cicon;
        options.marker = L.marker(p_latLng, { icon: cicon, type: type }).addTo(layer);
        options.label = label;
      }

      var circle = L.circleMarker(latLng, options);

      circle.setRadius(3);
      circle.addTo(layer);

      return circle;
    },

    getAzimut: function (a, b) {

      var deg = 0;

      if (a && b) {
        deg = parseInt(Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI);

        if (deg > 0) {
          deg += 90;
        } else if (deg < 0) {
          deg = Math.abs(deg);
          if (deg <= 90) {
            deg = 90 - deg;
          } else {
            deg = 360 - (deg - 90);
          }
        }
      }

      this.lastAzimut = deg;

      return deg;
    },

    renderPolyline: function (latLngs, dashArray, layer) {
      var poly = L.polyline(latLngs, {
        color: this.options.color,
        weight: 3,
        opacity: 1,
        dashArray: dashArray
      });
      poly.addTo(layer);
      return poly;
    },

    renderMultiPolyline: function (latLngs, dashArray, layer) {
      /* Leaflet version 1+ delegated the concept of multi-poly-line to the polyline */
      var multi;

      if (L.version.startsWith('0')) {
        multi = L.multiPolyline(latLngs, {
          color: this.options.color,
          weight: 3,
          opacity: 1,
          dashArray: dashArray
        });
      } else {
        multi = L.polyline(latLngs, {
          color: this.options.color,
          weight: 3,
          opacity: 1,
          dashArray: dashArray
        });
      }

      multi.addTo(layer);

      return multi;
    },

    formatDistance: function (distance, precision) {

      var s = L.Util.formatNum((distance < 1 ? distance * parseFloat(this.SUB_UNIT_CONV) : distance), precision),
        u = (distance < 1 ? this.SUB_UNIT : this.UNIT);

      return { scalar: s, unit: u };
    },

    hasClass: function (target, classes) {
      var fn = L.DomUtil.hasClass;
      for (var i in classes) {
        if (fn(target, classes[i])) {
          return true;
        }
      }
      return false;
    },

    preClick: function (e) {
      var me = this,
        target = e.originalEvent.target;

      if (this.hasClass(target, ['leaflet-popup', 'total-popup-content'])) {
        return;
      }

      if (!me.layer) {
        me.initLayer();
      }

      me.cleanUpMarkers(true);

      me.fixedLast = me.last;
      me.prevLatlng = e.latlng;
      me.sum = 0;
    },

    getMouseClickHandler: function (e) {
      var me = this;
      me.fixedLast = me.last;
      me.sum = 0;

      if (me.poly) {
        me.latlngsList.push(me.latlngs);
        //ssi
        // me.allLatlng.push([e.latlng.lat, e.latlng.lng]);
        me.allLatlng.push(me.latlngs);// [{0,1},{0,1}]
        //ssi

        if (me.latlngsList.length > 2) {
          let uniqData = _.uniqBy(me.latlngsList, function (e) {
            return e;
          });
          me.latlngsList = uniqData
        }

        if (!me.multi) {
          me.multi = me.renderMultiPolyline(me.latlngsList, '5 5', me.layer, 'dot');
        } else {
          me.multi.setLatLngs(me.latlngsList);
        }
      }

      var o, dis;

      for (var l in me.latlngsList) {
        o = me.latlngsList[l];
        me.sum = o[0].distanceTo(o[1]) / me.UNIT_CONV;
      }

      if (me.measure.unit === this.SUB_UNIT) {
        dis = me.sum * me.SUB_UNIT_CONV;
      } else {
        dis = me.sum;
      }

      var s = dis.toFixed(2);

      me.renderCircle(e.latlng, 0, me.layer, 'dot', parseInt(s) ? (s + ' ' + me.measure.unit) : '');
      me.prevLatlng = e.latlng;
    },

    getMouseMoveHandler: function (e) {
      var azimut = '';

      if (this.prevLatlng) {
        var latLng = e.latlng;

        this.latlngs = [this.prevLatlng, e.latlng];

        if (!this.poly) {
          this.poly = this.renderPolyline(this.latlngs, '5 5', this.layer);
        } else {
          this.poly.setLatLngs(this.latlngs);
        }

        /* Distance in miles/meters */
        this.distance = parseFloat(this.prevLatlng.distanceTo(e.latlng)) / this.UNIT_CONV;

        /* scalar and unit */
        this.measure = this.formatDistance(this.distance, 2);
        // this.measure = this.formatDistance(this.distance + this.sum, 2);

        var a = this.prevLatlng ? this._map.latLngToContainerPoint(this.prevLatlng) : null,
          b = this._map.latLngToContainerPoint(latLng);

        if (a && this.options.show_azimut) {
          var style = 'color: ' + this.options.contrastingColor + ';';
          azimut = '<span class="azimut azimut-final" style="' + style + '"> &nbsp; ' + this.getAzimut(a, b) + '&deg;</span>';
        }

        /* tooltip with total distance */

        var label = this.measure.scalar + ' ' + this.measure.unit,
          html = '<span class="total-popup-content" style="background-color:' + this.options.color + '; color: ' + this.options.contrastingColor + '">' + label + azimut + '</span>';

        if (!this.total) {
          this.totalIcon = L.divIcon({ className: 'total-popup', html: html });

          this.total = L.marker(e.latlng, {
            icon: this.totalIcon,
            clickable: false
          }).addTo(this.layer);

        } else {
          this.totalIcon = L.divIcon({ className: 'total-popup', html: html });
          this.total.setLatLng(e.latlng);
          this.total.setIcon(this.totalIcon);
        }

        /* Rules for separation using only distance criteria */
        var ds = this.measure.scalar,
          old_separation = this.separation,
          digits = parseInt(ds).toString().length,
          num = Math.pow(10, digits),
          real = ds > (num / 2) ? (num / 10) : (num / 20),
          dimension = 0;

        this.separation = real;

        /* If there is a change in the segment length we want to re-space
           the dots on the multi line */
        if (old_separation !== this.separation && this.fixedLast) {
          this.cleanUpMarkers();
          this.cleanUpFixed();

          var multi_latlngs = this.multi.getLatLngs();

          for (var s in multi_latlngs) {
            // dimension += this.displayMarkers.apply(this, [multi_latlngs[s], true, dimension]);
          }
          // this.displayMarkers.apply(this, [this.poly.getLatLngs(), false, this.sum]);
          /* Review that the dots are in correct units */
          this.convertDots();
        } else {
          this.cleanUpMarkers();
          // this.displayMarkers.apply(this, [this.poly.getLatLngs(), false, this.sum]);
        }
      }
    },
    getDblClickHandler: function (e) {
      var azimut = '',
        me = this;

      me.allLatlng.push(me.latlngs); //[{0,1},{0,1}]
      // me.allLatlng.push([e.latlng.lat, e.latlng.lng])


      // ------------------- latlng for draw ------------
      var finalObject = JSON.parse(localStorage.getItem("finalObject")) || { shape: [], totalArea: 0 }

      var shapes = [...finalObject.shape && finalObject.shape.length > 0 ? finalObject.shape : []], measurement = null;

      finalObject.wasteDetail = [{ per: 0, area: 0, square: 0 }, { per: 10, area: 0, square: 0 }, { per: 12, area: 0, square: 0 }, { per: 15, area: 0, square: 0 }, { per: 17, area: 0, square: 0 }, { per: 20, area: 0, square: 0 }, { per: 22, area: 0, square: 0 }];
      finalObject.pitch = finalObject.pitch ? finalObject.pitch : "0/12"
      finalObject.totalSquare = 0
      finalObject.totalArea = 0

      // To make same first and end point create tempArray
      var tempArray = []

      var tmpo = JSON.parse(JSON.stringify(me.latlngsList))

      if (tmpo.length > 1) {
        tempArray.push((tmpo)[tmpo.length - 1][1], JSON.parse(JSON.stringify(e.latlng)))
        tmpo.push(tempArray)
      }

      var polygon = JSON.parse(localStorage.getItem("polygon"))

      let pitch = finalObject.pitch ? finalObject.pitch : "0/12"

      // ----------To push Corordinate with conditions that the coordinates falls inside or outside--------



      let gmapPolygons = shapes.length > 0 && shapes.map(shapePolygon => {
        var polyCord = shapePolygon.path.map(point => {
          return { lat: point[0].lat, lng: point[0].lng }
        })
        return new window.google.maps.Polygon({ paths: polyCord });
      })

      var exit = false, isTrue = true;
      if (finalObject.shape === undefined || finalObject.shape.length == 0) {
        shapes.push({
          path: tmpo, area: 0, areaWithPitch: 0, unit: "sqft",
          pitch: pitch,
          squares: 0,
          waste: [{ per: 0, area: 0, square: 0 },
          { per: 10, area: 0, square: 0 },
          { per: 12, area: 0, square: 0 },
          { per: 15, area: 0, square: 0 },
          { per: 17, area: 0, square: 0 },
          { per: 20, area: 0, square: 0 },
          { per: 22, area: 0, square: 0 }]
        })
        finalObject.shape = [...shapes]
      } else {
        var isOnEdge = false, isIntersect = false, lineTobePush, shapeIndex, matchedShape, minDistance;
        tmpo.map(tmpoLine => {
          finalObject.shape.map((shapePoly, shapePolyI) => {
            shapePoly.path.map(pathLine => {
              var line1 = turf.lineString([[tmpoLine[0].lat, tmpoLine[0].lng], [tmpoLine[1].lat, tmpoLine[1].lng]]);
              var line2 = turf.lineString([[pathLine[0].lat, pathLine[0].lng], [pathLine[1].lat, pathLine[1].lng]]);
              var intersect = turf.lineIntersect(line1, line2);

              // var dist = L.latLng([tmpoLine[0].lat, tmpoLine[0].lng]).distanceTo([
              //   pathLine[0].lat,
              //   pathLine[0].lng,
              // ]);

              if (intersect.features.length > 0) {
                // if (dist <= 1.5) {
                //   minDistance = dist
                // }

                isIntersect = true;
                var intersectionCoord = intersect.features[0].geometry.coordinates;


                var myPosition = new google.maps.LatLng(intersectionCoord[0], intersectionCoord[1]);
                var cascadiaFault = new google.maps.Polyline({
                  path: [
                    new google.maps.LatLng(pathLine[0].lat, pathLine[0].lng),
                    new google.maps.LatLng(pathLine[1].lat, pathLine[1].lng),
                  ]
                });

                if (window.google.maps.geometry.poly.isLocationOnEdge(myPosition, cascadiaFault, 10e-1)) {
                  isOnEdge = true;
                  shapeIndex = shapePolyI
                } else {
                  isOnEdge = false;
                }
              }
            })
          })
        })


        tmpo.map(line => {

          let lineStart = new window.google.maps.LatLng(
            line[0].lat,
            line[0].lng
          );
          let lineEnd = new window.google.maps.LatLng(line[1].lat, line[1].lng)

          gmapPolygons.map((gmapPolygon, polygonI) => {
            if (window.google.maps.geometry.poly.containsLocation(lineStart, gmapPolygon) == true || window.google.maps.geometry.poly.containsLocation(lineEnd, gmapPolygon) == true) {
              isTrue = true;
            } else {
              isTrue = false;
            }

            if (isTrue || isOnEdge || isIntersect) {
              if (shapeIndex === undefined || (shapeIndex == polygonI)) {
                finalObject.shape[polygonI].path.push(line)
              }
            } else {
              tmpo.map(line => {
                let pointStart = new window.google.maps.LatLng(
                  line[0].lat,
                  line[0].lng
                );
                let pointEnd = new window.google.maps.LatLng(line[1].lat, line[1].lng)
                for (let index = 0; index < gmapPolygons.length; index++) {
                  if (window.google.maps.geometry.poly.containsLocation(pointStart, gmapPolygons[index]) == true || window.google.maps.geometry.poly.containsLocation(pointEnd, gmapPolygons[index]) == true) {
                    exit = true;
                    break;
                  }
                }
              })

              if (exit === false) {
                finalObject.shape.push({
                  path: tmpo, area: 0, areaWithPitch: 0, unit: "sqft",
                  pitch: pitch,
                  squares: 0, waste: [{ per: 0, area: 0, square: 0 }, { per: 10, area: 0, square: 0 }, { per: 12, area: 0, square: 0 }, { per: 15, area: 0, square: 0 }, { per: 17, area: 0, square: 0 }, { per: 20, area: 0, square: 0 }, { per: 22, area: 0, square: 0 }]
                })
                exit = true
              }
            }
            // if (minDistance < 1.5) {
            //   matchedShape = finalObject.shape[polygonI].path
            // }
          })
        })


        // ssi test to make polygon with first and last same point(when user will not complete the shape at a time)

        // if (isIntersect && minDistance < 1.5) {

        //   var polygonCoords = matchedShape.length >= 3 && matchedShape.map(pth => {
        //     return [pth[0].lat, pth[0].lng]
        //   })

        //   var lineFeature = {
        //     "type": "Feature",
        //     "properties": {},
        //     "geometry": {
        //       "type": "LineString",
        //       "coordinates": polygonCoords
        //     }
        //   };

        //   var polyFeature = turf.lineToPolygon(lineFeature);

        //   polygon.push(polyFeature.geometry.coordinates[0])

        //   localStorage.setItem("polygon", JSON.stringify(polygon))
        // }
        // ssi test
      }


      // Set out the finalObject
      finalObject.shape.length > 0 && finalObject.shape.map(poly => {
        poly.path.map(pl => {
          var distance = L.latLng([pl[0].lat, pl[0].lng]).distanceTo([
            pl[1].lat,
            pl[1].lng,
          ]);

          var feet = (distance.toFixed(4) * 3.2808).toFixed(2);
          pl.map(p => {

            if (!p.hasOwnProperty("color") && !p.hasOwnProperty("length") && !p.hasOwnProperty("label")) {
              {
                p.color = "#1e0fff", p.label = "Unspecified", p.length = `${feet} ft`
              }
            }
          })
        })
      })


      finalObject.shape.length > 0 && finalObject.shape.map(shp => {
        var types = null;
        shp.path.map(path => {
          let unit = path[1].length.split(" ").pop();
          let length = parseFloat(path[1].length.split(" ")[0]);

          var distance = L.latLng([path[0].lat, path[0].lng]).distanceTo([
            path[1].lat,
            path[1].lng,
          ]);

          var feet = (distance.toFixed(4) * 3.2808).toFixed(2);
          if (
            types &&
            types[path[1].label] != null &&
            path[1].label == types[path[1].label].label
          ) {
            types[path[1].label].length += length;
          } else {
            types = {
              ...types,
              [path[1].label]: {
                length: length,
                label: path[1].label,
                color: path[1].color,
                unit,
              },
            };
          }

          shp.type = {
            ...types,
            ..._.omit(
              {
                ...types,
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
              [...Object.keys(types)]
            ),
          };
        })
        // Add measurement object in finalObject to manage total lenght with color details
        shp.type &&
          Object.keys(shp.type).map((key, index) => {
            if (measurement && measurement[key] != null) {
              measurement[key].length += shp.type[key].length;
            } else {
              measurement = {
                ...measurement,
                [key]: {
                  label: shp.type[key].label,
                  color: shp.type[key].color,
                  length: shp.type[key].length,
                  unit: shp.type[key].unit,
                },
              };
            }
          });
        finalObject.measurement = measurement;
      })

      localStorage.setItem("finalObject", JSON.stringify(finalObject))

      if (!this.total) {
        return;
      }

      this.layer.off('click');

      L.DomEvent.stop(e);

      var workspace = this.layer,
        label = this.measure.scalar + ' ' + this.measure.unit + ' ',
        total_scalar = this.measure.unit === this.SUB_UNIT ? this.measure.scalar / this.UNIT_CONV : this.measure.scalar,
        total_latlng = this.total.getLatLng(),
        total_label = this.total,
        html = [
          '<div class="total-popup-content" style="background-color:' + this.options.color + '; color: ' + this.options.contrastingColor + '">' + label + azimut,
          '  <svg class="close" viewbox="0 0 45 35">',
          '   <path  style="stroke: ' + this.options.contrastingColor + '" class="close" d="M 10,10 L 30,30 M 30,10 L 10,30" />',
          '  </svg>',
          '</div>'
        ].join('');

      // html = [
      //     '<div class="total-popup-content" style="background-color:' + this.options.color + '; color: ' + this.options.contrastingColor + '">' + label + azimut,
      //     '  <svg class="close" viewbox="0 0 45 35">',
      //     '   <path  style="stroke: ' + this.options.contrastingColor + '" class="close" d="M 10,10 L 30,30 M 30,10 L 10,30" />',
      //     '  </svg>',
      //     '</div>'
      // ].join('');


      this.totalIcon = L.divIcon({ className: 'total-popup', html: html });
      this.total.setIcon(this.totalIcon);

      var data = {
        total: this.measure,
        total_label: total_label,
        unit: this.UNIT_CONV,
        sub_unit: this.SUB_UNIT_CONV
      };

      var fireSelected = function (e) {
        if (L.DomUtil.hasClass(e.originalEvent.target, 'close')) {
          var polyShapeDeleteId, polygonDeleteId
          var finalObject = JSON.parse(localStorage.getItem("finalObject"))
          var polygon = JSON.parse(localStorage.getItem("polygon"))
          workspace.eachLayer(layer => {
            if (layer._latlng) {
              finalObject.shape.length > 0 && finalObject.shape.map((shape, shapeIndex) => {
                shape.path.map((path, pathIndex) => {
                  // Finding selected shape in finalObject
                  if ((layer._latlng.lat == path[0].lat || layer._latlng.lat == path[1].lat) && (layer._latlng.lng == path[0].lng || layer._latlng.lng == path[1].lng)) {
                    polyShapeDeleteId = shapeIndex
                  }
                  // Finding selected shape in polygon
                  polygon.map((polyShape, polyShapeIndex) => {
                    polyShape.map(poly => {
                      if (poly[0] == layer._latlng.lat || poly[1] == layer._latlng.lng) {
                        polygonDeleteId = polyShapeIndex
                      }
                    })
                  })
                })
              })
            }
          })
          // Delete shape on draw page on click close icon
          finalObject.shape.splice(polyShapeDeleteId, 1)
          polygon.splice(polygonDeleteId, 1)
          me.mainLayer.removeLayer(workspace);

          localStorage.setItem("finalObject", JSON.stringify(finalObject))
          localStorage.setItem("polygon", JSON.stringify(polygon))
        } else {
          workspace.fireEvent('selected', data);
        }
      };

      workspace.on('click', fireSelected);
      workspace.fireEvent('selected', data);
      // this.resetRuler(false);
      this.resetRuler(false, me.allLatlng);
    },
    purgeLayers: function (layers) {
      for (var i in layers) {
        if (layers[i]) {
          this.layer.removeLayer(layers[i]);
        }
      }
    },
    layerSelected: function (e) {
    }
  });

})();
