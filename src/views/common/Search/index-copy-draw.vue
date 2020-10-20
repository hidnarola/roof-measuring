<template>
  <section id="playground">
    <h4>Search</h4>
    <div class="separter"></div>
    <div style="border: 1px solid grey;padding: 25px 10px;border-radius: 5px">
      <div class="col-sm-12">
        <div class="row">
          <div class="col-sm-8">
            <div class="map-box">
              <!-- <button @click="removeLine">Remove Line</button> -->
              <input
                id="pac-input"
                @keyup="value = $event.target.value"
                class="controls serach-input"
                type="text"
                placeholder="Search Box"
              />
              <div id="map"></div>
            </div>
          </div>
          <div class="col-sm-4">
            <div id="cropped_Img">
              <img src id="preview_image" />
            </div>
            <div class="text-center">
              <b-button
                v-b-modal.modal-1
                class="btn crop-btn"
                :disabled="value === null"
                @click="openModal"
              >Crop</b-button>
              <b-modal id="modal-1" title @ok="handleOk">
                <p
                  class="my-4"
                  v-if="value === null || value === '' "
                >Please Enter your address in search Box !</p>
                <p class="my-4" v-else>Are you sure to take capture this location ?</p>
              </b-modal>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import fxDebounceInput from "@/components/frogx-ui/debounceInput/index";
import API_KEY from "../../../constant"
var polyOptions = {
  strokeWeight: 0,
  fillOpacity: 0.45,
  editable: true,
};
export default {
  name: "Search",
  components: { fxDebounceInput },

  data() {
    return {
      isCrop: false,
      value: null,
      isOpenModal: false,
      zoomMap: "19",
      mapSize: "1000x500",
      lat: null,
      lng: null,
    };
  },
  mounted() {
    this.initAutocomplete();
  },
  methods: {
    makeEnableCrop() {
      this.isCrop = !this.isCrop;
    },
    openModal() {
      this.isOpenModal = !this.isOpenModal;
    },
    createMapImage({ lat, lng }) {
      let _this = this;
      var url = `https://maps.googleapis.com/maps/api/staticmap?zoom=${_this.zoomMap}&size=${_this.mapSize}&maptype=satellite&markers=color:red%7Clabel:S%7C${lat},${lng}&key=${API_KEY}`;
      document.getElementById("preview_image").src = url;
    },
    handleOk(bvModalEvt) {
      if (this.value !== null || this.value !== " ") {
        bvModalEvt.preventDefault();
        var address = this.value;
        let geocoder = new window.google.maps.Geocoder();
        let _this = this;
        geocoder.geocode({ address: address }, function (results) {
          _this.lat = results[0] && results[0].geometry.location.lat();
          _this.lng = results[0] && results[0].geometry.location.lng();
          _this.createMapImage({ lat: _this.lat, lng: _this.lng });
        });
        this.$nextTick(() => {
          this.$bvModal.hide("modal-1");
        });
      }
    },
    // addLine() {
    //   flightPath.setMap(map);
    // },
    removeLine() {
      // console.log('Hi',google.maps.drawing);
      // google.maps.event.removeListener();
    },

    initAutocomplete() {
      let map =
        window.google &&
        new window.google.maps.Map(document.getElementById("map"), {
          center: {
            lat: -33.8688,
            lng: 151.2195,
          },
          zoom: 22,
          mapTypeId: "satellite",
        }); // Create the search box and link it to the UI element.

      const input = document.getElementById("pac-input");
      const searchBox =
        window.google && new window.google.maps.places.SearchBox(input);

      map &&
        map.controls[
          window.google && window.google.maps.ControlPosition.TOP_LEFT
        ].push(input); // Bias the SearchBox results towards current map's viewport.

      map &&
        map.addListener("bounds_changed", () => {
          searchBox.setBounds(map.getBounds());
        });
      let markers = []; // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.

      searchBox &&
        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          } // Clear out the old markers.

          markers.forEach((marker) => {
            marker.setMap(null);
          });
          markers = []; // For each place, get the icon, name and location.

          const bounds = window.google && new window.google.maps.LatLngBounds();
          places.forEach((place) => {
            if (!place.geometry) {
              console.log("Returned place contains no geometry");
              return;
            }
            markers.push(
              window.google &&
                new window.google.maps.Marker({
                  draggable: true,
                  map,
                  title: place.name,
                  position: place.geometry.location,
                })
            );
            let _this = this;
            markers.forEach((marker) => {
              google.maps.event.addListener(marker, "dragend", function (
                event
              ) {
                _this.lng = event.latLng.lng();
                _this.lat = event.latLng.lat();

                _this.createMapImage({ lat: _this.lat, lng: _this.lng });
              });
            });

            if (place.geometry.viewport) {
              // Only geocodes have viewport.
              bounds.union(place.geometry.viewport);
            } else {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
        });
      const drawingManager = new google.maps.drawing.DrawingManager({
        // drawingMode: google.maps.drawing.OverlayType.MARKER,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            // google.maps.drawing.OverlayType.MARKER,
            google.maps.drawing.OverlayType.CIRCLE,
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.POLYLINE,
            google.maps.drawing.OverlayType.RECTANGLE,
          ],
        },
        markerOptions: {
          draggable: true,
        },
        polylineOptions: {
          editable: true,
        },
        rectangleOptions: polyOptions,
        circleOptions: polyOptions,
        polygonOptions: polyOptions,
        // circleOptions: {
        //   fillColor: "#ffff00",
        //   fillOpacity: 1,
        //   strokeWeight: 5,
        //   clickable: true,
        //   editable: true,
        //   zIndex: 1
        // }
      });

      drawingManager.setMap(map);
      console.log("drawingManager => ", drawingManager);
      console.log("map here => ", map);
    },
  },
};
</script>

<style  scoped>
canvas {
  border: 1px solid black;
}
</style>
